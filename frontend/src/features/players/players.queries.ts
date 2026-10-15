import { useQuery } from '@tanstack/react-query';
import { getPlayer, getPlayers, type PlayerFilters } from './players.api';

export function usePlayer(id: number) {
  return useQuery({
    queryKey: ['player', id],
    queryFn: ({ signal }) => getPlayer(id, signal),
    staleTime: 0,
  });
}

export function usePlayers(filters: PlayerFilters, page: number) {
  return useQuery({
    queryKey: ['players', filters, page],
    queryFn: ({ signal }) => getPlayers(filters, page, signal),
  });
}
