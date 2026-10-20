import { apiGet, apiWrite } from '../../shared/api/client';
import type { Player } from '../../shared/api/contracts';

export type Formation = '3-1' | '2-2' | '2-1-1' | '1-2-1';

export interface Lineup {
  club_id: number;
  formation: Formation | null;
  complete: boolean;
  players: Player[];
}

export interface LineupInput {
  formation: Formation;
  player_ids: number[];
}

function lineupPath(clubId: string) {
  return `/clubs/${encodeURIComponent(clubId)}/lineup`;
}

export function getLineup(clubId: string, signal?: AbortSignal) {
  return apiGet<Lineup>(lineupPath(clubId), signal);
}

export function saveLineup(clubId: string, input: LineupInput) {
  return apiWrite<Lineup>('PUT', lineupPath(clubId), input);
}
