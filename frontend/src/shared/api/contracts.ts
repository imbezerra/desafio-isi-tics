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
