import { MatchPlayer, MatchTeam } from '../../src/league/domain/match.rules';
import { PlayerPosition } from '../../src/common/domain.types';

function starter(
  id: number,
  name: string,
  position: PlayerPosition,
  attributes: Partial<MatchPlayer>,
): MatchPlayer {
  return {
    id,
    name,
    position,
    condition: 'APTO',
    pace: 1,
    shooting: 1,
    passing: 1,
    dribbling: 1,
    defending: 1,
    physical: 1,
    ...attributes,
  };
}

// Valores e nomes do exemplo completo da RN20. Os demais atributos não entram nos duelos.
export function exampleTeams(): { home: MatchTeam; away: MatchTeam } {
  return {
    home: {
      id: 1,
      name: 'Águias FC',
      formation: '2-1-1',
      players: [
        starter(30, 'Rui Prado', 'GOL', { defending: 77 }),
        starter(32, 'Téo Brandão', 'ZAG', { defending: 84 }),
        starter(31, 'Davi Lins', 'LAT', {
          dribbling: 74,
          defending: 66,
          condition: 'MAL_CONDICIONADO',
        }),
        starter(33, 'Lauro Neves', 'MEI', { passing: 82 }),
        starter(34, 'Otto Rangel', 'ATA', { shooting: 75 }),
      ],
    },
    away: {
      id: 2,
      name: 'Delta FC',
      formation: '2-1-1',
      players: [
        starter(40, 'Ivo Teles', 'GOL', { defending: 72 }),
        starter(41, 'Hugo Vaz', 'ZAG', { defending: 84 }),
        starter(42, 'Lino Matos', 'LAT', { dribbling: 79, defending: 63 }),
        starter(43, 'Nei Soares', 'MEI', { passing: 70 }),
        starter(44, 'Ugo Falcão', 'ATA', { shooting: 81 }),
      ],
    },
  };
}
