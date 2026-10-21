import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

import { CreateClubPipe } from '../../../src/clubs/pipes/clubs.input';
import { ClubsRepository } from '../../../src/clubs/repositories/clubs.repository';
import { ClubsService } from '../../../src/clubs/services/clubs.service';
import { BusinessRuleError } from '../../../src/common/errors/business-rule.error';
import { DEMO_FREE_PLAYERS, DEMO_SOLD_PLAYER } from '../../../src/demo/demo.data';
import { seedDemo } from '../../../src/demo/demo.seed';
import { LineupsRepository } from '../../../src/league/repositories/lineups.repository';
import { LineupsService } from '../../../src/league/services/lineups.service';
import { MatchesService } from '../../../src/league/services/matches.service';
import { CreatePlayerPipe } from '../../../src/players/pipes/players.input';
import { PlayersRepository } from '../../../src/players/repositories/players.repository';
import { PlayersService } from '../../../src/players/services/players.service';

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith('_test')) {
  throw new Error('Informe TEST_DATABASE_URL para um banco exclusivo terminado em _test.');
}

describe('carga demonstrativa com PostgreSQL real', () => {
  const database = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  async function snapshot() {
    return Promise.all([
      database.club.findMany({ orderBy: { id: 'asc' } }),
      database.player.findMany({ orderBy: { id: 'asc' } }),
      database.contract.findMany({ orderBy: { id: 'asc' } }),
      database.transaction.findMany({ orderBy: { id: 'asc' } }),
      database.lineupEntry.findMany({ orderBy: [{ clubId: 'asc' }, { playerId: 'asc' }] }),
      database.match.findMany({ orderBy: { id: 'asc' } }),
      database.matchDuel.findMany({ orderBy: { id: 'asc' } }),
    ]);
  }

  beforeEach(async () => {
    await database.$executeRaw`TRUNCATE TABLE clubes, jogadores RESTART IDENTITY CASCADE`;
  });

  afterAll(async () => {
    await database.$disconnect();
  });

  it('cria elencos, condições, fidelidades, compra/venda, escalações e partida pelos serviços', async () => {
    const result = await seedDemo(database);
    const [clubs, players, contracts, transactions, starters, matches, duels] = await snapshot();

    expect(result).toMatchObject({ clubIds: [1, 2], playerCount: 14, matchId: 1 });
    expect(
      [clubs, players, contracts, transactions, starters, matches, duels].map(
        (rows) => rows.length,
      ),
    ).toEqual([2, 14, 11, 12, 10, 1, 6]);
    expect(players.filter((player) => player.clubId === null)).toHaveLength(4);
    expect(contracts.filter((contract) => contract.status === 'ATIVO')).toHaveLength(10);
    expect(contracts.filter((contract) => contract.status === 'RESCINDIDO')).toHaveLength(1);
    expect(contracts.every((contract) => contract.loyaltyUntil.getTime() > Date.now())).toBe(true);
    expect(new Set(players.map((player) => player.condition))).toEqual(
      new Set(['APTO', 'MAL_CONDICIONADO', 'DOENTE']),
    );
    const sale = transactions.find((transaction) => transaction.type === 'VENDA')!;
    expect(sale.playerName).toBe(DEMO_SOLD_PLAYER.input.name);
    expect(sale.penalty.greaterThan(0)).toBe(true);
    expect(sale.fee.greaterThan(0)).toBe(true);
    expect(sale.profit!.greaterThan(0)).toBe(true);
    for (const club of clubs) {
      const balance = transactions
        .filter((transaction) => transaction.clubId === club.id)
        .reduce((cash, transaction) => cash.plus(transaction.cashChange), new Decimal(300));
      expect(club.cash.equals(balance)).toBe(true);
      expect(club.cash.greaterThan(0)).toBe(true);
      const lineup = await new LineupsService(new LineupsRepository(database)).get(club.id);
      expect(lineup.complete).toBe(true);
      expect(lineup.players).toHaveLength(5);
    }
    expect([matches[0].homeGoals, matches[0].awayGoals]).toEqual([1, 2]);
    expect(duels.map((duel) => duel.order)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('recusa repetição sem alterar qualquer registro existente', async () => {
    await seedDemo(database);
    const before = await snapshot();

    await expect(seedDemo(database)).rejects.toThrow('exige um banco vazio');
    expect(await snapshot()).toEqual(before);
  });

  it('preserva um clube já existente sem acrescentar jogadores ou transações', async () => {
    await new ClubsService(new ClubsRepository(database)).create(
      new CreateClubPipe().transform({ name: 'Aurora FC', acronym: 'AFC' }),
    );
    const before = await snapshot();

    await expect(seedDemo(database)).rejects.toThrow(BusinessRuleError);
    expect(await snapshot()).toEqual(before);
  });

  it('recusa até banco que contém somente jogador excluído logicamente', async () => {
    const players = new PlayersService(new PlayersRepository(database));
    const player = await players.create(
      new CreatePlayerPipe().transform(DEMO_FREE_PLAYERS[0].input),
    );
    await players.delete(player.id);
    const before = await snapshot();

    await expect(seedDemo(database)).rejects.toThrow(BusinessRuleError);
    expect(await snapshot()).toEqual(before);
  });

  it('desfaz toda a carga se a última etapa falhar e permite tentar novamente', async () => {
    const play = jest
      .spyOn(MatchesService.prototype, 'play')
      .mockRejectedValueOnce(new Error('Falha simulada.'));
    try {
      await expect(seedDemo(database)).rejects.toThrow('Falha simulada.');
      expect((await snapshot()).map((rows) => rows.length)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    } finally {
      play.mockRestore();
    }
    expect((await seedDemo(database)).playerCount).toBe(14);
  });

  it('não duplica a carga em duas execuções concorrentes', async () => {
    const outcomes = await Promise.allSettled([seedDemo(database), seedDemo(database)]);

    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === 'rejected')).toHaveLength(1);
    expect((await snapshot()).map((rows) => rows.length)).toEqual([2, 14, 11, 12, 10, 1, 6]);
  });
});
