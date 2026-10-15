import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { configurarApi } from '../../../src/app.config';
import { ClubesModule } from '../../../src/clubes/clubes.module';
import { PrismaModule } from '../../../src/database/prisma.module';
import { PrismaService } from '../../../src/database/prisma.service';

const urlBanco = process.env.TEST_DATABASE_URL;
if (!urlBanco || !new URL(urlBanco).pathname.endsWith('_test')) {
  throw new Error(
    'Informe TEST_DATABASE_URL apontando para um banco exclusivo com nome terminado em _test.',
  );
}

type ClubeResposta = {
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
  let origem: string;
  const banco = new PrismaClient({ datasources: { db: { url: urlBanco } } });

  async function requisicao(caminho: string, metodo = 'GET', corpo?: unknown) {
    const resposta = await fetch(`${origem}/api/v1${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    const texto = await resposta.text();
    return {
      status: resposta.status,
      headers: resposta.headers,
      dados: texto ? (JSON.parse(texto) as ClubeResposta | ClubeResposta[]) : null,
    };
  }

  async function cadastrar(name: string, acronym: string) {
    const resposta = await requisicao('/clubs', 'POST', { name, acronym });
    expect(resposta.status).toBe(201);
    return resposta.dados as ClubeResposta;
  }

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [PrismaModule, ClubesModule] })
      .overrideProvider(PrismaService)
      .useValue(banco)
      .compile();
    app = modulo.createNestApplication({ bodyParser: false });
    configurarApi(app);
    await app.listen(0, '127.0.0.1');
    origem = await app.getUrl();
  });

  afterAll(async () => {
    await app?.close();
    await banco.$disconnect();
  });

  beforeEach(async () => {
    await banco.$executeRaw`TRUNCATE TABLE clubes, jogadores RESTART IDENTITY CASCADE`;
  });

  it('cria clube com Location, caixa inicial e valores calculados', async () => {
    const resposta = await requisicao('/clubs', 'POST', {
      name: '  Águias   FC ',
      acronym: 'AGU',
      cash: 0,
    });
    expect(resposta.status).toBe(201);
    expect(resposta.headers.get('location')).toBe('/api/v1/clubs/1');
    expect(resposta.dados).toEqual({
      id: 1,
      name: 'Águias FC',
      acronym: 'AGU',
      cash: 300,
      squad_value: 0,
      net_worth: 300,
    });
    expect(await banco.clube.findUniqueOrThrow({ where: { id: 1 } })).toMatchObject({
      nomeNormalizado: 'águias fc',
      caixa: expect.anything(),
    });
  });

  it('recusa nome ou sigla repetidos e mantém distinção entre letras com e sem acento', async () => {
    await cadastrar('Águias FC', 'AGU');
    expect(
      (await requisicao('/clubs', 'POST', { name: ' águias  fc ', acronym: 'AFC' })).status,
    ).toBe(409);
    expect((await requisicao('/clubs', 'POST', { name: 'Aguias FC', acronym: 'AGI' })).status).toBe(
      201,
    );
    expect(
      (await requisicao('/clubs', 'POST', { name: 'Aurora Grande União', acronym: 'AGU' })).status,
    ).toBe(409);
  });

  it('lista e consulta clubes sem elenco', async () => {
    await cadastrar('Zebra Futebol Clube', 'ZFC');
    const aguias = await cadastrar('Águias Futebol Clube', 'AFC');
    const lista = await requisicao('/clubs?sort=net_worth_desc');
    expect(lista.status).toBe(200);
    expect((lista.dados as ClubeResposta[]).map((clube) => clube.id)).toEqual([aguias.id, 1]);
    const consulta = await requisicao(`/clubs/${aguias.id}`);
    expect(consulta.dados).toMatchObject({ ...aguias, players: [] });
    expect((await requisicao('/clubs/999')).status).toBe(404);
  });

  it('aplica a definição de palavra e preserva a primeira letra Unicode na sigla', async () => {
    for (const name of ['Águias - .', 'Ω Águias']) {
      const resposta = await requisicao('/clubs', 'POST', { name, acronym: 'AGU' });
      expect(resposta.status).toBe(400);
      expect(resposta.dados).toMatchObject({ message: expect.any(String) });
    }
    expect(await banco.clube.count()).toBe(0);
    await cadastrar('A B C D E - .', 'ABC');
    await cadastrar('Aliança Azul Bairro', 'AAB');
    expect(await banco.clube.count()).toBe(2);
  });
});
