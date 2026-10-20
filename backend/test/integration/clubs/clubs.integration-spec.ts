import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { configureApi } from '../../../src/app.config';
import { ClubsModule } from '../../../src/clubs/clubs.module';
import { PrismaModule } from '../../../src/database/prisma.module';
import { PrismaService } from '../../../src/database/prisma.service';

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test')) {
  throw new Error(
    'Informe TEST_DATABASE_URL apontando para um banco exclusivo com nome terminado em _test.',
  );
}

type ClubResponse = {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
  players?: unknown[];
  message?: string;
};

describe('API de clubes com PostgreSQL real', () => {
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
      data: text ? (JSON.parse(text) as ClubResponse | ClubResponse[]) : null,
    };
  }

  async function create(name: string, acronym: string) {
    const response = await request('/clubs', 'POST', { name, acronym });
    expect(response.status).toBe(201);
    return response.data as ClubResponse;
  }

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({ imports: [PrismaModule, ClubsModule] })
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

  it('cria clube com Location, caixa inicial e valores calculados', async () => {
    const response = await request('/clubs', 'POST', {
      name: '  Águias   FC ',
      acronym: 'AGU',
      cash: 0,
    });
    expect(response.status).toBe(201);
    expect(response.headers.get('location')).toBe('/api/v1/clubs/1');
    expect(response.data).toEqual({
      id: 1,
      name: 'Águias FC',
      acronym: 'AGU',
      cash: 300,
      squad_value: 0,
      net_worth: 300,
    });
    expect(await database.club.findUniqueOrThrow({ where: { id: 1 } })).toMatchObject({
      normalizedName: 'águias fc',
      cash: expect.anything(),
    });
  });

  it('recusa nome ou sigla repetidos e mantém distinção entre letras com e sem acento', async () => {
    await create('Águias FC', 'AGU');
    expect((await request('/clubs', 'POST', { name: ' águias  fc ', acronym: 'AFC' })).status).toBe(
      409,
    );
    expect((await request('/clubs', 'POST', { name: 'Aguias FC', acronym: 'AGI' })).status).toBe(
      201,
    );
    expect(
      (await request('/clubs', 'POST', { name: 'Aurora Grande União', acronym: 'AGU' })).status,
    ).toBe(409);
  });

  it('lista e consulta clubes sem elenco', async () => {
    await create('Zebra Futebol Clube', 'ZFC');
    const eagles = await create('Águias Futebol Clube', 'AFC');
    const list = await request('/clubs?sort=net_worth_desc');
    expect(list.status).toBe(200);
    expect((list.data as ClubResponse[]).map((club) => club.id)).toEqual([eagles.id, 1]);
    const query = await request(`/clubs/${eagles.id}`);
    expect(query.data).toMatchObject({ ...eagles, players: [] });
    expect((await request('/clubs/999')).status).toBe(404);
  });

  it('aceita nome de 60 pontos de código mesmo quando minúsculas expandem o texto Unicode', async () => {
    const name = `${'İ'.repeat(57)} FC`;
    const club = await create(name, 'IFC');
    const stored = await database.club.findUniqueOrThrow({ where: { id: club.id } });

    expect([...name]).toHaveLength(60);
    expect([...stored.normalizedName].length).toBeGreaterThan(60);
    expect(stored.normalizedName).toBe(name.toLocaleLowerCase('pt-BR'));
    expect((await request(`/clubs/${club.id}`)).data).toMatchObject({ name });
    expect((await request('/clubs', 'POST', { name, acronym: 'IFC' })).status).toBe(409);
    expect(await database.club.count()).toBe(1);
  });

  it('aplica a definição de palavra e preserva a primeira letra Unicode na sigla', async () => {
    for (const name of ['Águias - .', 'Ω Águias']) {
      const response = await request('/clubs', 'POST', { name, acronym: 'AGU' });
      expect(response.status).toBe(400);
      expect(response.data).toMatchObject({ message: expect.any(String) });
    }
    expect(await database.club.count()).toBe(0);
    await create('A B C D E - .', 'ABC');
    await create('Aliança Azul Bairro', 'AAB');
    expect(await database.club.count()).toBe(2);
  });
});
