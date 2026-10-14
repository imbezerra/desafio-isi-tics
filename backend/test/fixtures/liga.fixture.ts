import { JogadorPartida, TimePartida } from '../../src/liga/domain/partida.rules';
import { Posicao } from '../../src/common/domain.types';

function titular(
  id: number,
  name: string,
  position: Posicao,
  atributos: Partial<JogadorPartida>,
): JogadorPartida {
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
    ...atributos,
  };
}

// Valores e nomes do exemplo completo da RN20. Os demais atributos não entram nos duelos.
export function timesExemplo(): { mandante: TimePartida; visitante: TimePartida } {
  return {
    mandante: {
      id: 1,
      name: 'Águias FC',
      formation: '2-1-1',
      players: [
        titular(30, 'Rui Prado', 'GOL', { defending: 77 }),
        titular(32, 'Téo Brandão', 'ZAG', { defending: 84 }),
        titular(31, 'Davi Lins', 'LAT', {
          dribbling: 74,
          defending: 66,
          condition: 'MAL_CONDICIONADO',
        }),
        titular(33, 'Lauro Neves', 'MEI', { passing: 82 }),
        titular(34, 'Otto Rangel', 'ATA', { shooting: 75 }),
      ],
    },
    visitante: {
      id: 2,
      name: 'Delta FC',
      formation: '2-1-1',
      players: [
        titular(40, 'Ivo Teles', 'GOL', { defending: 72 }),
        titular(41, 'Hugo Vaz', 'ZAG', { defending: 84 }),
        titular(42, 'Lino Matos', 'LAT', { dribbling: 79, defending: 63 }),
        titular(43, 'Nei Soares', 'MEI', { passing: 70 }),
        titular(44, 'Ugo Falcão', 'ATA', { shooting: 81 }),
      ],
    },
  };
}
