import { useQuery } from '@tanstack/react-query';
import { getOverview } from './overview.api';

export function useOverview() {
  return useQuery({ queryKey: ['overview'], queryFn: ({ signal }) => getOverview(signal) });
}
