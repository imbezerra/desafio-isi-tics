import type { Club, Player, PlayerList } from '../../src/shared/api/contracts';

export const club: Club = {
  id: 7,
  name: 'Águias FC',
  acronym: 'AGU',
  cash: 300,
  squad_value: 0,
  net_worth: 300,
};

export const player: Player = {
  id: 1,
  name: 'João Silva',
  position: 'MEI',
  overall: 73,
  agility: 85,
  age: 20,
  condition: 'APTO',
  base_value: 34.2,
  market_value: 37.62,
  club_id: null,
};

export function playerList(
  data: Player[] = [player],
  page = 1,
  totalItems = data.length,
): PlayerList {
  return {
    data,
    meta: { page, limit: 10, total_items: totalItems, total_pages: Math.ceil(totalItems / 10) },
  };
}
