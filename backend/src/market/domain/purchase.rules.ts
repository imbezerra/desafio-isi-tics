import Decimal from 'decimal.js';

import { roundMoney, decimal } from '../../common/calculations/money.calculator';
import { BusinessRuleError } from '../../common/errors/business-rule.error';
import { InvalidInputError } from '../../common/errors/invalid-input.error';

const DAY_DURATION_MS = 24 * 60 * 60 * 1000;

export function validateLoyaltyPeriod(end: Date, moment: Date): void {
  const duration = end.getTime() - moment.getTime();
  if (duration <= 0 || duration > 1095 * DAY_DURATION_MS) {
    throw new InvalidInputError('loyalty_until deve ser futuro e estar até 1.095 dias adiante.');
  }
}

export function calculatePurchase(marketValue: Decimal.Value, cash: Decimal.Value) {
  const value = decimal(marketValue);
  const currentCash = decimal(cash);
  const fee = value.gt(30) ? roundMoney(value.times('0.05')) : decimal(0);
  const totalCost = value.plus(fee);
  if (totalCost.gt(currentCash.div(2))) {
    throw new BusinessRuleError('O custo da compra ultrapassa 50% do caixa do clube.');
  }
  return { value, fee, totalCost };
}

export function validatePurchase(playerHasClub: boolean, soldBefore: boolean, squad: number) {
  if (playerHasClub) throw new BusinessRuleError('Jogador já pertence a um clube.');
  if (soldBefore) throw new BusinessRuleError('Este clube já vendeu o jogador.');
  if (squad >= 12) throw new BusinessRuleError('O clube atingiu o limite de 12 jogadores.');
}
