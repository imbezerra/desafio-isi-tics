import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';

import { configureApi } from '../../../src/app.config';
import { ClubsModule } from '../../../src/clubs/clubs.module';
import { PlayerPosition } from '../../../src/common/domain.types';
import { formatBrasiliaDateTime } from '../../../src/common/parsers/date.parser';
import { PrismaModule } from '../../../src/database/prisma.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { PlayersModule } from '../../../src/players/players.module';
import { PlayerResponse } from '../../../src/players/presenters/player.presenter';
import { Formation } from '../../../src/league/domain/formations';
import { LeagueModule } from '../../../src/league/league.module';
import { MarketModule } from '../../../src/market/market.module';

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test')) {
  throw new Error('Informe TEST_DATABASE_URL para um banco exclusivo terminado em _test.');
}
type LineupEntry = {
  club_id: number;
  formation: string | null;
  complete: boolean;
  players: PlayerResponse[];
};

describe('escalações com PostgreSQL real', () => {
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
    return { status: response.status, data: (text ? JSON.parse(text) : null) as T };
  }

  async function createPlayer(position: PlayerPosition = 'MEI') {
    const response = await request<PlayerResponse>('/players', 'POST', {
      name: 'Meia Lua',
      position: position,
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
    expect(response.status).toBe(201);
    return response.data;
  }

  function loyaltyEnd() {
    return formatBrasiliaDateTime(new Date(Date.now() + 40 * 86_400_000)).replace(
      /:\d\d-03:00$/,
      '-03:00',
    );
  }

  async function prepareSquad(
    positions: PlayerPosition[] = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA', 'MEI'],
  ) {
    const club = await request<{ id: number }>('/clubs', 'POST', {
      name: 'Águias FC',
      acronym: 'AGU',
    });
    expect(club.status).toBe(201);
    const players: PlayerResponse[] = [];
    for (const position of positions) {
      const player = await createPlayer(position);
      expect(
        (
          await request(`/players/${player.id}/buy`, 'POST', {
            club_id: club.data.id,
            loyalty_until: loyaltyEnd(),
          })
        ).status,
      ).toBe(200);
      players.push(player);
    }
    return { clubId: club.data.id, players };
  }

  async function setLineup(
    clubId: number,
    players: PlayerResponse[],
    formation: Formation = '2-1-1',
  ) {
    return request<LineupEntry>(`/clubs/${clubId}/lineup`, 'PUT', {
      formation,
      player_ids: players.map((j) => j.id).reverse(),
      cash: 0,
    });
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

  it('consulta clube sem escalação e recusa clube inexistente ou id inválido', async () => {
    const club = await request<{ id: number }>('/clubs', 'POST', {
      name: 'Águias FC',
      acronym: 'AGU',
    });
    expect((await request(`/clubs/${club.data.id}/lineup`)).data).toEqual({
      club_id: club.data.id,
      formation: null,
      complete: false,
      players: [],
    });
    expect((await request('/clubs/999/lineup')).status).toBe(404);
    expect((await request('/clubs/01/lineup')).status).toBe(404);
    expect(
      (
        await request('/clubs/999/lineup', 'PUT', {
          formation: '2-1-1',
          player_ids: [1, 2, 3, 4, 5],
        })
      ).status,
    ).toBe(404);
  });

  it.each<[Formation, PlayerPosition[]]>([
    ['3-1', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA']],
    ['2-2', ['GOL', 'ZAG', 'LAT', 'ATA', 'ATA']],
    ['2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']],
    ['1-2-1', ['GOL', 'ZAG', 'MEI', 'MEI', 'ATA']],
  ])(
    'escala %s em ordem do elenco, aceita MAL_CONDICIONADO e mantém caixa',
    async (formation, positions) => {
      const { clubId, players } = await prepareSquad(positions);
      await request(`/players/${players[0].id}/condition`, 'PATCH', {
        condition: 'MAL_CONDICIONADO',
      });
      const previousCash = (
        await database.club.findUniqueOrThrow({ where: { id: clubId } })
      ).cash.toString();
      const response = await setLineup(clubId, players, formation);
      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        club_id: clubId,
        formation: formation,
        complete: true,
      });
      expect(response.data.players.map((j) => j.id)).toEqual(players.map((j) => j.id));
      expect(response.data.players[0]).toMatchObject({
        condition: 'MAL_CONDICIONADO',
        defending: 20,
        overall: expect.any(Number),
        market_value: 1,
        base_value: 1,
        potential: 20,
        club_id: clubId,
      });
      expect((await request(`/clubs/${clubId}/lineup`)).data).toEqual(response.data);
      expect(
        (await database.club.findUniqueOrThrow({ where: { id: clubId } })).cash.toString(),
      ).toBe(previousCash);
    },
  );

  it('substitui todos os titulares e a formação, preservando apenas os escolhidos', async () => {
    const { clubId, players } = await prepareSquad();
    expect((await setLineup(clubId, players.slice(0, 5))).status).toBe(200);
    const updated = [players[0], players[1], players[3], players[5], players[4]];
    expect((await setLineup(clubId, updated, '1-2-1')).status).toBe(200);
    const current = (await request<LineupEntry>(`/clubs/${clubId}/lineup`)).data;
    expect(current.formation).toBe('1-2-1');
    expect(current.players.map((j) => j.id)).toEqual(updated.map((j) => j.id));
    expect(await database.lineupEntry.count()).toBe(5);
  });

  it('preserva a escalação nas recusas de formato, jogador, condição e posições', async () => {
    const { clubId, players } = await prepareSquad();
    const starters = players.slice(0, 5);
    const original = (await setLineup(clubId, starters)).data;
    const freePlayer = await createPlayer();
    const deletedPlayer = await createPlayer();
    expect((await request(`/players/${deletedPlayer.id}`, 'DELETE')).status).toBe(204);
    const other = await request<{ id: number }>('/clubs', 'POST', {
      name: 'Delta FC',
      acronym: 'DFC',
    });
    const opponent = await createPlayer();
    expect(
      (
        await request(`/players/${opponent.id}/buy`, 'POST', {
          club_id: other.data.id,
          loyalty_until: loyaltyEnd(),
        })
      ).status,
    ).toBe(200);
    await request(`/players/${players[5].id}/condition`, 'PATCH', { condition: 'DOENTE' });
    const ids = starters.map((j) => j.id);
    const attempts: [unknown, number][] = [
      [{ formation: '4-0', player_ids: ids }, 400],
      [{ formation: '2-1-1', player_ids: ids.slice(1) }, 400],
      [{ formation: '2-1-1', player_ids: [ids[0], ...ids.slice(0, 4)] }, 400],
      [{ formation: '2-1-1', player_ids: [ids[0], ids[1], ids[2], 999, ids[4]] }, 404],
      [{ formation: '2-1-1', player_ids: [ids[0], ids[1], ids[2], deletedPlayer.id, ids[4]] }, 404],
      [{ formation: '2-1-1', player_ids: [ids[0], ids[1], ids[2], freePlayer.id, ids[4]] }, 409],
      [{ formation: '2-1-1', player_ids: [ids[0], ids[1], ids[2], opponent.id, ids[4]] }, 409],
      [{ formation: '2-1-1', player_ids: [ids[0], ids[1], ids[2], players[5].id, ids[4]] }, 409],
      [{ formation: '3-1', player_ids: ids }, 409],
    ];
    for (const [body, status] of attempts) {
      const response = await request(`/clubs/${clubId}/lineup`, 'PUT', body);
      expect(response.status).toBe(status);
      expect(response.data).toEqual({ message: expect.any(String) });
      expect((await request(`/clubs/${clubId}/lineup`)).data).toEqual(original);
    }
  });

  it('adoecer e vender removem titulares; recuperar condição não reinsere automaticamente', async () => {
    const { clubId, players } = await prepareSquad();
    const starters = players.slice(0, 5);
    await setLineup(clubId, starters);
    const midfield = players[3].id;
    expect(
      (await request(`/players/${midfield}/condition`, 'PATCH', { condition: 'DOENTE' })).status,
    ).toBe(200);
    const incomplete = (await request<LineupEntry>(`/clubs/${clubId}/lineup`)).data;
    expect(incomplete).toMatchObject({ formation: '2-1-1', complete: false });
    expect(incomplete.players).toHaveLength(4);
    await request(`/players/${midfield}/condition`, 'PATCH', { condition: 'MAL_CONDICIONADO' });
    expect((await request<LineupEntry>(`/clubs/${clubId}/lineup`)).data.players).toHaveLength(4);
    expect((await setLineup(clubId, starters)).data.complete).toBe(true);
    expect((await request(`/players/${players[4].id}/sell`, 'POST')).status).toBe(200);
    const afterSale = (await request<LineupEntry>(`/clubs/${clubId}/lineup`)).data;
    expect(afterSale).toMatchObject({ formation: '2-1-1', complete: false });
    expect(afterSale.players.map((j) => j.id)).not.toContain(players[4].id);
  });

  it('impede o mesmo jogador em duas escalações por restrição do banco', async () => {
    const { clubId, players } = await prepareSquad();
    await setLineup(clubId, players.slice(0, 5));
    const other = await request<{ id: number }>('/clubs', 'POST', {
      name: 'Delta FC',
      acronym: 'DFC',
    });

    expect(other.status).toBe(201);
    await expect(
      database.lineupEntry.create({ data: { clubId: other.data.id, playerId: players[0].id } }),
    ).rejects.toMatchObject({ code: 'P2002' });
    expect(await database.lineupEntry.count()).toBe(5);
    expect((await request<LineupEntry>(`/clubs/${clubId}/lineup`)).data.complete).toBe(true);
  });

  it('desfaz formação e exclusão dos titulares se a substituição falhar', async () => {
    const { clubId, players } = await prepareSquad();
    const original = (await setLineup(clubId, players.slice(0, 5))).data;
    const substitute = players[5].id;
    // O reserva não pertence à escalação anterior, permitindo simular falha depois da exclusão.
    expect(substitute).toBe(6);
    await database.$executeRaw`ALTER TABLE escalacoes ADD CONSTRAINT teste_falha_escalacao CHECK (jogador_id <> 6)`;
    try {
      const updated = [players[0], players[1], players[3], players[5], players[4]];
      expect((await setLineup(clubId, updated, '1-2-1')).status).toBe(500);
      expect((await request(`/clubs/${clubId}/lineup`)).data).toEqual(original);
      expect(await database.lineupEntry.count()).toBe(5);
    } finally {
      await database.$executeRaw`ALTER TABLE escalacoes DROP CONSTRAINT teste_falha_escalacao`;
    }
  });
});
