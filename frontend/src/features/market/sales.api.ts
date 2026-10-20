import { apiWrite } from '../../shared/api/client';

export interface SaleResult {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: 'VENDA';
  value: number;
  fee: number;
  penalty: number;
  profit: number;
  cash_change: number;
  created_at: string;
  purchase_value: number;
  remaining_days: number;
  penalty_rate: number;
  contract_status: 'RESCINDIDO' | 'ENCERRADO';
  club_cash: number;
}

export function sellPlayer(playerId: number) {
  return apiWrite<SaleResult>('POST', `/players/${playerId}/sell`);
}
