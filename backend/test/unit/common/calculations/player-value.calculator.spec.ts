import { PlayerAttributes } from '../../../../src/common/domain.types';

import {
  calculateOverall,
  calculateBaseValue,
  calculateMarketValue,
} from '../../../../src/common/calculations/player-value.calculator';

const midfielderAttributes: PlayerAttributes = {
  pace: 68,
  shooting: 65,
  passing: 80,
  dribbling: 78,
  defending: 52,
  physical: 60,
};

describe('cálculos de valor do jogador', () => {
  it('calcula o overall pelos pesos da posição e arredonda meio para cima', () => {
    expect(calculateOverall('MEI', midfielderAttributes)).toBe(73);
    expect(
      calculateOverall('ZAG', {
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
    expect(calculateBaseValue(70, 84, 21).toFixed(2)).toBe('34.20');
    expect(calculateBaseValue(45, 90, 18).toFixed(2)).toBe('3.63');
    expect(calculateBaseValue(40, 66, 36).toFixed(2)).toBe('1.00');
  });

  it('calcula valor de mercado com desconto de condição, agilidade, idade e piso', () => {
    expect(calculateMarketValue('82.00', 'MAL_CONDICIONADO', 80, 21).toFixed(2)).toBe('84.05');
    expect(calculateMarketValue('82.00', 'DOENTE', 10, 40).toFixed(2)).toBe('49.20');
    expect(calculateMarketValue('1.00', 'MAL_CONDICIONADO', 50, 35).toFixed(2)).toBe('1.00');
  });
});
