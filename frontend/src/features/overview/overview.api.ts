import { apiGet } from '../../shared/api/client';
import type { Club, MatchSummary, PlayerList, Standing } from '../../shared/api/contracts';
export function getClubs(signal?: AbortSignal) {
  return apiGet<Club[]>('/clubs?sort=name', signal);
}
export async function getOverview(signal: AbortSignal) {
  const [players, freePlayers, clubs, matches, standings] = await Promise.all([
    apiGet<PlayerList>('/players?limit=1', signal),
    apiGet<PlayerList>('/players?free=true&limit=1', signal),
    getClubs(signal),
    apiGet<MatchSummary[]>('/matches', signal),
    apiGet<Standing[]>('/standings', signal),
  ]);
  return {
    playerCount: players.meta.total_items,
    freeCount: freePlayers.meta.total_items,
    clubs,
    matchCount: matches.length,
    latestMatch: matches[0],
    leader: matches.length > 0 ? standings[0] : undefined,
  };
}
