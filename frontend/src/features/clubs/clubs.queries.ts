import { useQuery } from '@tanstack/react-query';
import { getClubs, type ClubSort } from './clubs.api';

export function useClubs(sort: ClubSort = 'name') {
  return useQuery({ queryKey: ['clubs', sort], queryFn: ({ signal }) => getClubs(sort, signal) });
}
