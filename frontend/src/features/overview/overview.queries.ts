import { useQuery } from '@tanstack/react-query';
import { getClubs, getOverview } from './overview.api';

export function useOverview() {
  return useQuery({ queryKey: ['overview'], queryFn: ({ signal }) => getOverview(signal) });
}

export function useClubs() {
  return useQuery({ queryKey: ['clubs', 'name'], queryFn: ({ signal }) => getClubs(signal) });
}
