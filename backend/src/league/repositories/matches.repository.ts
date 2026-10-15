import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CalculatedMatch } from '../domain/match.rules';
import { MatchQuery } from '../dto/match.dto';

const matchClubs = {
  home: { select: { id: true, name: true } },
  away: { select: { id: true, name: true } },
} satisfies Prisma.MatchInclude;
const matchDetails = {
  ...matchClubs,
  duels: { orderBy: { order: 'asc' } },
} satisfies Prisma.MatchInclude;
export type MatchWithClubs = Prisma.MatchGetPayload<{ include: typeof matchClubs }>;
export type MatchWithDuels = Prisma.MatchGetPayload<{ include: typeof matchDetails }>;

@Injectable()
export class MatchesRepository {
  constructor(
    @Inject(PrismaService) private readonly database: PrismaService | Prisma.TransactionClient,
  ) {}

  withTransaction<T>(operation: (repository: MatchesRepository) => Promise<T>): Promise<T> {
    if (!('$transaction' in this.database)) return operation(this);
    return this.database.$transaction((tx) => operation(new MatchesRepository(tx)), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  findClubWithStarters(id: number) {
    return this.database.club.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        formation: true,
        lineups: { where: { player: { deletedAt: null } }, include: { player: true } },
      },
    });
  }

  async clubExists(id: number): Promise<boolean> {
    return (await this.database.club.findUnique({ where: { id }, select: { id: true } })) !== null;
  }

  save(match: CalculatedMatch, moment: Date): Promise<MatchWithDuels> {
    return this.database.match.create({
      data: {
        homeClubId: match.homeClubId,
        awayClubId: match.awayClubId,
        homeGoals: match.homeGoals,
        awayGoals: match.awayGoals,
        homeFormation: match.homeFormation,
        awayFormation: match.awayFormation,
        playedAt: moment,
        duels: {
          create: match.duels.map((duel) => ({
            order: duel.order,
            attackingClubId: duel.attacking_club_id,
            attackerId: duel.attacker.player_id,
            defenderId: duel.defender.player_id,
            attackerName: duel.attacker.player_name,
            defenderName: duel.defender.player_name,
            attackerPosition: duel.attacker.position,
            defenderPosition: duel.defender.position,
            attackerCondition: duel.attacker.condition,
            defenderCondition: duel.defender.condition,
            attackAttribute: duel.attacker.attribute,
            defenseAttribute: duel.defender.attribute,
            attackValue: duel.attacker.value,
            defenseValue: duel.defender.value,
            goal: duel.goal,
          })),
        },
      },
      include: matchDetails,
    });
  }

  findById(id: number): Promise<MatchWithDuels | null> {
    return this.database.match.findUnique({ where: { id }, include: matchDetails });
  }

  list(query: MatchQuery): Promise<MatchWithClubs[]> {
    return this.database.match.findMany({
      where:
        query.clubId === undefined
          ? {}
          : { OR: [{ homeClubId: query.clubId }, { awayClubId: query.clubId }] },
      orderBy: [{ playedAt: 'desc' }, { id: 'desc' }],
      include: matchClubs,
    });
  }

  listStandingsClubs() {
    return this.database.club.findMany({ select: { id: true, name: true } });
  }

  listStandingsScores() {
    return this.database.match.findMany({
      select: { homeClubId: true, awayClubId: true, homeGoals: true, awayGoals: true },
    });
  }
}
