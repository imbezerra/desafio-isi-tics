import type { HistoryFiltersValue, Transaction, TransactionType } from './history.api';

export const historyTypes: { value: TransactionType; label: string }[] = [
  { value: 'COMPRA', label: 'Compra' },
  { value: 'VENDA', label: 'Venda' },
];

export const defaultHistoryFilters: HistoryFiltersValue = {
  types: ['COMPRA', 'VENDA'],
  playerId: '',
};

export function getHistoryPlayers(transactions: Transaction[]) {
  const players = new Map<number, { id: number; name: string }>();

  for (const transaction of transactions) {
    if (!players.has(transaction.player_id))
      players.set(transaction.player_id, {
        id: transaction.player_id,
        name: transaction.player_name,
      });
  }

  return [...players.values()];
}
