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
  throw new Error(
    'Informe TEST_DATABASE_URL apontando para um banco exclusivo com nome terminado em _test.',
  );
}

const playerInput = {
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

type ApiResponse = Record<string, unknown> & {
  id: number;
  name: string;
  created_at: string;
  contract: Record<string, unknown>;
  players: { id: number; contract: Record<string, unknown> }[];
};

describe('compra de jogador com PostgreSQL real', () => {
  let app: INestApplication;
  let origin: string;
  const database = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  async function request(requestPath: string, method = 'GET', body?: unknown) {
    const response = await fetch(`${origin}/api/v1${requestPath}`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, data: (await response.json()) as ApiResponse };
  }

  async function createPlayer(changes: Record<string, unknown> = {}) {
    const response = await request('/players', 'POST', { ...playerInput, ...changes });
    expect(response.status).toBe(201);
    return response.data;
  }

  async function createClub() {
    const response = await request('/clubs', 'POST', { name: 'Águias FC', acronym: 'AGU' });
    expect(response.status).toBe(201);
    return response.data;
  }

  function loyaltyEnd(days = 200) {
    return formatBrasiliaDateTime(new Date(Date.now() + days * 86_400_000)).replace(
      /:\d\d-03:00$/,
      '-03:00',
    );
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

  it('compra, grava contrato e transação e atualiza clube e jogador na mesma operação', async () => {
    const player = await createPlayer();
    const club = await createClub();
    const end = loyaltyEnd();
    const purchase = await request(`/players/${player.id}/buy`, 'POST', {
      club_id: club.id,
      loyalty_until: end,
      cash: 999,
    });
    expect(purchase.status).toBe(200);
    expect(purchase.data).toMatchObject({
      club_id: club.id,
      player_id: player.id,
      player_name: 'Meia Lua',
      type: 'COMPRA',
      value: 40,
      fee: 2,
      penalty: 0,
      profit: null,
      cash_change: -42,
      club_cash: 258,
      contract: { purchase_value: 40, status: 'ATIVO' },
    });
    expect(purchase.data.contract.loyalty_until).toMatch(/-03:00$/);
    expect(purchase.data.created_at).toMatch(/-03:00$/);
    expect(await database.contract.count()).toBe(1);
    expect(await database.transaction.count()).toBe(1);
    expect((await database.player.findUniqueOrThrow({ where: { id: player.id } })).clubId).toBe(
      club.id,
    );
    const query = await request(`/clubs/${club.id}`);
    expect(query.data).toMatchObject({ cash: 258, squad_value: 40, net_worth: 298 });
    expect(query.data.players[0].contract).toMatchObject({
      purchase_value: 40,
      remaining_days: expect.any(Number),
      penalty_rate: 20,
    });
    expect(query.data.players[0].contract.loyalty_until).toMatch(/-03:00$/);
  });

  it('aceita custo igual à metade exata do caixa e recusa acima dela', async () => {
    const player = await createPlayer();
    const club = await createClub();
    await database.club.update({ where: { id: club.id }, data: { cash: '100' } });
    await database.player.update({ where: { id: player.id }, data: { baseValue: '47.62' } });
    const purchase = await request(`/players/${player.id}/buy`, 'POST', {
      club_id: club.id,
      loyalty_until: loyaltyEnd(),
    });
    expect(purchase.status).toBe(200);
    expect(purchase.data).toMatchObject({
      value: 47.62,
      fee: 2.38,
      cash_change: -50,
      club_cash: 50,
    });

    await database.club.update({ where: { id: club.id }, data: { cash: '100' } });
    const other = await createPlayer();
    await database.player.update({ where: { id: other.id }, data: { baseValue: '48' } });
    const rejected = await request(`/players/${other.id}/buy`, 'POST', {
      club_id: club.id,
      loyalty_until: loyaltyEnd(),
    });
    expect(rejected.status).toBe(409);
    expect(await database.contract.count()).toBe(1);
    expect(
      (await database.player.findUniqueOrThrow({ where: { id: other.id } })).clubId,
    ).toBeNull();
  });

  it('usa o valor de mercado atual e devolve elenco ordenado com contratos', async () => {
    const club = await createClub();
    const midfielder = await createPlayer();
    const goalkeeper = await createPlayer({
      name: 'Rui Prado',
      position: 'GOL',
      age: 20,
      agility: 30,
    });
    expect(
      (
        await request(`/players/${goalkeeper.id}/condition`, 'PATCH', {
          condition: 'MAL_CONDICIONADO',
        })
      ).status,
    ).toBe(200);
    const goalkeeperValue = (await request(`/players/${goalkeeper.id}`)).data.market_value;
    const input = { club_id: club.id, loyalty_until: loyaltyEnd(40) };
    expect((await request(`/players/${midfielder.id}/buy`, 'POST', input)).status).toBe(200);
    const goalkeeperPurchase = await request(`/players/${goalkeeper.id}/buy`, 'POST', input);
    expect(goalkeeperPurchase.status).toBe(200);
    expect(goalkeeperPurchase.data.value).toBe(goalkeeperValue);
    const query = await request(`/clubs/${club.id}`);
    expect(query.data.players.map((player) => player.id)).toEqual([goalkeeper.id, midfielder.id]);
    expect(query.data.players[0].contract).toMatchObject({
      remaining_days: 40,
      penalty_rate: 10,
    });
    expect(query.data.squad_value).toBeCloseTo(40 + Number(goalkeeperValue), 2);
  });

  it('recusa data inválida, clube ausente, jogador inexistente e jogador ocupado', async () => {
    const player = await createPlayer();
    const club = await createClub();
    for (const loyalty_until of ['2027-02-30T10:15-03:00', loyaltyEnd(-1), loyaltyEnd(1096)]) {
      expect(
        (
          await request(`/players/${player.id}/buy`, 'POST', {
            club_id: club.id,
            loyalty_until,
          })
        ).status,
      ).toBe(400);
    }
    expect(
      (
        await request(`/players/${player.id}/buy`, 'POST', {
          club_id: 0,
          loyalty_until: loyaltyEnd(),
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(`/players/${player.id}/buy`, 'POST', {
          club_id: 999,
          loyalty_until: loyaltyEnd(),
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await request('/players/999/buy', 'POST', {
          club_id: club.id,
          loyalty_until: loyaltyEnd(),
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(`/players/${player.id}/buy`, 'POST', {
          club_id: club.id,
          loyalty_until: loyaltyEnd(),
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(`/players/${player.id}/buy`, 'POST', {
          club_id: club.id,
          loyalty_until: loyaltyEnd(),
        })
      ).status,
    ).toBe(409);
    expect(await database.transaction.count()).toBe(1);
  });

  it('recusa clube que já vendeu o jogador e elenco com 12 membros', async () => {
    const player = await createPlayer();
    const club = await createClub();
    await database.transaction.create({
      data: {
        playerId: player.id,
        clubId: club.id,
        playerName: player.name as string,
        type: 'VENDA',
        value: '40',
        fee: '0',
        penalty: '0',
        profit: '0',
        cashChange: '40',
      },
    });
    expect(
      (
        await request(`/players/${player.id}/buy`, 'POST', {
          club_id: club.id,
          loyalty_until: loyaltyEnd(),
        })
      ).status,
    ).toBe(409);
    await database.transaction.deleteMany();
    await database.player.createMany({
      data: Array.from({ length: 12 }, (_, index) => ({
        name: `Jogador Reserva ${index}`,
        position: 'ATA',
        agility: 70,
        age: 25,
        baseValue: '10',
        condition: 'APTO',
        clubId: club.id,
        pace: 50,
        shooting: 50,
        passing: 50,
        dribbling: 50,
        defending: 50,
        physical: 50,
        potential: 50,
      })),
    });
    expect(
      (
        await request(`/players/${player.id}/buy`, 'POST', {
          club_id: club.id,
          loyalty_until: loyaltyEnd(),
        })
      ).status,
    ).toBe(409);
    expect(await database.contract.count()).toBe(0);
  });

  it('desfaz caixa, elenco e contrato se o registro da transação falhar', async () => {
    const player = await createPlayer();
    const club = await createClub();
    await database.$executeRaw`ALTER TABLE transacoes ADD CONSTRAINT teste_falha_compra CHECK (tipo <> 'COMPRA')`;
    try {
      const purchase = await request(`/players/${player.id}/buy`, 'POST', {
        club_id: club.id,
        loyalty_until: loyaltyEnd(),
      });
      expect(purchase.status).toBe(500);
      expect(await database.contract.count()).toBe(0);
      expect(await database.transaction.count()).toBe(0);
      expect(
        (await database.club.findUniqueOrThrow({ where: { id: club.id } })).cash.toNumber(),
      ).toBe(300);
      expect(
        (await database.player.findUniqueOrThrow({ where: { id: player.id } })).clubId,
      ).toBeNull();
    } finally {
      await database.$executeRaw`ALTER TABLE transacoes DROP CONSTRAINT teste_falha_compra`;
    }
  });
});
