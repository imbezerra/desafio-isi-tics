import { Club, Contract, Transaction } from '@prisma/client';

import { SaleCalculation } from '../domain/sale.rules';
import { presentTransaction } from './transaction.presenter';

export function presentSale(
  transaction: Transaction,
  contract: Contract,
  club: Club,
  sale: SaleCalculation,
) {
  return {
    ...presentTransaction(transaction),
    purchase_value: contract.purchaseValue.toNumber(),
    remaining_days: sale.remainingDays,
    penalty_rate: sale.penaltyRate,
    contract_status: contract.status,
    club_cash: club.cash.toNumber(),
  };
}
