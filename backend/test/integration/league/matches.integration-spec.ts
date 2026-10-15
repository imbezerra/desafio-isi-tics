import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { configureApi } from '../../../src/app.config';
import { ClubsModule } from '../../../src/clubs/clubs.module';
import { formatBrasiliaDateTime } from '../../../src/common/parsers/date.parser';
import { PrismaModule } from '../../../src/database/prisma.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { PlayersModule } from '../../../src/players/players.module';
import { MatchPlayer, MatchTeam } from '../../../src/league/domain/match.rules';
import { LeagueModule } from '../../../src/league/league.module';
import { presentMatch, presentMatchSummary } from '../../../src/league/presenters/match.presenter';
import { MarketModule } from '../../../src/market/market.module';
import { exampleTeams } from '../../fixtures/league.fixture';

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test')) {
  throw new Error('Informe TEST_DATABASE_URL para um banco exclusivo terminado em _test.');
}
type MatchResponse = ReturnType<typeof presentMatch>;
type MatchSummary = ReturnType<typeof presentMatchSummary>;

describe('partidas e classificação com PostgreSQL real', () => {
  let app: INestApplication;
  let origin: string;
  const database = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  async function request<T = Record<string, unknown>>(
    requestPath: string,
    method = 'GET',
    body?: unknown,
  ) {
    const response = await fetch(`${origin}/api/v1${requestPath}`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      data: (text ? JSON.parse(text) : null) as T,
    };
  }

  async function createClub(name: string, acronym: string) {
    const response = await request<{ id: number }>('/clubs', 'POST', { name, acronym });
    expect(response.status).toBe(201);
    return response.data.id;
  }

  async function signPlayer(clubId: number, player: MatchPlayer) {
    const attributes = {
      pace: player.pace,
      shooting: player.shooting,
      passing: player.passing,
      dribbling: player.dribbling,
      defending: player.defending,
      physical: player.physical,
    };
    const registration = await request<{ id: number }>('/players', 'POST', {
      name: player.name,
      position: player.position,
      agility: 70,
      age: 25,
      ...attributes,
      potential: Math.max(...Object.values(attributes)),
    });
    expect(registration.status).toBe(201);
    const id = registration.data.id;
    const end = formatBrasiliaDateTime(new Date(Date.now() + 40 * 86_400_000)).replace(
      /:\d\d-03:00$/,
      '-03:00',
    );
    expect(
      (await request(`/players/${id}/buy`, 'POST', { club_id: clubId, loyalty_until: end })).status,
    ).toBe(200);
    if (player.condition !== 'APTO') {
      expect(
        (await request(`/players/${id}/condition`, 'PATCH', { condition: player.condition }))
          .status,
      ).toBe(200);
    }
    return id;
  }

  async function prepareTeam(team: MatchTeam, acronym: string) {
    const clubId = await createClub(team.name, acronym);
    const ids: Record<string, number> = {};
    for (const player of team.players) ids[player.name] = await signPlayer(clubId, player);
    expect(
      (
        await request(`/clubs/${clubId}/lineup`, 'PUT', {
          formation: team.formation,
          player_ids: Object.values(ids).reverse(),
        })
      ).status,
    ).toBe(200);
    return { clubId, ids };
  }

  async function prepareMatchup(teams = exampleTeams()) {
    const home = await prepareTeam(teams.home, 'AGU');
    const away = await prepareTeam(teams.away, 'DFC');
    return {
      home,
      away,
      input: { home_club_id: home.clubId, away_club_id: away.clubId },
    };
  }

  beforeAll(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [PrismaModule, PlayersModule, ClubsModule, MarketModule, LeagueModule],
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

  it('registra os seis duelos do enunciado com Location sem alterar outros dados', async () => {
    const { input } = await prepareMatchup();
    const before = {
      clubs: await database.club.findMany({ orderBy: { id: 'asc' } }),
      players: await database.player.findMany({ orderBy: { id: 'asc' } }),
      lineups: await database.lineupEntry.findMany({ orderBy: { playerId: 'asc' } }),
    };
    const response = await request<MatchResponse>('/matches', 'POST', input);
    expect(response.status).toBe(201);
    const match = response.data;
    expect(response.headers.get('location')).toBe(`/api/v1/matches/${match.id}`);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(match).toMatchObject({
      home: { club_name: 'Águias FC', formation: '2-1-1', goals: 1 },
      away: { club_name: 'Delta FC', formation: '2-1-1', goals: 2 },
      result: 'VISITANTE',
      played_at: expect.stringMatching(/-03:00$/),
    });
    expect(
      match.duels.map((d) => [
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
    expect((await request(`/matches/${match.id}`)).data).toEqual(match);
    expect(await database.match.count()).toBe(1);
    expect(await database.matchDuel.count()).toBe(6);
    expect({
      clubs: await database.club.findMany({ orderBy: { id: 'asc' } }),
      players: await database.player.findMany({ orderBy: { id: 'asc' } }),
      lineups: await database.lineupEntry.findMany({ orderBy: { playerId: 'asc' } }),
    }).toEqual(before);
  });

  it('mantém nomes, posições, condições e formações históricas após mudanças no elenco', async () => {
    const { input, home } = await prepareMatchup();
    const original = (await request<MatchResponse>('/matches', 'POST', input)).data;
    const id = home.ids['Davi Lins'];
    expect((await request(`/players/${id}/sell`, 'POST')).status).toBe(200);
    expect(
      (
        await request(`/players/${id}`, 'PUT', {
          name: 'Davi Alterado',
          position: 'ATA',
          agility: 70,
          age: 26,
        })
      ).status,
    ).toBe(200);
    expect(
      (await request(`/players/${id}/condition`, 'PATCH', { condition: 'DOENTE' })).status,
    ).toBe(200);
    expect((await request(`/players/${id}`, 'DELETE')).status).toBe(204);
    const substitute = await signPlayer(home.clubId, {
      ...exampleTeams().home.players[3],
      name: 'Meia Reserva',
    });
    expect(
      (
        await request(`/clubs/${home.clubId}/lineup`, 'PUT', {
          formation: '1-2-1',
          player_ids: [
            home.ids['Rui Prado'],
            home.ids['Téo Brandão'],
            home.ids['Lauro Neves'],
            substitute,
            home.ids['Otto Rangel'],
          ],
        })
      ).status,
    ).toBe(200);
    expect((await request(`/matches/${original.id}`)).data).toEqual(original);
  });

  it('repete confrontos, lista sem duelos e filtra mandante ou visitante com ordem e desempate', async () => {
    expect((await request('/matches')).data).toEqual([]);
    const { input, home, away } = await prepareMatchup();
    const first = await request<MatchResponse>('/matches', 'POST', input);
    const second = await request<MatchResponse>('/matches', 'POST', input);
    expect(second.data.duels).toEqual(first.data.duels);
    await database.match.updateMany({ data: { playedAt: new Date('2026-11-12T18:00:00Z') } });
    for (const query of ['', `?club_id=${home.clubId}`, `?club_id=${away.clubId}&extra=x`]) {
      const list = await request<MatchSummary[]>(`/matches${query}`);
      expect(list.status).toBe(200);
      expect(list.data.map((p) => p.id)).toEqual([second.data.id, first.data.id]);
      expect(list.data[0]).not.toHaveProperty('duels');
    }
    const other = await createClub('Gama SC', 'GSC');
    expect((await request(`/matches?club_id=${other}`)).data).toEqual([]);
    expect((await request('/matches?club_id=999')).status).toBe(404);
    expect((await request('/matches?club_id=01')).status).toBe(400);
    expect((await request('/matches/999')).status).toBe(404);
    expect((await request('/matches/01')).status).toBe(404);
  });

  it('recusa dados inválidos, clube inexistente e escalações incompletas sem gravar', async () => {
    const { input, home, away } = await prepareMatchup();
    const incomplete = await createClub('Gama SC', 'GSC');
    for (const [body, status] of [
      [[], 400],
      [{ ...input, away_club_id: input.home_club_id }, 400],
      [{ ...input, home_club_id: '1' }, 400],
      [{ ...input, away_club_id: 999 }, 404],
      [{ ...input, away_club_id: incomplete }, 409],
    ] as const) {
      const response = await request('/matches', 'POST', body);
      expect(response.status).toBe(status);
      expect(response.data).toEqual({ message: expect.any(String) });
    }
    await request(`/players/${home.ids['Davi Lins']}/condition`, 'PATCH', {
      condition: 'DOENTE',
    });
    expect((await request('/matches', 'POST', input)).status).toBe(409);
    await request(`/players/${home.ids['Davi Lins']}/condition`, 'PATCH', {
      condition: 'MAL_CONDICIONADO',
    });
    expect((await request('/matches', 'POST', input)).status).toBe(409);
    await request(`/clubs/${home.clubId}/lineup`, 'PUT', {
      formation: '2-1-1',
      player_ids: Object.values(home.ids),
    });
    await request(`/players/${away.ids['Ugo Falcão']}/sell`, 'POST');
    expect((await request('/matches', 'POST', input)).status).toBe(409);
    expect(await database.match.count()).toBe(0);
    expect(await database.matchDuel.count()).toBe(0);
  });

  it('desfaz a partida inteira se um dos seis duelos não puder ser gravado', async () => {
    const { input } = await prepareMatchup();
    await database.$executeRaw`ALTER TABLE duelos_partida ADD CONSTRAINT teste_falha_partida CHECK (ordem <> 4)`;
    try {
      expect((await request('/matches', 'POST', input)).status).toBe(500);
      expect(await database.match.count()).toBe(0);
      expect(await database.matchDuel.count()).toBe(0);
      expect(await database.lineupEntry.count()).toBe(10);
    } finally {
      await database.$executeRaw`ALTER TABLE duelos_partida DROP CONSTRAINT teste_falha_partida`;
    }
  });

  it('calcula classificação com clube sem jogos e atualiza a cada nova partida', async () => {
    expect((await request('/standings')).data).toEqual([]);
    const withoutMatches = await createClub('Gama SC', 'GSC');
    const { input, home, away } = await prepareMatchup();
    const zeros = await request<Array<Record<string, unknown>>>('/standings');
    expect(zeros.data.map((c) => c.points)).toEqual([0, 0, 0]);
    expect((await request('/matches', 'POST', input)).status).toBe(201);
    const table = await request('/standings');
    expect(table.data).toEqual([
      {
        position: 1,
        club_id: away.clubId,
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
        club_id: withoutMatches,
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
        club_id: home.clubId,
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
    await request('/matches', 'POST', input);
    expect(
      (await request<Array<{ points: number; played: number }>>('/standings')).data[0],
    ).toMatchObject({ points: 6, played: 2 });
  });

  it('empates de atributos não dão gols e empate de partida vale um ponto por clube', async () => {
    const teams = exampleTeams();
    for (const team of [teams.home, teams.away]) {
      team.players = team.players.map((j) => ({
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
    const { input } = await prepareMatchup(teams);
    const match = await request<MatchResponse>('/matches', 'POST', input);
    expect(match.status).toBe(201);
    expect(match.data).toMatchObject({
      result: 'EMPATE',
      home: { goals: 0 },
      away: { goals: 0 },
    });
    expect(match.data.duels.every((d) => !d.goal)).toBe(true);
    const table = await request<Array<{ points: number; draws: number }>>('/standings');
    expect(table.data.map((c) => [c.points, c.draws])).toEqual([
      [1, 1],
      [1, 1],
    ]);
  });
});
