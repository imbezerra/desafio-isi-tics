import Decimal from 'decimal.js';

import { roundMoney, decimal } from '../../common/calculations/money.calculator';
import { BusinessRuleError } from '../../common/errors/business-rule.error';
import { calculateLoyalty } from './loyalty.rules';

export function validateSale(clubId: number | null): asserts clubId is number {
  if (clubId === null) throw new BusinessRuleError('Jogador livre não pode ser vendido.');
}

export function calculateSale(
  marketValue: Decimal.Value,
  purchaseValue: Decimal.Value,
  loyaltyEnd: Date,
  moment: Date,
) {
  const value = decimal(marketValue);
  const loyalty = calculateLoyalty(loyaltyEnd, moment);
  const penalty = Decimal.min(roundMoney(value.times(loyalty.penaltyRate).div(100)), 10);
  const profit = value.minus(purchaseValue);
  const positiveProfit = Decimal.max(profit, 0);
  const firstBracket = Decimal.min(positiveProfit, 10);
  const secondBracket = Decimal.max(positiveProfit.minus(10), 0);
  const commission = roundMoney(firstBracket.times('0.10').plus(secondBracket.times('0.20')));
  const credit = value.minus(penalty).minus(commission);
  const contractStatus = loyalty.remainingDays > 0 ? 'RESCINDIDO' : 'ENCERRADO';
  return { value, penalty, profit, commission, credit, contractStatus, ...loyalty };
}

export type SaleCalculation = ReturnType<typeof calculateSale>;
