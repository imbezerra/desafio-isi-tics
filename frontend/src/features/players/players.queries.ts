import { useQuery } from '@tanstack/react-query';
import { getPlayers, type PlayerFilters } from './players.api';
export function usePlayers(filters: PlayerFilters, page: number) {
  return useQuery({
    queryKey: ['players', filters, page],
    queryFn: ({ signal }) => getPlayers(filters, page, signal),
  });
}
