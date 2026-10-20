import { useQuery } from '@tanstack/react-query';
import { getLineup } from './lineups.api';

export function lineupKey(clubId: string) {
  return ['lineup', clubId] as const;
}

export function useLineup(clubId: string) {
  return useQuery({
    queryKey: lineupKey(clubId),
    queryFn: ({ signal }) => getLineup(clubId, signal),
  });
}
