import { apiWrite } from '../../shared/api/client';

export interface PurchaseInput {
  club_id: number;
  loyalty_until: string;
}

export interface PurchaseResult {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: 'COMPRA';
  value: number;
  fee: number;
  penalty: number;
  profit: null;
  cash_change: number;
  created_at: string;
  contract: { purchase_value: number; loyalty_until: string; status: 'ATIVO' };
  club_cash: number;
}

export function buyPlayer(playerId: number, input: PurchaseInput) {
  return apiWrite<PurchaseResult>('POST', `/players/${playerId}/buy`, input);
}
