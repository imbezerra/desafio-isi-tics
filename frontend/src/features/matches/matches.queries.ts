import { useQuery } from '@tanstack/react-query';
import { getMatch, getMatches, type MatchDetails } from './matches.api';

export function useMatches(clubId = '') {
  return useQuery({
    queryKey: ['matches', clubId],
    queryFn: ({ signal }) => getMatches(clubId, signal),
  });
}

export function matchKey(id: string) {
  return ['match', id] as const;
}

export function useMatch(id: string, createdMatch?: MatchDetails) {
  return useQuery({
    queryKey: matchKey(id),
    queryFn: ({ signal }) => getMatch(id, signal),
    initialData: String(createdMatch?.id) === id ? createdMatch : undefined,
    staleTime: 30_000,
  });
}
