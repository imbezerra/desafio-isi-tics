import { apiGet, apiGetFile } from '../../../shared/api/client';

export type TransactionType = 'COMPRA' | 'VENDA';

export interface Transaction {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: TransactionType;
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  created_at: string;
}

export interface HistorySummaryData {
  total_spent: number;
  total_received: number;
  total_fees: number;
  total_penalties: number;
  total_profit: number;
}

export interface HistoryResult {
  data: Transaction[];
  summary: HistorySummaryData;
}

export interface HistoryFiltersValue {
  types: TransactionType[];
  playerId: string;
}

export function buildHistoryQuery(filters: HistoryFiltersValue): string {
  const query = new URLSearchParams();

  if (filters.types.length) query.set('type', filters.types.join(','));

  if (filters.playerId) query.set('player_id', filters.playerId);

  const value = query.toString();

  return value ? `?${value}` : '';
}

function historyPath(clubId: string, filters: HistoryFiltersValue, exportFile = false) {
  return `/clubs/${encodeURIComponent(clubId)}/transactions${exportFile ? '/export' : ''}${buildHistoryQuery(filters)}`;
}

export function getHistory(clubId: string, filters: HistoryFiltersValue, signal?: AbortSignal) {
  return apiGet<HistoryResult>(historyPath(clubId, filters), signal);
}

export function getHistoryCsv(clubId: string, filters: HistoryFiltersValue) {
  return apiGetFile(historyPath(clubId, filters, true));
}
