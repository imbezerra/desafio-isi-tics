import { describe, expect, it } from 'vitest';
import { formatMoney, getInitials } from '../../../src/shared/formatters';

describe('Apresentação em português do Brasil', () => {
  it('formata moedas com duas casas e vírgula sem recalcular valores', () => {
    expect(formatMoney(1739.11)).toBe('1.739,11');
    expect(formatMoney(0)).toBe('0,00');
    expect(formatMoney(37)).toBe('37,00');
  });
  it('mostra as iniciais do nome', () => expect(getInitials('  João Silva ')).toBe('JS'));
});
