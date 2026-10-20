import { useQuery } from '@tanstack/react-query';
import { getHistory, type HistoryFiltersValue } from './history.api';

export function useHistory(clubId: string, filters: HistoryFiltersValue) {
  return useQuery({
    queryKey: ['history', clubId, filters],
    queryFn: ({ signal }) => getHistory(clubId, filters, signal),
  });
}
