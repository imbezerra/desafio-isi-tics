import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { configurarApi } from '../../../src/app.config';
import { ClubesModule } from '../../../src/clubes/clubes.module';
import { formatarDataHoraBrasilia } from '../../../src/common/parsers/date.parser';
import { PrismaModule } from '../../../src/database/prisma.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { JogadoresModule } from '../../../src/jogadores/jogadores.module';
import { JogadorPartida, TimePartida } from '../../../src/liga/domain/partida.rules';
import { LigaModule } from '../../../src/liga/liga.module';
import {
  apresentarPartida,
  apresentarResumoPartida,
} from '../../../src/liga/presenters/partida.presenter';
import { MercadoModule } from '../../../src/mercado/mercado.module';
import { timesExemplo } from '../../fixtures/liga.fixture';

const urlBanco = process.env.TEST_DATABASE_URL;
if (!urlBanco || !new URL(urlBanco).pathname.endsWith('_test')) {
  throw new Error('Informe TEST_DATABASE_URL para um banco exclusivo terminado em _test.');
}
type PartidaResposta = ReturnType<typeof apresentarPartida>;
type ResumoPartida = ReturnType<typeof apresentarResumoPartida>;

describe('partidas e classificação com PostgreSQL real', () => {
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
    return {
      status: resposta.status,
      headers: resposta.headers,
      dados: (texto ? JSON.parse(texto) : null) as T,
    };
  }

  async function criarClube(name: string, acronym: string) {
    const resposta = await requisicao<{ id: number }>('/clubs', 'POST', { name, acronym });
    expect(resposta.status).toBe(201);
    return resposta.dados.id;
  }

  async function contratarJogador(clubeId: number, jogador: JogadorPartida) {
    const atributos = {
      pace: jogador.pace,
      shooting: jogador.shooting,
      passing: jogador.passing,
      dribbling: jogador.dribbling,
      defending: jogador.defending,
      physical: jogador.physical,
    };
    const cadastro = await requisicao<{ id: number }>('/players', 'POST', {
      name: jogador.name,
      position: jogador.position,
      agility: 70,
      age: 25,
      ...atributos,
      potential: Math.max(...Object.values(atributos)),
    });
    expect(cadastro.status).toBe(201);
    const id = cadastro.dados.id;
    const fim = formatarDataHoraBrasilia(new Date(Date.now() + 40 * 86_400_000)).replace(
      /:\d\d-03:00$/,
      '-03:00',
    );
    expect(
      (await requisicao(`/players/${id}/buy`, 'POST', { club_id: clubeId, loyalty_until: fim }))
        .status,
    ).toBe(200);
    if (jogador.condition !== 'APTO') {
      expect(
        (await requisicao(`/players/${id}/condition`, 'PATCH', { condition: jogador.condition }))
          .status,
      ).toBe(200);
    }
    return id;
  }

  async function prepararTime(time: TimePartida, acronym: string) {
    const clubeId = await criarClube(time.name, acronym);
    const ids: Record<string, number> = {};
    for (const jogador of time.players)
      ids[jogador.name] = await contratarJogador(clubeId, jogador);
    expect(
      (
        await requisicao(`/clubs/${clubeId}/lineup`, 'PUT', {
          formation: time.formation,
          player_ids: Object.values(ids).reverse(),
        })
      ).status,
    ).toBe(200);
    return { clubeId, ids };
  }

  async function prepararConfronto(times = timesExemplo()) {
    const mandante = await prepararTime(times.mandante, 'AGU');
    const visitante = await prepararTime(times.visitante, 'DFC');
    return {
      mandante,
      visitante,
      entrada: { home_club_id: mandante.clubeId, away_club_id: visitante.clubeId },
    };
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

  it('registra os seis duelos do enunciado com Location sem alterar outros dados', async () => {
    const { entrada } = await prepararConfronto();
    const antes = {
      clubes: await banco.clube.findMany({ orderBy: { id: 'asc' } }),
      jogadores: await banco.jogador.findMany({ orderBy: { id: 'asc' } }),
      escalacoes: await banco.escalacao.findMany({ orderBy: { jogadorId: 'asc' } }),
    };
    const resposta = await requisicao<PartidaResposta>('/matches', 'POST', entrada);
    expect(resposta.status).toBe(201);
    const partida = resposta.dados;
    expect(resposta.headers.get('location')).toBe(`/api/v1/matches/${partida.id}`);
    expect(resposta.headers.get('content-type')).toContain('application/json');
    expect(partida).toMatchObject({
      home: { club_name: 'Águias FC', formation: '2-1-1', goals: 1 },
      away: { club_name: 'Delta FC', formation: '2-1-1', goals: 2 },
      result: 'VISITANTE',
      played_at: expect.stringMatching(/-03:00$/),
    });
    expect(
      partida.duels.map((d) => [
        d.order,
        d.attacker.player_name,
        d.defender.player_name,
        d.attacker.value,
        d.defender.value,
        d.goal,
      ]),
    ).toEqual([
      [1, 'Otto Rangel', 'Ivo Teles', 75, 72, true],
      [2, 'Lauro Neves', 'Hugo Vaz', 82, 84, false],
      [3, 'Davi Lins', 'Lino Matos', 63, 63, false],
      [4, 'Ugo Falcão', 'Rui Prado', 81, 77, true],
      [5, 'Nei Soares', 'Téo Brandão', 70, 84, false],
      [6, 'Lino Matos', 'Davi Lins', 79, 56, true],
    ]);
    expect((await requisicao(`/matches/${partida.id}`)).dados).toEqual(partida);
    expect(await banco.partida.count()).toBe(1);
    expect(await banco.dueloPartida.count()).toBe(6);
    expect({
      clubes: await banco.clube.findMany({ orderBy: { id: 'asc' } }),
      jogadores: await banco.jogador.findMany({ orderBy: { id: 'asc' } }),
      escalacoes: await banco.escalacao.findMany({ orderBy: { jogadorId: 'asc' } }),
    }).toEqual(antes);
  });

  it('mantém nomes, posições, condições e formações históricas após mudanças no elenco', async () => {
    const { entrada, mandante } = await prepararConfronto();
    const original = (await requisicao<PartidaResposta>('/matches', 'POST', entrada)).dados;
    const id = mandante.ids['Davi Lins'];
    expect((await requisicao(`/players/${id}/sell`, 'POST')).status).toBe(200);
    expect(
      (
        await requisicao(`/players/${id}`, 'PUT', {
          name: 'Davi Alterado',
          position: 'ATA',
          agility: 70,
          age: 26,
        })
      ).status,
    ).toBe(200);
    expect(
      (await requisicao(`/players/${id}/condition`, 'PATCH', { condition: 'DOENTE' })).status,
    ).toBe(200);
    expect((await requisicao(`/players/${id}`, 'DELETE')).status).toBe(204);
    const reserva = await contratarJogador(mandante.clubeId, {
      ...timesExemplo().mandante.players[3],
      name: 'Meia Reserva',
    });
    expect(
      (
        await requisicao(`/clubs/${mandante.clubeId}/lineup`, 'PUT', {
          formation: '1-2-1',
          player_ids: [
            mandante.ids['Rui Prado'],
            mandante.ids['Téo Brandão'],
            mandante.ids['Lauro Neves'],
            reserva,
            mandante.ids['Otto Rangel'],
          ],
        })
      ).status,
    ).toBe(200);
    expect((await requisicao(`/matches/${original.id}`)).dados).toEqual(original);
  });

  it('repete confrontos, lista sem duelos e filtra mandante ou visitante com ordem e desempate', async () => {
    expect((await requisicao('/matches')).dados).toEqual([]);
    const { entrada, mandante, visitante } = await prepararConfronto();
    const primeira = await requisicao<PartidaResposta>('/matches', 'POST', entrada);
    const segunda = await requisicao<PartidaResposta>('/matches', 'POST', entrada);
    expect(segunda.dados.duels).toEqual(primeira.dados.duels);
    await banco.partida.updateMany({ data: { jogadaEm: new Date('2026-11-12T18:00:00Z') } });
    for (const consulta of [
      '',
      `?club_id=${mandante.clubeId}`,
      `?club_id=${visitante.clubeId}&extra=x`,
    ]) {
      const lista = await requisicao<ResumoPartida[]>(`/matches${consulta}`);
      expect(lista.status).toBe(200);
      expect(lista.dados.map((p) => p.id)).toEqual([segunda.dados.id, primeira.dados.id]);
      expect(lista.dados[0]).not.toHaveProperty('duels');
    }
    const outro = await criarClube('Gama SC', 'GSC');
    expect((await requisicao(`/matches?club_id=${outro}`)).dados).toEqual([]);
    expect((await requisicao('/matches?club_id=999')).status).toBe(404);
    expect((await requisicao('/matches?club_id=01')).status).toBe(400);
    expect((await requisicao('/matches/999')).status).toBe(404);
    expect((await requisicao('/matches/01')).status).toBe(404);
  });

  it('recusa dados inválidos, clube inexistente e escalações incompletas sem gravar', async () => {
    const { entrada, mandante, visitante } = await prepararConfronto();
    const incompleto = await criarClube('Gama SC', 'GSC');
    for (const [corpo, status] of [
      [[], 400],
      [{ ...entrada, away_club_id: entrada.home_club_id }, 400],
      [{ ...entrada, home_club_id: '1' }, 400],
      [{ ...entrada, away_club_id: 999 }, 404],
      [{ ...entrada, away_club_id: incompleto }, 409],
    ] as const) {
      const resposta = await requisicao('/matches', 'POST', corpo);
      expect(resposta.status).toBe(status);
      expect(resposta.dados).toEqual({ message: expect.any(String) });
    }
    await requisicao(`/players/${mandante.ids['Davi Lins']}/condition`, 'PATCH', {
      condition: 'DOENTE',
    });
    expect((await requisicao('/matches', 'POST', entrada)).status).toBe(409);
    await requisicao(`/players/${mandante.ids['Davi Lins']}/condition`, 'PATCH', {
      condition: 'MAL_CONDICIONADO',
    });
    expect((await requisicao('/matches', 'POST', entrada)).status).toBe(409);
    await requisicao(`/clubs/${mandante.clubeId}/lineup`, 'PUT', {
      formation: '2-1-1',
      player_ids: Object.values(mandante.ids),
    });
    await requisicao(`/players/${visitante.ids['Ugo Falcão']}/sell`, 'POST');
    expect((await requisicao('/matches', 'POST', entrada)).status).toBe(409);
    expect(await banco.partida.count()).toBe(0);
    expect(await banco.dueloPartida.count()).toBe(0);
  });

  it('desfaz a partida inteira se um dos seis duelos não puder ser gravado', async () => {
    const { entrada } = await prepararConfronto();
    await banco.$executeRaw`ALTER TABLE duelos_partida ADD CONSTRAINT teste_falha_partida CHECK (ordem <> 4)`;
    try {
      expect((await requisicao('/matches', 'POST', entrada)).status).toBe(500);
      expect(await banco.partida.count()).toBe(0);
      expect(await banco.dueloPartida.count()).toBe(0);
      expect(await banco.escalacao.count()).toBe(10);
    } finally {
      await banco.$executeRaw`ALTER TABLE duelos_partida DROP CONSTRAINT teste_falha_partida`;
    }
  });

  it('calcula classificação com clube sem jogos e atualiza a cada nova partida', async () => {
    expect((await requisicao('/standings')).dados).toEqual([]);
    const semJogos = await criarClube('Gama SC', 'GSC');
    const { entrada, mandante, visitante } = await prepararConfronto();
    const zeros = await requisicao<Array<Record<string, unknown>>>('/standings');
    expect(zeros.dados.map((c) => c.points)).toEqual([0, 0, 0]);
    expect((await requisicao('/matches', 'POST', entrada)).status).toBe(201);
    const tabela = await requisicao('/standings');
    expect(tabela.dados).toEqual([
      {
        position: 1,
        club_id: visitante.clubeId,
        club_name: 'Delta FC',
        played: 1,
        wins: 1,
        draws: 0,
        losses: 0,
        goals_for: 2,
        goals_against: 1,
        goal_difference: 1,
        points: 3,
      },
      {
        position: 2,
        club_id: semJogos,
        club_name: 'Gama SC',
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
      },
      {
        position: 3,
        club_id: mandante.clubeId,
        club_name: 'Águias FC',
        played: 1,
        wins: 0,
        draws: 0,
        losses: 1,
        goals_for: 1,
        goals_against: 2,
        goal_difference: -1,
        points: 0,
      },
    ]);
    await requisicao('/matches', 'POST', entrada);
    expect(
      (await requisicao<Array<{ points: number; played: number }>>('/standings')).dados[0],
    ).toMatchObject({ points: 6, played: 2 });
  });

  it('empates de atributos não dão gols e empate de partida vale um ponto por clube', async () => {
    const times = timesExemplo();
    for (const time of [times.mandante, times.visitante]) {
      time.players = time.players.map((j) => ({
        ...j,
        condition: 'APTO',
        pace: 50,
        shooting: 50,
        passing: 50,
        dribbling: 50,
        defending: 50,
        physical: 50,
      }));
    }
    const { entrada } = await prepararConfronto(times);
    const partida = await requisicao<PartidaResposta>('/matches', 'POST', entrada);
    expect(partida.status).toBe(201);
    expect(partida.dados).toMatchObject({
      result: 'EMPATE',
      home: { goals: 0 },
      away: { goals: 0 },
    });
    expect(partida.dados.duels.every((d) => !d.goal)).toBe(true);
    const tabela = await requisicao<Array<{ points: number; draws: number }>>('/standings');
    expect(tabela.dados.map((c) => [c.points, c.draws])).toEqual([
      [1, 1],
      [1, 1],
    ]);
  });
});
