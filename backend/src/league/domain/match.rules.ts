import Decimal from 'decimal.js';

import { decimal } from '../../common/calculations/money.calculator';
import { PlayerAttributes, PlayerCondition, PlayerPosition } from '../../common/domain.types';
import { BusinessRuleError } from '../../common/errors/business-rule.error';
import { sortSquad } from '../../common/orderings/squad.ordering';
import { Formation } from './formations';

export type MatchPlayer = PlayerAttributes & {
  id: number;
  name: string;
  position: PlayerPosition;
  condition: PlayerCondition;
};
export type MatchTeam = {
  id: number;
  name: string;
  formation: Formation | null;
  players: MatchPlayer[];
};

export function calculateMatchAttribute(value: number, condition: PlayerCondition): number {
  return condition === 'MAL_CONDICIONADO'
    ? decimal(value).times('0.85').toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
    : value;
}

export function determineResult(homeGoals: number, awayGoals: number) {
  return homeGoals > awayGoals ? 'MANDANTE' : homeGoals < awayGoals ? 'VISITANTE' : 'EMPATE';
}

function validateCompleteTeam(
  team: MatchTeam,
): asserts team is MatchTeam & { formation: Formation } {
  if (
    team.formation === null ||
    team.players.length !== 5 ||
    team.players.some((j) => j.condition === 'DOENTE')
  ) {
    throw new BusinessRuleError('Os dois clubes devem ter escalação completa para jogar.');
  }
}

function attackAttribute(player: MatchPlayer): 'shooting' | 'passing' | 'dribbling' {
  if (player.position === 'ATA') return 'shooting';
  if (player.position === 'MEI') return 'passing';
  return 'dribbling';
}

function calculateDuel(
  order: number,
  clubId: number,
  attacker: MatchPlayer,
  defender: MatchPlayer,
) {
  const attribute = attackAttribute(attacker);
  const attack = calculateMatchAttribute(attacker[attribute], attacker.condition);
  const defending = calculateMatchAttribute(defender.defending, defender.condition);
  return {
    order: order,
    attacking_club_id: clubId,
    attacker: {
      player_id: attacker.id,
      player_name: attacker.name,
      position: attacker.position,
      condition: attacker.condition,
      attribute: attribute,
      value: attack,
    },
    defender: {
      player_id: defender.id,
      player_name: defender.name,
      position: defender.position,
      condition: defender.condition,
      attribute: 'defending',
      value: defending,
    },
    goal: attack > defending,
  };
}

export function playMatch(home: MatchTeam, away: MatchTeam) {
  validateCompleteTeam(home);
  validateCompleteTeam(away);
  const homeStarters = sortSquad(home.players);
  const awayStarters = sortSquad(away.players);
  // Índice 0 é o goleiro; os índices 1 a 4 são os jogadores de linha na ordem RN11.
  const matchups = [
    [4, 0],
    [3, 1],
    [2, 2],
  ] as const;
  const duels = [
    ...matchups.map(([attacker, defender], i) =>
      calculateDuel(i + 1, home.id, homeStarters[attacker], awayStarters[defender]),
    ),
    ...matchups.map(([attacker, defender], i) =>
      calculateDuel(i + 4, away.id, awayStarters[attacker], homeStarters[defender]),
    ),
  ];
  return {
    homeClubId: home.id,
    awayClubId: away.id,
    homeFormation: home.formation,
    awayFormation: away.formation,
    homeGoals: duels.slice(0, 3).filter((duel) => duel.goal).length,
    awayGoals: duels.slice(3).filter((duel) => duel.goal).length,
    duels,
  };
}

export type CalculatedMatch = ReturnType<typeof playMatch>;
