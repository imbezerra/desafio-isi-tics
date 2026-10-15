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
import { TransactionResponse } from '../../../src/market/presenters/transaction.presenter';

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test')) {
  throw new Error('Informe TEST_DATABASE_URL para um banco exclusivo terminado em _test.');
}

const input = {
  name: 'Zé "Foguete"; Lima',
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
const csvHeader = 'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n';
const emptySummary = {
  total_spent: 0,
  total_received: 0,
  total_fees: 0,
  total_penalties: 0,
  total_profit: 0,
};
type TransactionHistory = { data: TransactionResponse[]; summary: typeof emptySummary };

describe('histórico e exportação com PostgreSQL real', () => {
  let app: INestApplication;
  let origin: string;
  const database = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  function request(requestPath: string, method = 'GET', body?: unknown) {
    return fetch(`${origin}/api/v1${requestPath}`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  async function createPlayer() {
    const response = await request('/players', 'POST', input);
    expect(response.status).toBe(201);
    return (await response.json()) as { id: number };
  }

  async function createClub() {
    const response = await request('/clubs', 'POST', { name: 'Águias FC', acronym: 'AGU' });
    expect(response.status).toBe(201);
    return (await response.json()) as { id: number; cash: number };
  }

  async function prepareHistory() {
    const player = await createPlayer();
    const club = await createClub();
    expect(
      (
        await request(`/players/${player.id}/condition`, 'PATCH', {
          condition: 'MAL_CONDICIONADO',
        })
      ).status,
    ).toBe(200);
    const end = formatBrasiliaDateTime(new Date(Date.now() + 40 * 86_400_000)).replace(
      /:\d\d-03:00$/,
      '-03:00',
    );
    const purchase = await request(`/players/${player.id}/buy`, 'POST', {
      club_id: club.id,
      loyalty_until: end,
    });
    expect(purchase.status).toBe(200);
    expect(
      (await request(`/players/${player.id}`, 'PUT', { ...input, name: 'Meia Nova' })).status,
    ).toBe(200);
    expect(
      (await request(`/players/${player.id}/condition`, 'PATCH', { condition: 'APTO' })).status,
    ).toBe(200);
    const sale = await request(`/players/${player.id}/sell`, 'POST');
    expect(sale.status).toBe(200);
    // Data igual para provar que o id decrescente desempata a ordem.
    await database.transaction.updateMany({
      data: { createdAt: new Date('2026-11-05T19:40:00Z') },
    });
    return { clubId: club.id, playerId: player.id };
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

  it('lista snapshots, ordena pelo id em empate e concilia os totais com o caixa', async () => {
    const { clubId } = await prepareHistory();
    const response = await request(`/clubs/${clubId}/transactions`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    const history = (await response.json()) as TransactionHistory;
    expect(history.data.map((t) => [t.type, t.player_name, t.value])).toEqual([
      ['VENDA', 'Meia Nova', 40],
      ['COMPRA', input.name, 37],
    ]);
    expect(history.data[0].id).toBeGreaterThan(history.data[1].id);
    expect(history.summary).toEqual({
      total_spent: 38.85,
      total_received: 35.7,
      total_fees: 2.15,
      total_penalties: 4,
      total_profit: 3,
    });
    const cash = (await database.club.findUniqueOrThrow({ where: { id: clubId } })).cash.toNumber();
    expect(300 + history.data.reduce((sum, t) => sum + t.cash_change, 0)).toBeCloseTo(cash, 2);
  });

  it('combina filtros e calcula summary somente das transações filtradas', async () => {
    const { clubId, playerId } = await prepareHistory();
    const sale = await request(
      `/clubs/${clubId}/transactions?type=VENDA&player_id=${playerId}&extra=x`,
    );
    const history = (await sale.json()) as TransactionHistory;
    expect(history.data.map((t) => t.type)).toEqual(['VENDA']);
    expect(history.summary).toEqual({
      total_spent: 0,
      total_received: 35.7,
      total_fees: 0.3,
      total_penalties: 4,
      total_profit: 3,
    });
    const both = await request(`/clubs/${clubId}/transactions?type=COMPRA,VENDA`);
    expect(((await both.json()) as TransactionHistory).data).toHaveLength(2);
    const withoutHistory = await createPlayer();
    const empty = await request(`/clubs/${clubId}/transactions?player_id=${withoutHistory.id}`);
    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual({ data: [], summary: emptySummary });
  });

  it('exporta UTF-8 sem BOM, nomes escapados, centavos e LF, na ordem filtrada', async () => {
    const { clubId } = await prepareHistory();
    const response = await request(`/clubs/${clubId}/transactions/export`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(bytes[0]).toBe(0x64);
    expect(bytes[bytes.length - 1]).toBe(0x0a);
    expect(bytes.includes(0x0d)).toBe(false);
    const purchaseCsv =
      '2026-11-05T16:40:00-03:00;COMPRA;"Zé ""Foguete""; Lima";37,00;1,85;0,00;;-38,85\n';
    expect(bytes.toString('utf8')).toBe(
      csvHeader +
        '2026-11-05T16:40:00-03:00;VENDA;Meia Nova;40,00;0,30;4,00;3,00;35,70\n' +
        purchaseCsv,
    );
    const filtered = await request(`/clubs/${clubId}/transactions/export?type=COMPRA`);
    expect(await filtered.text()).toBe(csvHeader + purchaseCsv);
  });

  it('retorna histórico zerado e só cabeçalho CSV quando vazio', async () => {
    const club = await createClub();
    expect(await (await request(`/clubs/${club.id}/transactions`)).json()).toEqual({
      data: [],
      summary: emptySummary,
    });
    expect(await (await request(`/clubs/${club.id}/transactions/export?type=VENDA`)).text()).toBe(
      csvHeader,
    );
  });

  it('preserva transações de excluído, mas recusa filtro pelo jogador excluído', async () => {
    const { clubId, playerId } = await prepareHistory();
    expect((await request(`/players/${playerId}`, 'DELETE')).status).toBe(204);
    const response = await request(`/clubs/${clubId}/transactions`);
    expect(((await response.json()) as TransactionHistory).data).toHaveLength(2);
    expect(
      (await (await request(`/clubs/${clubId}/transactions/export`)).text()).split('\n'),
    ).toHaveLength(4);
    for (const suffix of ['', '/export']) {
      const error = await request(`/clubs/${clubId}/transactions${suffix}?player_id=${playerId}`);
      expect(error.status).toBe(404);
      expect(error.headers.get('content-type')).toContain('application/json');
      expect(await error.json()).toEqual({ message: expect.any(String) });
    }
  });

  it('responde erros de filtros e recursos em JSON também na exportação', async () => {
    const club = await createClub();
    for (const suffix of ['', '/export']) {
      for (const query of ['type=', 'type=COMPRA,COMPRA', 'type=compra', 'player_id=01']) {
        const error = await request(`/clubs/${club.id}/transactions${suffix}?${query}`);
        expect(error.status).toBe(400);
        expect(error.headers.get('content-type')).toContain('application/json');
        expect(await error.json()).toEqual({ message: expect.any(String) });
      }
      expect((await request(`/clubs/999/transactions${suffix}`)).status).toBe(404);
      expect((await request(`/clubs/${club.id}/transactions${suffix}?player_id=999`)).status).toBe(
        404,
      );
    }
    expect(await database.transaction.count()).toBe(0);
  });
});
