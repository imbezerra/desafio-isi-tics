import { Transaction } from '@prisma/client';

import { formatBrasiliaDateTime } from '../../common/parsers/date.parser';

export function presentTransaction(transaction: Transaction) {
  return {
    id: transaction.id,
    club_id: transaction.clubId,
    player_id: transaction.playerId,
    player_name: transaction.playerName,
    type: transaction.type,
    value: transaction.value.toNumber(),
    fee: transaction.fee.toNumber(),
    penalty: transaction.penalty.toNumber(),
    profit: transaction.profit?.toNumber() ?? null,
    cash_change: transaction.cashChange.toNumber(),
    created_at: formatBrasiliaDateTime(transaction.createdAt),
  };
}

export type TransactionResponse = ReturnType<typeof presentTransaction>;
