export const TRANSACTION_TYPES = ['COMPRA', 'VENDA'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export type HistoryQuery = {
  types?: TransactionType[];
  playerId?: number;
};
