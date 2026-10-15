import { calculateSale, validateSale } from '../../../../src/market/domain/sale.rules';
import { BusinessRuleError } from '../../../../src/common/errors/business-rule.error';

describe('venda conforme RN15 e RN16', () => {
  const moment = new Date('2026-11-05T16:40:00-03:00');

  it.each([
    ['37', '40', 117, '4.00', '3.00', '0.30', '35.70'],
    ['50', '42.50', 200, '8.50', '-7.50', '0.00', '34.00'],
    ['26.15', '30', 20, '1.50', '3.85', '0.39', '28.11'],
    ['25', '25', 0, '0.00', '0.00', '0.00', '25.00'],
    ['60', '75', 200, '10.00', '15.00', '2.00', '63.00'],
    ['10', '20.01', 0, '0.00', '10.01', '1.00', '19.01'],
  ])(
    'calcula a venda de %s por %s',
    (purchase, value, days, penalty, profit, commission, credit) => {
      const end = new Date(moment.getTime() + Number(days) * 86_400_000);
      const sale = calculateSale(value, purchase, end, moment);
      expect(sale.penalty.toFixed(2)).toBe(penalty);
      expect(sale.profit.toFixed(2)).toBe(profit);
      expect(sale.commission.toFixed(2)).toBe(commission);
      expect(sale.credit.toFixed(2)).toBe(credit);
      expect(sale.contractStatus).toBe(Number(days) > 0 ? 'RESCINDIDO' : 'ENCERRADO');
    },
  );

  it('arredonda dias para cima e usa a mesma faixa da consulta do clube', () => {
    const end = new Date(moment.getTime() + 30 * 86_400_000 + 60_000);
    expect(calculateSale('40', '37', end, moment)).toMatchObject({
      remainingDays: 31,
      penaltyRate: 10,
    });
  });

  it('recusa jogador livre', () => {
    expect(() => validateSale(null)).toThrow(BusinessRuleError);
    expect(() => validateSale(1)).not.toThrow();
  });
});
