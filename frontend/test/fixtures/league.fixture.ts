import type { Club, ClubDetails, Player, PlayerList } from '../../src/shared/api/contracts';

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
  pace: 70,
  shooting: 65,
  passing: 80,
  dribbling: 75,
  defending: 60,
  physical: 70,
  potential: 85,
};

export const clubDetails: ClubDetails = {
  ...club,
  cash: 51.58,
  squad_value: 222.68,
  net_worth: 274.26,
  players: [
    {
      ...player,
      club_id: club.id,
      contract: {
        purchase_value: 28.8,
        loyalty_until: '2027-03-02T10:15:00-03:00',
        remaining_days: 120,
        penalty_rate: 10,
      },
    },
  ],
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
