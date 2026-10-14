import { AtributosJogador } from '../domain.types';

import {
  calcularOverall,
  calcularValorBase,
  calcularValorMercado,
} from './player-value.calculator';

const atributosMeia: AtributosJogador = {
  pace: 68,
  shooting: 65,
  passing: 80,
  dribbling: 78,
  defending: 52,
  physical: 60,
};

describe('cálculos de valor do jogador', () => {
  it('calcula o overall pelos pesos da posição e arredonda meio para cima', () => {
    expect(calcularOverall('MEI', atributosMeia)).toBe(73);
    expect(
      calcularOverall('ZAG', {
        pace: 50,
        shooting: 90,
        passing: 60,
        dribbling: 40,
        defending: 80,
        physical: 75,
      }),
    ).toBe(73);
  });

  it('calcula valor base somente com o overall, potencial e idade do cadastro', () => {
    expect(calcularValorBase(70, 84, 21).toFixed(2)).toBe('34.20');
    expect(calcularValorBase(45, 90, 18).toFixed(2)).toBe('3.63');
    expect(calcularValorBase(40, 66, 36).toFixed(2)).toBe('1.00');
  });

  it('calcula valor de mercado com desconto de condição, agilidade, idade e piso', () => {
    expect(calcularValorMercado('82.00', 'MAL_CONDICIONADO', 80, 21).toFixed(2)).toBe('84.05');
    expect(calcularValorMercado('82.00', 'DOENTE', 10, 40).toFixed(2)).toBe('49.20');
    expect(calcularValorMercado('1.00', 'MAL_CONDICIONADO', 50, 35).toFixed(2)).toBe('1.00');
  });
});
