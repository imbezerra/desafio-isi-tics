import { useQuery } from '@tanstack/react-query';
import { getClub, getClubs, type ClubSort } from './clubs.api';

export function useClubs(sort: ClubSort = 'name') {
  return useQuery({ queryKey: ['clubs', sort], queryFn: ({ signal }) => getClubs(sort, signal) });
}

export function useClub(id: string) {
  return useQuery({ queryKey: ['club', id], queryFn: ({ signal }) => getClub(id, signal) });
}
