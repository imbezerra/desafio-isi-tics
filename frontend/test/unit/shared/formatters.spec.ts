import { describe, expect, it } from 'vitest';
import { formatBrasiliaDateTime, formatMoney, getInitials } from '../../../src/shared/formatters';

describe('Apresentação em português do Brasil', () => {
  it('formata moedas com duas casas e vírgula sem recalcular valores', () => {
    expect(formatMoney(1739.11)).toBe('1.739,11');
    expect(formatMoney(0)).toBe('0,00');
    expect(formatMoney(37)).toBe('37,00');
  });

  it('mostra as iniciais do nome', () => expect(getInitials('  João Silva ')).toBe('JS'));

  it('apresenta a fidelidade em Brasília, independentemente do fuso do navegador', () => {
    expect(formatBrasiliaDateTime('2027-03-02T10:15:00-03:00')).toEqual({
      date: '02/03/2027',
      time: '10:15',
    });

    expect(formatBrasiliaDateTime('2027-03-02T13:15:00Z')).toEqual({
      date: '02/03/2027',
      time: '10:15',
    });
  });

  it('respeita a virada de dia e apresenta meia-noite como 00:00', () => {
    expect(formatBrasiliaDateTime('2027-01-01T02:30:00Z')).toEqual({
      date: '31/12/2026',
      time: '23:30',
    });

    expect(formatBrasiliaDateTime('2027-01-01T03:00:00Z')).toEqual({
      date: '01/01/2027',
      time: '00:00',
    });
  });
});
