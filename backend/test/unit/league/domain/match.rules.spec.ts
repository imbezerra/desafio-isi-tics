import {
  calculateMatchAttribute,
  determineResult,
  playMatch,
} from '../../../../src/league/domain/match.rules';
import { BusinessRuleError } from '../../../../src/common/errors/business-rule.error';
import { exampleTeams } from '../../../fixtures/league.fixture';
import { Formation } from '../../../../src/league/domain/formations';
import { PlayerPosition } from '../../../../src/common/domain.types';

describe('duelos e placar conforme RN20', () => {
  it.each<[Formation, PlayerPosition[], string[]]>([
    ['3-1', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA'], ['shooting', 'dribbling', 'dribbling']],
    ['2-2', ['GOL', 'ZAG', 'LAT', 'ATA', 'ATA'], ['shooting', 'shooting', 'dribbling']],
    ['2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'], ['shooting', 'passing', 'dribbling']],
    ['1-2-1', ['GOL', 'ZAG', 'MEI', 'MEI', 'ATA'], ['shooting', 'passing', 'passing']],
  ])(
    'seleciona atributos de ataque conforme as posições na formação %s',
    (formation, positions, attributes) => {
      const { home, away } = exampleTeams();
      home.formation = formation;
      home.players = home.players.map((player, index) => ({
        ...player,
        position: positions[index],
      }));
      const match = playMatch(home, away);
      expect(match.duels.slice(0, 3).map((d) => d.attacker.attribute)).toEqual(attributes);
      expect(match.duels.every((d) => d.defender.attribute === 'defending')).toBe(true);
    },
  );

  it('reproduz os seis duelos do enunciado, inclusive empate sem gol e redução da condição', () => {
    const { home, away } = exampleTeams();
    home.players.reverse();
    const original = structuredClone({ home, away });
    const match = playMatch(home, away);
    expect(match).toMatchObject({ homeGoals: 1, awayGoals: 2 });
    expect(
      match.duels.map((d) => [
        d.order,
        d.attacker.player_name,
        d.defender.player_name,
        d.attacker.value,
        d.defender.value,
        d.goal,
      ]),
    ).toEqual([
      [1, 'Otto Rangel', 'Ivo Teles', 75, 72, true],
      [2, 'Lauro Neves', 'Hugo Vaz', 82, 84, false],
      [3, 'Davi Lins', 'Lino Matos', 63, 63, false],
      [4, 'Ugo Falcão', 'Rui Prado', 81, 77, true],
      [5, 'Nei Soares', 'Téo Brandão', 70, 84, false],
      [6, 'Lino Matos', 'Davi Lins', 79, 56, true],
    ]);
    expect(match.duels.map((d) => d.attacker.attribute)).toEqual([
      'shooting',
      'passing',
      'dribbling',
      'shooting',
      'passing',
      'dribbling',
    ]);
    expect(determineResult(match.homeGoals, match.awayGoals)).toBe('VISITANTE');
    expect(playMatch(home, away)).toEqual(match);
    expect({ home, away }).toEqual(original);
  });

  it('arredonda o meio para cima e mantém atributo APTO', () => {
    expect(calculateMatchAttribute(50, 'MAL_CONDICIONADO')).toBe(43);
    expect(calculateMatchAttribute(74, 'MAL_CONDICIONADO')).toBe(63);
    expect(calculateMatchAttribute(50, 'APTO')).toBe(50);
    expect(determineResult(3, 0)).toBe('MANDANTE');
    expect(determineResult(2, 2)).toBe('EMPATE');
  });

  it('recusa ausência de formação, titular doente e escalação incompleta', () => {
    const { home, away } = exampleTeams();
    expect(() => playMatch({ ...home, formation: null }, away)).toThrow(BusinessRuleError);
    expect(() => playMatch(home, { ...away, players: away.players.slice(1) })).toThrow(
      BusinessRuleError,
    );
    home.players[0].condition = 'DOENTE';
    expect(() => playMatch(home, away)).toThrow(BusinessRuleError);
  });
});
