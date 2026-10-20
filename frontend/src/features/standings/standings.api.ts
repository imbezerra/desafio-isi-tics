import { apiGet } from '../../shared/api/client';
import type { Standing } from '../../shared/api/contracts';

export function getStandings(signal?: AbortSignal) {
  return apiGet<Standing[]>('/standings', signal);
}
