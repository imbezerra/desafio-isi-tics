import { Player } from '@prisma/client';

import { formatBrasiliaDateTime } from '../../common/parsers/date.parser';
import { presentPlayer } from '../../players/presenters/player.presenter';
import { determineResult, MatchTeam } from '../domain/match.rules';
import { Formation } from '../domain/formations';
import { MatchWithClubs, MatchWithDuels } from '../repositories/matches.repository';

export function prepareMatchTeam(club: {
  id: number;
  name: string;
  formation: string | null;
  lineups: { player: Player }[];
}): MatchTeam {
  return {
    id: club.id,
    name: club.name,
    formation: club.formation as Formation | null,
    players: club.lineups.map((item) => presentPlayer(item.player)),
  };
}

export function presentMatchSummary(match: MatchWithClubs) {
  return {
    id: match.id,
    played_at: formatBrasiliaDateTime(match.playedAt),
    home: {
      club_id: match.homeClubId,
      club_name: match.home.name,
      formation: match.homeFormation,
      goals: match.homeGoals,
    },
    away: {
      club_id: match.awayClubId,
      club_name: match.away.name,
      formation: match.awayFormation,
      goals: match.awayGoals,
    },
    result: determineResult(match.homeGoals, match.awayGoals),
  };
}

export function presentMatch(match: MatchWithDuels) {
  return {
    ...presentMatchSummary(match),
    duels: match.duels.map((duel) => ({
      order: duel.order,
      attacking_club_id: duel.attackingClubId,
      attacker: {
        player_id: duel.attackerId,
        player_name: duel.attackerName,
        position: duel.attackerPosition,
        condition: duel.attackerCondition,
        attribute: duel.attackAttribute,
        value: duel.attackValue,
      },
      defender: {
        player_id: duel.defenderId,
        player_name: duel.defenderName,
        position: duel.defenderPosition,
        condition: duel.defenderCondition,
        attribute: duel.defenseAttribute,
        value: duel.defenseValue,
      },
      goal: duel.goal,
    })),
  };
}
