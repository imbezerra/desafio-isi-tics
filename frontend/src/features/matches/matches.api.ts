import { apiGet, apiWrite } from '../../shared/api/client';
import type { MatchSummary, PlayerCondition, PlayerPosition } from '../../shared/api/contracts';

export interface DuelPlayer {
  player_id: number;
  player_name: string;
  position: PlayerPosition;
  condition: PlayerCondition;
  attribute: 'shooting' | 'passing' | 'dribbling' | 'defending';
  value: number;
}

export interface Duel {
  order: number;
  attacking_club_id: number;
  attacker: DuelPlayer;
  defender: DuelPlayer;
  goal: boolean;
}

export interface MatchDetails extends MatchSummary {
  duels: Duel[];
}

export interface MatchInput {
  home_club_id: number;
  away_club_id: number;
}

export function getMatches(clubId = '', signal?: AbortSignal) {
  const query = clubId ? `?${new URLSearchParams({ club_id: clubId })}` : '';

  return apiGet<MatchSummary[]>(`/matches${query}`, signal);
}

export function getMatch(id: string, signal?: AbortSignal) {
  return apiGet<MatchDetails>(`/matches/${encodeURIComponent(id)}`, signal);
}

export function playMatch(input: MatchInput) {
  return apiWrite<MatchDetails>('POST', '/matches', input);
}
