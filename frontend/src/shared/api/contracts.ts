export type PlayerPosition = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';

export type PlayerCondition = 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE';

export interface Player {
  id: number;
  name: string;
  position: PlayerPosition;
  overall: number;
  agility: number;
  age: number;
  condition: PlayerCondition;
  base_value: number;
  market_value: number;
  club_id: number | null;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
}

export interface PlayerList {
  data: Player[];
  meta: { page: number; limit: number; total_items: number; total_pages: number };
}

export interface Club {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

export interface PlayerContract {
  purchase_value: number;
  loyalty_until: string;
  remaining_days: number;
  penalty_rate: number;
}

export interface SquadPlayer extends Player {
  contract: PlayerContract | null;
}

export interface ClubDetails extends Club {
  players: SquadPlayer[];
}

export interface MatchSummary {
  id: number;
  home: { club_name: string; goals: number };
  away: { club_name: string; goals: number };
}

export interface Standing {
  club_id: number;
  club_name: string;
  points: number;
}
