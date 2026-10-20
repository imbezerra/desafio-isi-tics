import type { ClubDetails, SquadPlayer } from '../../src/shared/api/contracts';
import type { Lineup } from '../../src/features/lineups/lineups.api';
import { club, player } from './league.fixture';

export const lineupPlayers: SquadPlayer[] = [
  { ...player, id: 1, name: 'Bruno Tavares', position: 'GOL', club_id: club.id, contract: null },
  { ...player, id: 2, name: 'Felipe Moura', position: 'ZAG', club_id: club.id, contract: null },
  {
    ...player,
    id: 3,
    name: 'Diego Ramos',
    position: 'LAT',
    condition: 'MAL_CONDICIONADO',
    defending: 66,
    dribbling: 74,
    club_id: club.id,
    contract: null,
  },
  {
    ...player,
    id: 4,
    name: 'Sávio Lima',
    position: 'MEI',
    condition: 'MAL_CONDICIONADO',
    passing: 70,
    club_id: club.id,
    contract: null,
  },
  { ...player, id: 5, name: 'João Silva', position: 'ATA', club_id: club.id, contract: null },
  {
    ...player,
    id: 6,
    name: 'Lucas Ferraz',
    position: 'MEI',
    condition: 'DOENTE',
    club_id: club.id,
    contract: null,
  },
  { ...player, id: 7, name: 'Ana Matos', position: 'LAT', club_id: club.id, contract: null },
  { ...player, id: 8, name: 'Rui Prado', position: 'GOL', club_id: club.id, contract: null },
  { ...player, id: 9, name: 'Otto Rangel', position: 'ATA', club_id: club.id, contract: null },
  { ...player, id: 10, name: 'Lauro Neves', position: 'MEI', club_id: club.id, contract: null },
];

export const lineupClub: ClubDetails = { ...club, players: lineupPlayers };

export const emptyLineup: Lineup = {
  club_id: club.id,
  formation: null,
  complete: false,
  players: [],
};

export const completeLineup: Lineup = {
  club_id: club.id,
  formation: '2-1-1',
  complete: true,
  players: lineupPlayers.slice(0, 5),
};
