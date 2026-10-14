import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { configurarApi } from '../../../src/app.config';
import { ClubesModule } from '../../../src/clubes/clubes.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { PrismaModule } from '../../../src/database/prisma.module';
import { RespostaJogador } from '../../../src/jogadores/presenters/jogador.presenter';
import { JogadoresModule } from '../../../src/jogadores/jogadores.module';

// O teste exige um banco exclusivo, já criado pelas migrations.
const urlBanco = process.env.TEST_DATABASE_URL;
if (!urlBanco || !new URL(urlBanco).pathname.endsWith('_test')) {
  throw new Error(
    'Informe TEST_DATABASE_URL apontando para um banco exclusivo com nome terminado em _test.',
  );
}

const entrada = {
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
type CorpoResposta = RespostaJogador & {
  message: string;
  data: RespostaJogador[];
  meta: { total_items: number; total_pages: number };
};

describe('API de jogadores com PostgreSQL real', () => {
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
      dados: texto ? (JSON.parse(texto) as CorpoResposta) : null,
    };
  }

  async function cadastrar(alteracoes: Record<string, unknown> = {}) {
    const resposta = await requisicao('/players', 'POST', { ...entrada, ...alteracoes });
    expect(resposta.status).toBe(201);
    return resposta.dados!;
  }

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [PrismaModule, JogadoresModule, ClubesModule],
    })
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

  it('cadastra com Location, valores numéricos e ignora valores controlados', async () => {
    const resposta = await requisicao('/players', 'POST', {
      ...entrada,
      base_value: 999,
      overall: 1,
      club_id: 999,
      condition: 'DOENTE',
    });
    expect(resposta.status).toBe(201);
    expect(resposta.headers.get('location')).toBe(`/api/v1/players/${resposta.dados!.id}`);
    expect(resposta.dados).toMatchObject({
      base_value: 40,
      market_value: 40,
      overall: 75,
      condition: 'APTO',
      club_id: null,
    });
    expect(resposta.headers.get('content-type')).toContain('application/json');
  });

  it.each([[], 'texto', { ...entrada, agility: '85' }, { ...entrada, potential: 81 }])(
    'recusa entrada inválida sem gravar: %j',
    async (corpo) => {
      const resposta = await requisicao('/players', 'POST', corpo);
      expect(resposta.status).toBe(400);
      expect(typeof resposta.dados!.message).toBe('string');
      expect(await banco.jogador.count()).toBe(0);
    },
  );

  it('recalcula mercado/overall e preserva valor base, potencial e indicadores na edição', async () => {
    const jogador = await cadastrar();
    expect(
      (
        await requisicao(`/players/${jogador.id}/condition`, 'PATCH', {
          condition: 'MAL_CONDICIONADO',
        })
      ).dados!.market_value,
    ).toBe(37);
    const edicao = await requisicao(`/players/${jogador.id}`, 'PUT', {
      name: '  Novo   Nome  ',
      position: 'ATA',
      agility: 85,
      age: 33,
      pace: 1,
      potential: 1,
      base_value: 999,
    });
    expect(edicao.status).toBe(200);
    expect(edicao.dados).toMatchObject({
      name: 'Novo Nome',
      base_value: 40,
      potential: 86,
      pace: 70,
      overall: 72,
      market_value: 33,
    });
    const recusa = await requisicao(`/players/${jogador.id}`, 'PUT', { ...entrada, age: 32 });
    expect(recusa.status).toBe(409);
    expect((await requisicao(`/players/${jogador.id}`)).dados!.age).toBe(33);
  });

  it('remove titular ao adoecer, preserva formação e não permite DOENTE → APTO', async () => {
    const jogador = await cadastrar();
    const clube = await banco.clube.create({
      data: { nome: 'Águias FC', nomeNormalizado: 'águias fc', sigla: 'AGF', formacao: '2-1-1' },
    });
    await banco.jogador.update({ where: { id: jogador.id }, data: { clubeId: clube.id } });
    await banco.escalacao.create({ data: { clubeId: clube.id, jogadorId: jogador.id } });
    expect((await requisicao(`/players/${jogador.id}`, 'DELETE')).status).toBe(409);
    expect(
      (await requisicao(`/players/${jogador.id}`, 'PUT', { ...entrada, position: 'ATA' })).status,
    ).toBe(409);
    expect(
      (await requisicao(`/players/${jogador.id}/condition`, 'PATCH', { condition: 'DOENTE' }))
        .status,
    ).toBe(200);
    expect(await banco.escalacao.count()).toBe(0);
    expect((await banco.clube.findUniqueOrThrow({ where: { id: clube.id } })).formacao).toBe(
      '2-1-1',
    );
    expect(
      (await requisicao(`/players/${jogador.id}/condition`, 'PATCH', { condition: 'APTO' })).status,
    ).toBe(409);
    expect(
      (
        await requisicao(`/players/${jogador.id}/condition`, 'PATCH', {
          condition: 'MAL_CONDICIONADO',
        })
      ).status,
    ).toBe(200);
    expect(await banco.escalacao.count()).toBe(0);
  });

  it('exclui logicamente e trata jogador excluído como inexistente em todas as rotas', async () => {
    const jogador = await cadastrar();
    const exclusao = await requisicao(`/players/${jogador.id}`, 'DELETE');
    expect(exclusao.status).toBe(204);
    expect(exclusao.dados).toBeNull();
    expect(
      (await banco.jogador.findUniqueOrThrow({ where: { id: jogador.id } })).excluidoEm,
    ).not.toBeNull();
    for (const [caminho, metodo, corpo] of [
      [`/players/${jogador.id}`, 'GET', undefined],
      [`/players/${jogador.id}`, 'PUT', entrada],
      [`/players/${jogador.id}/condition`, 'PATCH', { condition: 'DOENTE' }],
      [`/players/${jogador.id}`, 'DELETE', undefined],
    ] as const)
      expect((await requisicao(caminho, metodo, corpo)).status).toBe(404);
    expect((await requisicao('/players')).dados!.meta.total_items).toBe(0);
  });

  it('busca sem acentos, ordena por Unicode e aplica paginação após os filtros', async () => {
    await cadastrar({ name: 'João Silva' });
    await cadastrar({ name: 'Ana-Maria Lima' });
    await cadastrar({ name: 'Ana Maria' });
    expect((await requisicao('/players?search=joao')).dados!.data[0].name).toBe('João Silva');
    const lista = await requisicao('/players?limit=1&page=2');
    expect(lista.dados!.data[0].name).toBe('Ana-Maria Lima');
    expect(lista.dados!.meta).toMatchObject({ total_items: 3, total_pages: 3 });
    expect((await requisicao('/players?page=9')).dados!.data).toEqual([]);
  });

  it('filtra e ordena pelo valor de mercado e aceita dois critérios', async () => {
    const jogador = await cadastrar({ name: 'Alfa Silva' });
    await cadastrar({ name: 'Beta Silva' });
    await requisicao(`/players/${jogador.id}/condition`, 'PATCH', { condition: 'DOENTE' });
    expect(
      (await requisicao('/players?min_value=30&max_value=35')).dados!.data.map(
        (item: { id: number }) => item.id,
      ),
    ).toEqual([jogador.id]);
    expect((await requisicao('/players?sort=value_desc,age_asc')).dados!.data[0].name).toBe(
      'Beta Silva',
    );
    expect((await requisicao('/players?sort=position')).status).toBe(200);
  });

  it('distingue erro de ID na rota, no filtro e clube inexistente', async () => {
    expect((await requisicao('/players/01')).status).toBe(404);
    expect((await requisicao('/players?club_id=01')).status).toBe(400);
    expect((await requisicao('/players?club_id=999')).status).toBe(404);
    expect((await requisicao('/players?free=true&club_id=1')).status).toBe(400);
    expect((await requisicao('/players?campo_desconhecido=x')).status).toBe(200);
  });

  it('recusa JSON malformado com 400 e mensagem sem stack trace', async () => {
    const resposta = await fetch(`${origem}/api/v1/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalido',
    });
    expect(resposta.status).toBe(400);
    const corpo: unknown = await resposta.json();
    expect(corpo).toEqual({ message: expect.any(String) });
    expect(await banco.jogador.count()).toBe(0);
  });

  it('ignora corpo enviado em consultas e exclusão (V1)', async () => {
    const jogador = await cadastrar();
    const consulta = await fetch(`${origem}/api/v1/players`, {
      method: 'GET',
      headers: { Origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173' },
    });
    expect(consulta.headers.get('access-control-allow-origin')).toBe(
      process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    );
    const exclusao = await fetch(`${origem}/api/v1/players/${jogador.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalido',
    });
    expect(exclusao.status).toBe(204);
  });

  it('desfaz a saída da escalação se a gravação da condição falhar', async () => {
    const jogador = await cadastrar();
    const clube = await banco.clube.create({
      data: { nome: 'Águias FC', nomeNormalizado: 'águias fc', sigla: 'AGF' },
    });
    await banco.jogador.update({ where: { id: jogador.id }, data: { clubeId: clube.id } });
    await banco.escalacao.create({ data: { clubeId: clube.id, jogadorId: jogador.id } });
    // Uma restrição temporária simula falha de gravação depois de remover o titular.
    await banco.$executeRaw`ALTER TABLE jogadores ADD CONSTRAINT teste_falha_condicao CHECK (condicao <> 'DOENTE')`;
    try {
      const resposta = await requisicao(`/players/${jogador.id}/condition`, 'PATCH', {
        condition: 'DOENTE',
      });
      expect(resposta.status).toBe(500);
      expect(resposta.dados).toEqual({ message: 'Erro interno do servidor.' });
      expect(await banco.escalacao.count()).toBe(1);
      expect((await banco.jogador.findUniqueOrThrow({ where: { id: jogador.id } })).condicao).toBe(
        'APTO',
      );
    } finally {
      await banco.$executeRaw`ALTER TABLE jogadores DROP CONSTRAINT teste_falha_condicao`;
    }
  });
});
