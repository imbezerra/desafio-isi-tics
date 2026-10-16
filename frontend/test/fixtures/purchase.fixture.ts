import type { PurchaseResult } from '../../src/features/market/purchases.api';
import { club, player } from './league.fixture';

export const purchase: PurchaseResult = {
  id: 10,
  club_id: club.id,
  player_id: player.id,
  player_name: player.name,
  type: 'COMPRA',
  value: 37.62,
  fee: 1.88,
  penalty: 0,
  profit: null,
  cash_change: -39.5,
  created_at: '2026-10-15T15:00:00-03:00',
  contract: {
    purchase_value: 37.62,
    loyalty_until: '2027-03-02T10:15:00-03:00',
    status: 'ATIVO',
  },
  club_cash: 260.5,
};
