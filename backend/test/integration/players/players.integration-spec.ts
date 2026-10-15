import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { configureApi } from '../../../src/app.config';
import { ClubsModule } from '../../../src/clubs/clubs.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { PrismaModule } from '../../../src/database/prisma.module';
import { PlayerResponse } from '../../../src/players/presenters/player.presenter';
import { PlayersModule } from '../../../src/players/players.module';

// O teste exige um banco exclusivo, já criado pelas migrations.
const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test')) {
  throw new Error(
    'Informe TEST_DATABASE_URL apontando para um banco exclusivo com nome terminado em _test.',
  );
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
type ResponseBody = PlayerResponse & {
  message: string;
  data: PlayerResponse[];
  meta: { total_items: number; total_pages: number };
};

describe('API de jogadores com PostgreSQL real', () => {
  let app: INestApplication;
  let origin: string;
  const database = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  async function request(requestPath: string, method = 'GET', body?: unknown) {
    const response = await fetch(`${origin}/api/v1${requestPath}`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      data: text ? (JSON.parse(text) as ResponseBody) : null,
    };
  }

  async function create(changes: Record<string, unknown> = {}) {
    const response = await request('/players', 'POST', { ...input, ...changes });
    expect(response.status).toBe(201);
    return response.data!;
  }

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [PrismaModule, PlayersModule, ClubsModule],
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

  it('cadastra com Location, valores numéricos e ignora valores controlados', async () => {
    const response = await request('/players', 'POST', {
      ...input,
      base_value: 999,
      overall: 1,
      club_id: 999,
      condition: 'DOENTE',
    });
    expect(response.status).toBe(201);
    expect(response.headers.get('location')).toBe(`/api/v1/players/${response.data!.id}`);
    expect(response.data).toMatchObject({
      base_value: 40,
      market_value: 40,
      overall: 75,
      condition: 'APTO',
      club_id: null,
    });
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it.each([[], 'text', { ...input, agility: '85' }, { ...input, potential: 81 }])(
    'recusa entrada inválida sem gravar: %j',
    async (body) => {
      const response = await request('/players', 'POST', body);
      expect(response.status).toBe(400);
      expect(typeof response.data!.message).toBe('string');
      expect(await database.player.count()).toBe(0);
    },
  );

  it('recalcula mercado/overall e preserva valor base, potencial e indicadores na edição', async () => {
    const player = await create();
    expect(
      (
        await request(`/players/${player.id}/condition`, 'PATCH', {
          condition: 'MAL_CONDICIONADO',
        })
      ).data!.market_value,
    ).toBe(37);
    const updateInput = await request(`/players/${player.id}`, 'PUT', {
      name: '  Novo   Nome  ',
      position: 'ATA',
      agility: 85,
      age: 33,
      pace: 1,
      potential: 1,
      base_value: 999,
    });
    expect(updateInput.status).toBe(200);
    expect(updateInput.data).toMatchObject({
      name: 'Novo Nome',
      base_value: 40,
      potential: 86,
      pace: 70,
      overall: 72,
      market_value: 33,
    });
    const rejection = await request(`/players/${player.id}`, 'PUT', { ...input, age: 32 });
    expect(rejection.status).toBe(409);
    expect((await request(`/players/${player.id}`)).data!.age).toBe(33);
  });

  it('remove titular ao adoecer, preserva formação e não permite DOENTE → APTO', async () => {
    const player = await create();
    const club = await database.club.create({
      data: { name: 'Águias FC', normalizedName: 'águias fc', acronym: 'AGF', formation: '2-1-1' },
    });
    await database.player.update({ where: { id: player.id }, data: { clubId: club.id } });
    await database.lineupEntry.create({ data: { clubId: club.id, playerId: player.id } });
    expect((await request(`/players/${player.id}`, 'DELETE')).status).toBe(409);
    expect(
      (await request(`/players/${player.id}`, 'PUT', { ...input, position: 'ATA' })).status,
    ).toBe(409);
    expect(
      (await request(`/players/${player.id}/condition`, 'PATCH', { condition: 'DOENTE' })).status,
    ).toBe(200);
    expect(await database.lineupEntry.count()).toBe(0);
    expect((await database.club.findUniqueOrThrow({ where: { id: club.id } })).formation).toBe(
      '2-1-1',
    );
    expect(
      (await request(`/players/${player.id}/condition`, 'PATCH', { condition: 'APTO' })).status,
    ).toBe(409);
    expect(
      (
        await request(`/players/${player.id}/condition`, 'PATCH', {
          condition: 'MAL_CONDICIONADO',
        })
      ).status,
    ).toBe(200);
    expect(await database.lineupEntry.count()).toBe(0);
  });

  it('exclui logicamente e trata jogador excluído como inexistente em todas as rotas', async () => {
    const player = await create();
    const deletion = await request(`/players/${player.id}`, 'DELETE');
    expect(deletion.status).toBe(204);
    expect(deletion.data).toBeNull();
    expect(
      (await database.player.findUniqueOrThrow({ where: { id: player.id } })).deletedAt,
    ).not.toBeNull();
    for (const [requestPath, method, body] of [
      [`/players/${player.id}`, 'GET', undefined],
      [`/players/${player.id}`, 'PUT', input],
      [`/players/${player.id}/condition`, 'PATCH', { condition: 'DOENTE' }],
      [`/players/${player.id}`, 'DELETE', undefined],
    ] as const)
      expect((await request(requestPath, method, body)).status).toBe(404);
    expect((await request('/players')).data!.meta.total_items).toBe(0);
  });

  it('busca sem acentos, ordena por Unicode e aplica paginação após os filtros', async () => {
    await create({ name: 'João Silva' });
    await create({ name: 'Ana-Maria Lima' });
    await create({ name: 'Ana Maria' });
    expect((await request('/players?search=joao')).data!.data[0].name).toBe('João Silva');
    const list = await request('/players?limit=1&page=2');
    expect(list.data!.data[0].name).toBe('Ana-Maria Lima');
    expect(list.data!.meta).toMatchObject({ total_items: 3, total_pages: 3 });
    expect((await request('/players?page=9')).data!.data).toEqual([]);
  });

  it('filtra e ordena pelo valor de mercado e aceita dois critérios', async () => {
    const player = await create({ name: 'Alfa Silva' });
    await create({ name: 'Beta Silva' });
    await request(`/players/${player.id}/condition`, 'PATCH', { condition: 'DOENTE' });
    expect(
      (await request('/players?min_value=30&max_value=35')).data!.data.map(
        (item: { id: number }) => item.id,
      ),
    ).toEqual([player.id]);
    expect((await request('/players?sort=value_desc,age_asc')).data!.data[0].name).toBe(
      'Beta Silva',
    );
    expect((await request('/players?sort=position')).status).toBe(200);
  });

  it('distingue erro de ID na rota, no filtro e clube inexistente', async () => {
    expect((await request('/players/01')).status).toBe(404);
    expect((await request('/players?club_id=01')).status).toBe(400);
    expect((await request('/players?club_id=999')).status).toBe(404);
    expect((await request('/players?free=true&club_id=1')).status).toBe(400);
    expect((await request('/players?campo_desconhecido=x')).status).toBe(200);
  });

  it('recusa JSON malformado com 400 e mensagem sem stack trace', async () => {
    const response = await fetch(`${origin}/api/v1/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalido',
    });
    expect(response.status).toBe(400);
    const body: unknown = await response.json();
    expect(body).toEqual({ message: expect.any(String) });
    expect(await database.player.count()).toBe(0);
  });

  it('ignora corpo enviado em consultas e exclusão (V1)', async () => {
    const player = await create();
    const query = await fetch(`${origin}/api/v1/players`, {
      method: 'GET',
      headers: { Origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173' },
    });
    expect(query.headers.get('access-control-allow-origin')).toBe(
      process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    );
    const deletion = await fetch(`${origin}/api/v1/players/${player.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalido',
    });
    expect(deletion.status).toBe(204);
  });

  it('desfaz a saída da escalação se a gravação da condição falhar', async () => {
    const player = await create();
    const club = await database.club.create({
      data: { name: 'Águias FC', normalizedName: 'águias fc', acronym: 'AGF' },
    });
    await database.player.update({ where: { id: player.id }, data: { clubId: club.id } });
    await database.lineupEntry.create({ data: { clubId: club.id, playerId: player.id } });
    // Uma restrição temporária simula falha de gravação depois de remover o titular.
    await database.$executeRaw`ALTER TABLE jogadores ADD CONSTRAINT teste_falha_condicao CHECK (condicao <> 'DOENTE')`;
    try {
      const response = await request(`/players/${player.id}/condition`, 'PATCH', {
        condition: 'DOENTE',
      });
      expect(response.status).toBe(500);
      expect(response.data).toEqual({ message: 'Erro interno do servidor.' });
      expect(await database.lineupEntry.count()).toBe(1);
      expect(
        (await database.player.findUniqueOrThrow({ where: { id: player.id } })).condition,
      ).toBe('APTO');
    } finally {
      await database.$executeRaw`ALTER TABLE jogadores DROP CONSTRAINT teste_falha_condicao`;
    }
  });
});
