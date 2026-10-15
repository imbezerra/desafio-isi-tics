import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { configureApi } from '../../../src/app.config';
import { ClubsModule } from '../../../src/clubs/clubs.module';
import { formatBrasiliaDateTime } from '../../../src/common/parsers/date.parser';
import { PrismaModule } from '../../../src/database/prisma.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { PlayersModule } from '../../../src/players/players.module';
import { MarketModule } from '../../../src/market/market.module';

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test')) {
  throw new Error('Informe TEST_DATABASE_URL para um banco exclusivo terminado em _test.');
}

const input = {
  name: 'Meia Lua',
  position: 'MEI',
  agility: 85,
  age: 25,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
};

describe('venda de jogadores com PostgreSQL real', () => {
  let app: INestApplication;
  let origin: string;
  const database = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  async function request(requestPath: string, method = 'GET', body?: unknown) {
    const response = await fetch(`${origin}/api/v1${requestPath}`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      data: (await response.json()) as Record<string, unknown> & { id: number },
    };
  }

  async function preparePurchase(condition = 'APTO') {
    const player = await request('/players', 'POST', input);
    const club = await request('/clubs', 'POST', { name: 'Águias FC', acronym: 'AGU' });
    expect(player.status).toBe(201);
    expect(club.status).toBe(201);
    await request(`/players/${player.data.id}/condition`, 'PATCH', { condition: condition });
    const end = formatBrasiliaDateTime(new Date(Date.now() + 40 * 86_400_000)).replace(
      /:\d\d-03:00$/,
      '-03:00',
    );
    const purchase = await request(`/players/${player.data.id}/buy`, 'POST', {
      club_id: club.data.id,
      loyalty_until: end,
    });
    expect(purchase.status).toBe(200);
    return { playerId: player.data.id, clubId: club.data.id, purchase: purchase.data };
  }

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [PrismaModule, PlayersModule, ClubsModule, MarketModule],
    })
      .overrideProvider(PrismaService)
      .useValue(database)
      .compile();
    app = testingModule.createNestApplication({ bodyParser: false });
    configureApi(app);
    await app.listen(0, '127.0.0.1');
    origin = await app.getUrl();
  });

  afterAll(async () => {
    await app?.close();
    await database.$disconnect();
  });
  beforeEach(async () => {
    await database.$executeRaw`TRUNCATE TABLE clubes, jogadores RESTART IDENTITY CASCADE`;
  });

  it('vende com lucro, multa, comissão e snapshots, liberando jogador e escalação', async () => {
    const { playerId, clubId } = await preparePurchase('MAL_CONDICIONADO');
    await request(`/players/${playerId}/condition`, 'PATCH', { condition: 'APTO' });
    await request(`/players/${playerId}`, 'PUT', { ...input, name: 'Novo Nome' });
    await database.club.update({ where: { id: clubId }, data: { formation: '2-1-1' } });
    await database.lineupEntry.create({ data: { clubId, playerId } });
    const sale = await request(`/players/${playerId}/sell`, 'POST');
    expect(sale.status).toBe(200);
    expect(sale.data).toMatchObject({
      club_id: clubId,
      player_id: playerId,
      player_name: 'Novo Nome',
      type: 'VENDA',
      value: 40,
      fee: 0.3,
      penalty: 4,
      profit: 3,
      cash_change: 35.7,
      purchase_value: 37,
      remaining_days: 40,
      penalty_rate: 10,
      contract_status: 'RESCINDIDO',
      club_cash: 296.85,
      created_at: expect.stringMatching(/-03:00$/),
    });
    expect(
      (await database.player.findUniqueOrThrow({ where: { id: playerId } })).clubId,
    ).toBeNull();
    expect(await database.lineupEntry.count()).toBe(0);
    expect((await database.club.findUniqueOrThrow({ where: { id: clubId } })).formation).toBe(
      '2-1-1',
    );
    const contract = await database.contract.findFirstOrThrow();
    expect(contract.status).toBe('RESCINDIDO');
    expect(contract.closedAt).not.toBeNull();
    const transactions = await database.transaction.findMany({ orderBy: { id: 'asc' } });
    expect(transactions.map((t) => t.playerName)).toEqual(['Meia Lua', 'Novo Nome']);
  });

  it('encerra fidelidade cumprida sem multa e ignora até corpo JSON malformado', async () => {
    const { playerId } = await preparePurchase();
    await database.contract.updateMany({ data: { loyaltyUntil: new Date(Date.now() - 60_000) } });
    const response = await fetch(`${origin}/api/v1/players/${playerId}/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalido',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      penalty: 0,
      fee: 0,
      profit: 0,
      remaining_days: 0,
      penalty_rate: 0,
      contract_status: 'ENCERRADO',
      cash_change: 40,
      club_cash: 298,
    });
  });

  it('mantém prejuízo com sinal e não cobra comissão', async () => {
    const { playerId } = await preparePurchase();
    await request(`/players/${playerId}/condition`, 'PATCH', { condition: 'MAL_CONDICIONADO' });
    expect((await request(`/players/${playerId}/sell`, 'POST')).data).toMatchObject({
      value: 37,
      purchase_value: 40,
      profit: -3,
      fee: 0,
      penalty: 3.7,
      cash_change: 33.3,
    });
  });

  it('recusa livre e excluído e impede recompra apenas pelo clube vendedor', async () => {
    expect((await request('/players/999/sell', 'POST')).status).toBe(404);
    const { playerId, clubId } = await preparePurchase();
    expect((await request(`/players/${playerId}/sell`, 'POST')).status).toBe(200);
    expect((await request(`/players/${playerId}/sell`, 'POST')).status).toBe(409);
    const end = formatBrasiliaDateTime(new Date(Date.now() + 86_400_000)).replace(
      /:\d\d-03:00$/,
      '-03:00',
    );
    expect(
      (
        await request(`/players/${playerId}/buy`, 'POST', {
          club_id: clubId,
          loyalty_until: end,
        })
      ).status,
    ).toBe(409);
    const other = await request('/clubs', 'POST', { name: 'Delta FC', acronym: 'DFC' });
    expect(
      (
        await request(`/players/${playerId}/buy`, 'POST', {
          club_id: other.data.id,
          loyalty_until: end,
        })
      ).status,
    ).toBe(200);
    const freePlayer = await request('/players', 'POST', input);
    await database.player.update({
      where: { id: freePlayer.data.id },
      data: { deletedAt: new Date() },
    });
    expect((await request(`/players/${freePlayer.data.id}/sell`, 'POST')).status).toBe(404);
  });

  it('desfaz todos os efeitos se a gravação de VENDA falhar', async () => {
    const { playerId, clubId } = await preparePurchase();
    await database.lineupEntry.create({ data: { clubId, playerId } });
    await database.$executeRaw`ALTER TABLE transacoes ADD CONSTRAINT teste_falha_venda CHECK (tipo <> 'VENDA')`;
    try {
      expect((await request(`/players/${playerId}/sell`, 'POST')).status).toBe(500);
      expect(
        (await database.club.findUniqueOrThrow({ where: { id: clubId } })).cash.toNumber(),
      ).toBe(258);
      expect((await database.player.findUniqueOrThrow({ where: { id: playerId } })).clubId).toBe(
        clubId,
      );
      expect(await database.lineupEntry.count()).toBe(1);
      expect(await database.transaction.count()).toBe(1);
      expect(await database.contract.findFirstOrThrow()).toMatchObject({
        status: 'ATIVO',
        closedAt: null,
      });
    } finally {
      await database.$executeRaw`ALTER TABLE transacoes DROP CONSTRAINT teste_falha_venda`;
    }
  });
});
