import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { configurarApi } from '../../../src/app.config';
import { ClubesModule } from '../../../src/clubes/clubes.module';
import { Posicao } from '../../../src/common/domain.types';
import { formatarDataHoraBrasilia } from '../../../src/common/parsers/date.parser';
import { PrismaModule } from '../../../src/database/prisma.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { JogadoresModule } from '../../../src/jogadores/jogadores.module';
import { RespostaJogador } from '../../../src/jogadores/presenters/jogador.presenter';
import { Formacao } from '../../../src/liga/domain/formacoes';
import { LigaModule } from '../../../src/liga/liga.module';
import { MercadoModule } from '../../../src/mercado/mercado.module';

const urlBanco = process.env.TEST_DATABASE_URL;
if (!urlBanco || !new URL(urlBanco).pathname.endsWith('_test')) {
  throw new Error('Informe TEST_DATABASE_URL para um banco exclusivo terminado em _test.');
}
type Escalacao = {
  club_id: number;
  formation: string | null;
  complete: boolean;
  players: RespostaJogador[];
};

describe('escalações com PostgreSQL real', () => {
  let app: INestApplication;
  let origem: string;
  const banco = new PrismaClient({ datasources: { db: { url: urlBanco } } });

  async function requisicao<T = Record<string, unknown>>(
    caminho: string,
    metodo = 'GET',
    corpo?: unknown,
  ) {
    const resposta = await fetch(`${origem}/api/v1${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    const texto = await resposta.text();
    return { status: resposta.status, dados: (texto ? JSON.parse(texto) : null) as T };
  }

  async function criarJogador(posicao: Posicao = 'MEI') {
    const resposta = await requisicao<RespostaJogador>('/players', 'POST', {
      name: 'Meia Lua',
      position: posicao,
      agility: 70,
      age: 25,
      pace: 20,
      shooting: 20,
      passing: 20,
      dribbling: 20,
      defending: 20,
      physical: 20,
      potential: 20,
    });
    expect(resposta.status).toBe(201);
    return resposta.dados;
  }

  function fimFidelidade() {
    return formatarDataHoraBrasilia(new Date(Date.now() + 40 * 86_400_000)).replace(
      /:\d\d-03:00$/,
      '-03:00',
    );
  }

  async function prepararElenco(posicoes: Posicao[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA', 'MEI']) {
    const clube = await requisicao<{ id: number }>('/clubs', 'POST', {
      name: 'Águias FC',
      acronym: 'AGU',
    });
    expect(clube.status).toBe(201);
    const jogadores: RespostaJogador[] = [];
    for (const posicao of posicoes) {
      const jogador = await criarJogador(posicao);
      expect(
        (
          await requisicao(`/players/${jogador.id}/buy`, 'POST', {
            club_id: clube.dados.id,
            loyalty_until: fimFidelidade(),
          })
        ).status,
      ).toBe(200);
      jogadores.push(jogador);
    }
    return { clubeId: clube.dados.id, jogadores };
  }

  async function escalar(
    clubeId: number,
    jogadores: RespostaJogador[],
    formation: Formacao = '2-1-1',
  ) {
    return requisicao<Escalacao>(`/clubs/${clubeId}/lineup`, 'PUT', {
      formation,
      player_ids: jogadores.map((j) => j.id).reverse(),
      cash: 0,
    });
  }

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [PrismaModule, JogadoresModule, ClubesModule, MercadoModule, LigaModule],
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

  it('consulta clube sem escalação e recusa clube inexistente ou id inválido', async () => {
    const clube = await requisicao<{ id: number }>('/clubs', 'POST', {
      name: 'Águias FC',
      acronym: 'AGU',
    });
    expect((await requisicao(`/clubs/${clube.dados.id}/lineup`)).dados).toEqual({
      club_id: clube.dados.id,
      formation: null,
      complete: false,
      players: [],
    });
    expect((await requisicao('/clubs/999/lineup')).status).toBe(404);
    expect((await requisicao('/clubs/01/lineup')).status).toBe(404);
    expect(
      (
        await requisicao('/clubs/999/lineup', 'PUT', {
          formation: '2-1-1',
          player_ids: [1, 2, 3, 4, 5],
        })
      ).status,
    ).toBe(404);
  });

  it.each<[Formacao, Posicao[]]>([
    ['3-1', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA']],
    ['2-2', ['GOL', 'ZAG', 'LAT', 'ATA', 'ATA']],
    ['2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']],
    ['1-2-1', ['GOL', 'ZAG', 'MEI', 'MEI', 'ATA']],
  ])(
    'escala %s em ordem do elenco, aceita MAL_CONDICIONADO e mantém caixa',
    async (formacao, posicoes) => {
      const { clubeId, jogadores } = await prepararElenco(posicoes);
      await requisicao(`/players/${jogadores[0].id}/condition`, 'PATCH', {
        condition: 'MAL_CONDICIONADO',
      });
      const caixaAntes = (
        await banco.clube.findUniqueOrThrow({ where: { id: clubeId } })
      ).caixa.toString();
      const resposta = await escalar(clubeId, jogadores, formacao);
      expect(resposta.status).toBe(200);
      expect(resposta.dados).toMatchObject({
        club_id: clubeId,
        formation: formacao,
        complete: true,
      });
      expect(resposta.dados.players.map((j) => j.id)).toEqual(jogadores.map((j) => j.id));
      expect(resposta.dados.players[0]).toMatchObject({
        condition: 'MAL_CONDICIONADO',
        defending: 20,
        overall: expect.any(Number),
        market_value: 1,
        base_value: 1,
        potential: 20,
        club_id: clubeId,
      });
      expect((await requisicao(`/clubs/${clubeId}/lineup`)).dados).toEqual(resposta.dados);
      expect(
        (await banco.clube.findUniqueOrThrow({ where: { id: clubeId } })).caixa.toString(),
      ).toBe(caixaAntes);
    },
  );

  it('substitui todos os titulares e a formação, preservando apenas os escolhidos', async () => {
    const { clubeId, jogadores } = await prepararElenco();
    expect((await escalar(clubeId, jogadores.slice(0, 5))).status).toBe(200);
    const nova = [jogadores[0], jogadores[1], jogadores[3], jogadores[5], jogadores[4]];
    expect((await escalar(clubeId, nova, '1-2-1')).status).toBe(200);
    const atual = (await requisicao<Escalacao>(`/clubs/${clubeId}/lineup`)).dados;
    expect(atual.formation).toBe('1-2-1');
    expect(atual.players.map((j) => j.id)).toEqual(nova.map((j) => j.id));
    expect(await banco.escalacao.count()).toBe(5);
  });

  it('preserva a escalação nas recusas de formato, jogador, condição e posições', async () => {
    const { clubeId, jogadores } = await prepararElenco();
    const titulares = jogadores.slice(0, 5);
    const original = (await escalar(clubeId, titulares)).dados;
    const livre = await criarJogador();
    const excluido = await criarJogador();
    expect((await requisicao(`/players/${excluido.id}`, 'DELETE')).status).toBe(204);
    const outro = await requisicao<{ id: number }>('/clubs', 'POST', {
      name: 'Delta FC',
      acronym: 'DFC',
    });
    const adversario = await criarJogador();
    expect(
      (
        await requisicao(`/players/${adversario.id}/buy`, 'POST', {
          club_id: outro.dados.id,
          loyalty_until: fimFidelidade(),
        })
      ).status,
    ).toBe(200);
    await requisicao(`/players/${jogadores[5].id}/condition`, 'PATCH', { condition: 'DOENTE' });
    const ids = titulares.map((j) => j.id);
    const tentativas: [unknown, number][] = [
      [{ formation: '4-0', player_ids: ids }, 400],
      [{ formation: '2-1-1', player_ids: ids.slice(1) }, 400],
      [{ formation: '2-1-1', player_ids: [ids[0], ...ids.slice(0, 4)] }, 400],
      [{ formation: '2-1-1', player_ids: [ids[0], ids[1], ids[2], 999, ids[4]] }, 404],
      [{ formation: '2-1-1', player_ids: [ids[0], ids[1], ids[2], excluido.id, ids[4]] }, 404],
      [{ formation: '2-1-1', player_ids: [ids[0], ids[1], ids[2], livre.id, ids[4]] }, 409],
      [{ formation: '2-1-1', player_ids: [ids[0], ids[1], ids[2], adversario.id, ids[4]] }, 409],
      [{ formation: '2-1-1', player_ids: [ids[0], ids[1], ids[2], jogadores[5].id, ids[4]] }, 409],
      [{ formation: '3-1', player_ids: ids }, 409],
    ];
    for (const [corpo, status] of tentativas) {
      const resposta = await requisicao(`/clubs/${clubeId}/lineup`, 'PUT', corpo);
      expect(resposta.status).toBe(status);
      expect(resposta.dados).toEqual({ message: expect.any(String) });
      expect((await requisicao(`/clubs/${clubeId}/lineup`)).dados).toEqual(original);
    }
  });

  it('adoecer e vender removem titulares; recuperar condição não reinsere automaticamente', async () => {
    const { clubeId, jogadores } = await prepararElenco();
    const titulares = jogadores.slice(0, 5);
    await escalar(clubeId, titulares);
    const meio = jogadores[3].id;
    expect(
      (await requisicao(`/players/${meio}/condition`, 'PATCH', { condition: 'DOENTE' })).status,
    ).toBe(200);
    const incompleta = (await requisicao<Escalacao>(`/clubs/${clubeId}/lineup`)).dados;
    expect(incompleta).toMatchObject({ formation: '2-1-1', complete: false });
    expect(incompleta.players).toHaveLength(4);
    await requisicao(`/players/${meio}/condition`, 'PATCH', { condition: 'MAL_CONDICIONADO' });
    expect((await requisicao<Escalacao>(`/clubs/${clubeId}/lineup`)).dados.players).toHaveLength(4);
    expect((await escalar(clubeId, titulares)).dados.complete).toBe(true);
    expect((await requisicao(`/players/${jogadores[4].id}/sell`, 'POST')).status).toBe(200);
    const aposVenda = (await requisicao<Escalacao>(`/clubs/${clubeId}/lineup`)).dados;
    expect(aposVenda).toMatchObject({ formation: '2-1-1', complete: false });
    expect(aposVenda.players.map((j) => j.id)).not.toContain(jogadores[4].id);
  });

  it('desfaz formação e exclusão dos titulares se a substituição falhar', async () => {
    const { clubeId, jogadores } = await prepararElenco();
    const original = (await escalar(clubeId, jogadores.slice(0, 5))).dados;
    const reserva = jogadores[5].id;
    // O reserva não pertence à escalação anterior, permitindo simular falha depois da exclusão.
    expect(reserva).toBe(6);
    await banco.$executeRaw`ALTER TABLE escalacoes ADD CONSTRAINT teste_falha_escalacao CHECK (jogador_id <> 6)`;
    try {
      const nova = [jogadores[0], jogadores[1], jogadores[3], jogadores[5], jogadores[4]];
      expect((await escalar(clubeId, nova, '1-2-1')).status).toBe(500);
      expect((await requisicao(`/clubs/${clubeId}/lineup`)).dados).toEqual(original);
      expect(await banco.escalacao.count()).toBe(5);
    } finally {
      await banco.$executeRaw`ALTER TABLE escalacoes DROP CONSTRAINT teste_falha_escalacao`;
    }
  });
});
