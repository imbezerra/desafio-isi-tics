import {
  calculatePurchase,
  validatePurchase,
  validateLoyaltyPeriod,
} from '../../../../src/market/domain/purchase.rules';
import { calculateLoyalty } from '../../../../src/market/domain/loyalty.rules';
import { BusinessRuleError } from '../../../../src/common/errors/business-rule.error';
import { InvalidInputError } from '../../../../src/common/errors/invalid-input.error';

describe('compra conforme RN12–RN14', () => {
  it.each([
    ['30', '0.00', '30.00'],
    ['30.01', '1.50', '31.51'],
    ['47.62', '2.38', '50.00'],
  ])('calcula taxa e custo para valor %s', (value, fee, totalCost) => {
    const result = calculatePurchase(value, '100');
    expect(result.fee.toFixed(2)).toBe(fee);
    expect(result.totalCost.toFixed(2)).toBe(totalCost);
  });

  it('compara contra metade não arredondada do caixa', () => {
    expect(() => calculatePurchase('124.35', '261.15')).not.toThrow();
    expect(() => calculatePurchase('124.36', '261.15')).toThrow(BusinessRuleError);
  });

  it('recusa jogador ocupado, recompra e décimo terceiro jogador', () => {
    expect(() => validatePurchase(true, false, 0)).toThrow(BusinessRuleError);
    expect(() => validatePurchase(false, true, 0)).toThrow(BusinessRuleError);
    expect(() => validatePurchase(false, false, 12)).toThrow(BusinessRuleError);
    expect(() => validatePurchase(false, false, 11)).not.toThrow();
  });

  it('aceita prazo futuro até 1.095 dias exatos', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const maximum = new Date(now.getTime() + 1095 * 86_400_000);
    expect(() => validateLoyaltyPeriod(maximum, now)).not.toThrow();
    expect(() => validateLoyaltyPeriod(now, now)).toThrow(InvalidInputError);
    expect(() => validateLoyaltyPeriod(new Date(maximum.getTime() + 1), now)).toThrow(
      InvalidInputError,
    );
  });
});

describe('fidelidade conforme RN15', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  it.each([
    [0, 0, 0],
    [1, 1, 5],
    [30, 30, 5],
    [31, 31, 10],
    [180, 180, 10],
    [181, 181, 20],
  ])('para %i dias retorna %i dias e %i%%', (days, expected, rate) => {
    expect(calculateLoyalty(new Date(now.getTime() + days * 86_400_000), now)).toEqual({
      remainingDays: expected,
      penaltyRate: rate,
    });
  });

  it('arredonda fração de dia para cima', () => {
    expect(calculateLoyalty(new Date(now.getTime() + 30 * 86_400_000 + 1), now)).toEqual({
      remainingDays: 31,
      penaltyRate: 10,
    });
  });
});
