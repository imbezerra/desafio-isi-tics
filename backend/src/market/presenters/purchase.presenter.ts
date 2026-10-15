import { Club, Contract, Transaction } from '@prisma/client';

import { formatBrasiliaDateTime } from '../../common/parsers/date.parser';
import { presentTransaction } from './transaction.presenter';

export function presentPurchase(transaction: Transaction, contract: Contract, club: Club) {
  return {
    ...presentTransaction(transaction),
    contract: {
      purchase_value: contract.purchaseValue.toNumber(),
      loyalty_until: formatBrasiliaDateTime(contract.loyaltyUntil),
      status: contract.status,
    },
    club_cash: club.cash.toNumber(),
  };
}
