import type { SaleResult } from '../../src/features/market/sales.api';

export const sale: SaleResult = {
  id: 11,
  club_id: 7,
  player_id: 1,
  player_name: 'João Silva',
  type: 'VENDA',
  value: 40,
  fee: 0.3,
  penalty: 4,
  profit: 3,
  cash_change: 35.7,
  created_at: '2026-11-05T16:40:00-03:00',
  purchase_value: 37,
  remaining_days: 117,
  penalty_rate: 10,
  contract_status: 'RESCINDIDO',
  club_cash: 296.85,
};
