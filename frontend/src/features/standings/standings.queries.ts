import { useQuery } from '@tanstack/react-query';
import { getStandings } from './standings.api';

export function useStandings() {
  return useQuery({ queryKey: ['standings'], queryFn: ({ signal }) => getStandings(signal) });
}
