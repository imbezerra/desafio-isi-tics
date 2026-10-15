import { validateLineup } from '../../../../src/league/domain/lineup.rules';
import { Formation } from '../../../../src/league/domain/formations';
import { BusinessRuleError } from '../../../../src/common/errors/business-rule.error';

const player = (position: string) => ({ position, clubId: 1, condition: 'APTO' });

describe('formações conforme RN19', () => {
  it.each<[Formation, string[]]>([
    ['3-1', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA']],
    ['2-2', ['GOL', 'ZAG', 'LAT', 'ATA', 'ATA']],
    ['2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA']],
    ['1-2-1', ['GOL', 'LAT', 'MEI', 'MEI', 'ATA']],
  ])(
    'aceita %s com posições correspondentes, independentemente da ordem',
    (formation, positions) => {
      expect(() => validateLineup(1, formation, positions.map(player).reverse())).not.toThrow();
    },
  );

  it('permite MAL_CONDICIONADO e recusa DOENTE, livre e jogador de outro clube', () => {
    const starters = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'].map(player);
    for (const change of [{ condition: 'DOENTE' }, { clubId: null }, { clubId: 2 }]) {
      expect(() =>
        validateLineup(1, '2-1-1', [{ ...starters[0], ...change }, ...starters.slice(1)]),
      ).toThrow(BusinessRuleError);
    }
    expect(() =>
      validateLineup(1, '2-1-1', [
        { ...starters[0], condition: 'MAL_CONDICIONADO' },
        ...starters.slice(1),
      ]),
    ).not.toThrow();
  });

  it.each([
    ['ATA', 'ZAG', 'LAT', 'MEI', 'ATA'],
    ['GOL', 'GOL', 'LAT', 'MEI', 'ATA'],
    ['GOL', 'MEI', 'LAT', 'MEI', 'ATA'],
    ['GOL', 'ZAG', 'LAT', 'MEI'],
  ])('recusa distribuição incompatível: %j', (...positions) => {
    expect(() => validateLineup(1, '2-1-1', positions.map(player))).toThrow(BusinessRuleError);
  });
});
