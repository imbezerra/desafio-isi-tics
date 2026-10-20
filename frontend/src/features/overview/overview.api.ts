import { apiGet } from '../../shared/api/client';
import type { PlayerList } from '../../shared/api/contracts';
import { getClubs } from '../clubs/clubs.api';
import { getMatches } from '../matches/matches.api';
import { getStandings } from '../standings/standings.api';

export async function getOverview(signal: AbortSignal) {
  const [players, freePlayers, clubs, matches, standings] = await Promise.all([
    apiGet<PlayerList>('/players?limit=1', signal),
    apiGet<PlayerList>('/players?free=true&limit=1', signal),
    getClubs('name', signal),
    getMatches('', signal),
    getStandings(signal),
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
