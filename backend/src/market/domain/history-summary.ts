import { roundMoney, decimal } from '../../common/calculations/money.calculator';

type SummaryTransaction = {
  type: string;
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
};

export function calculateHistorySummary(transactions: SummaryTransaction[]) {
  let spent = decimal(0);
  let received = decimal(0);
  let fees = decimal(0);
  let penalties = decimal(0);
  let profit = decimal(0);
  for (const transaction of transactions) {
    fees = fees.plus(transaction.fee);
    if (transaction.type === 'COMPRA') {
      spent = spent.plus(transaction.value).plus(transaction.fee);
    } else if (transaction.type === 'VENDA') {
      received = received.plus(transaction.cash_change);
      penalties = penalties.plus(transaction.penalty);
      profit = profit.plus(transaction.profit ?? 0);
    }
  }
  return {
    total_spent: roundMoney(spent).toNumber(),
    total_received: roundMoney(received).toNumber(),
    total_fees: roundMoney(fees).toNumber(),
    total_penalties: roundMoney(penalties).toNumber(),
    total_profit: roundMoney(profit).toNumber(),
  };
}
