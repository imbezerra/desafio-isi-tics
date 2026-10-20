import type { Standing } from '../../src/shared/api/contracts';
import type { Duel, DuelPlayer, MatchDetails } from '../../src/features/matches/matches.api';
import { club } from './league.fixture';

export const leagueClubs = [
  club,
  { ...club, id: 8, name: 'Delta FC', acronym: 'DFC' },
  { ...club, id: 9, name: 'Gama SC', acronym: 'GAM' },
];

const attackers: DuelPlayer[] = [
  {
    player_id: 34,
    player_name: 'Otto Rangel Histórico',
    position: 'ATA',
    condition: 'APTO',
    attribute: 'shooting',
    value: 75,
  },
  {
    player_id: 33,
    player_name: 'Lauro Neves Histórico',
    position: 'MEI',
    condition: 'APTO',
    attribute: 'passing',
    value: 82,
  },
  {
    player_id: 31,
    player_name: 'Davi Lins Histórico',
    position: 'LAT',
    condition: 'MAL_CONDICIONADO',
    attribute: 'dribbling',
    value: 63,
  },
  {
    player_id: 44,
    player_name: 'Ugo Falcão Histórico',
    position: 'ATA',
    condition: 'APTO',
    attribute: 'shooting',
    value: 81,
  },
  {
    player_id: 43,
    player_name: 'Nei Soares Histórico',
    position: 'MEI',
    condition: 'APTO',
    attribute: 'passing',
    value: 70,
  },
  {
    player_id: 42,
    player_name: 'Lino Matos Histórico',
    position: 'LAT',
    condition: 'APTO',
    attribute: 'dribbling',
    value: 79,
  },
];
const defenders: DuelPlayer[] = [
  {
    player_id: 40,
    player_name: 'Ivo Teles Histórico',
    position: 'GOL',
    condition: 'APTO',
    attribute: 'defending',
    value: 72,
  },
  {
    player_id: 41,
    player_name: 'Hugo Vaz Histórico',
    position: 'ZAG',
    condition: 'APTO',
    attribute: 'defending',
    value: 84,
  },
  {
    player_id: 42,
    player_name: 'Lino Matos Histórico',
    position: 'LAT',
    condition: 'APTO',
    attribute: 'defending',
    value: 63,
  },
  {
    player_id: 30,
    player_name: 'Rui Prado Histórico',
    position: 'GOL',
    condition: 'APTO',
    attribute: 'defending',
    value: 77,
  },
  {
    player_id: 32,
    player_name: 'Téo Brandão Histórico',
    position: 'ZAG',
    condition: 'APTO',
    attribute: 'defending',
    value: 84,
  },
  {
    player_id: 31,
    player_name: 'Davi Lins Histórico',
    position: 'LAT',
    condition: 'MAL_CONDICIONADO',
    attribute: 'defending',
    value: 56,
  },
];

export const matchDuels: Duel[] = attackers.map((attacker, index) => ({
  order: index + 1,
  attacking_club_id: index < 3 ? 7 : 8,
  attacker,
  defender: defenders[index],
  goal: [0, 3, 5].includes(index),
}));

export const match: MatchDetails = {
  id: 42,
  played_at: '2026-11-12T15:00:00-03:00',
  home: { club_id: 7, club_name: 'Águias FC', formation: '2-1-1', goals: 1 },
  away: { club_id: 8, club_name: 'Delta FC', formation: '2-1-1', goals: 2 },
  result: 'VISITANTE',
  duels: matchDuels,
};

export const standings: Standing[] = [
  {
    position: 1,
    club_id: 8,
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
    club_id: 9,
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
    club_id: 7,
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
];
