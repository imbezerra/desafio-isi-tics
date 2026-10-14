import {
  calcularAtributoNaPartida,
  determinarResultado,
  jogarPartida,
} from '../../../../src/liga/domain/partida.rules';
import { RegraNegocioError } from '../../../../src/common/errors/regra-negocio.error';
import { timesExemplo } from '../../../fixtures/liga.fixture';
import { Formacao } from '../../../../src/liga/domain/formacoes';
import { Posicao } from '../../../../src/common/domain.types';

describe('duelos e placar conforme RN20', () => {
  it.each<[Formacao, Posicao[], string[]]>([
    ['3-1', ['GOL', 'ZAG', 'LAT', 'LAT', 'ATA'], ['shooting', 'dribbling', 'dribbling']],
    ['2-2', ['GOL', 'ZAG', 'LAT', 'ATA', 'ATA'], ['shooting', 'shooting', 'dribbling']],
    ['2-1-1', ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'], ['shooting', 'passing', 'dribbling']],
    ['1-2-1', ['GOL', 'ZAG', 'MEI', 'MEI', 'ATA'], ['shooting', 'passing', 'passing']],
  ])(
    'seleciona atributos de ataque conforme as posições na formação %s',
    (formacao, posicoes, atributos) => {
      const { mandante, visitante } = timesExemplo();
      mandante.formation = formacao;
      mandante.players = mandante.players.map((jogador, indice) => ({
        ...jogador,
        position: posicoes[indice],
      }));
      const partida = jogarPartida(mandante, visitante);
      expect(partida.duels.slice(0, 3).map((d) => d.attacker.attribute)).toEqual(atributos);
      expect(partida.duels.every((d) => d.defender.attribute === 'defending')).toBe(true);
    },
  );

  it('reproduz os seis duelos do enunciado, inclusive empate sem gol e redução da condição', () => {
    const { mandante, visitante } = timesExemplo();
    mandante.players.reverse();
    const original = structuredClone({ mandante, visitante });
    const partida = jogarPartida(mandante, visitante);
    expect(partida).toMatchObject({ homeGoals: 1, awayGoals: 2 });
    expect(
      partida.duels.map((d) => [
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
    expect(partida.duels.map((d) => d.attacker.attribute)).toEqual([
      'shooting',
      'passing',
      'dribbling',
      'shooting',
      'passing',
      'dribbling',
    ]);
    expect(determinarResultado(partida.homeGoals, partida.awayGoals)).toBe('VISITANTE');
    expect(jogarPartida(mandante, visitante)).toEqual(partida);
    expect({ mandante, visitante }).toEqual(original);
  });

  it('arredonda o meio para cima e mantém atributo APTO', () => {
    expect(calcularAtributoNaPartida(50, 'MAL_CONDICIONADO')).toBe(43);
    expect(calcularAtributoNaPartida(74, 'MAL_CONDICIONADO')).toBe(63);
    expect(calcularAtributoNaPartida(50, 'APTO')).toBe(50);
    expect(determinarResultado(3, 0)).toBe('MANDANTE');
    expect(determinarResultado(2, 2)).toBe('EMPATE');
  });

  it('recusa ausência de formação, titular doente e escalação incompleta', () => {
    const { mandante, visitante } = timesExemplo();
    expect(() => jogarPartida({ ...mandante, formation: null }, visitante)).toThrow(
      RegraNegocioError,
    );
    expect(() =>
      jogarPartida(mandante, { ...visitante, players: visitante.players.slice(1) }),
    ).toThrow(RegraNegocioError);
    mandante.players[0].condition = 'DOENTE';
    expect(() => jogarPartida(mandante, visitante)).toThrow(RegraNegocioError);
  });
});
