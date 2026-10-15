import { sortSquad } from '../../../../src/common/orderings/squad.ordering';
import { PlayerPosition } from '../../../../src/common/domain.types';

describe('ordenação compartilhada do elenco conforme RN11', () => {
  it('ordena por posição, nome normalizado Unicode e id, preservando a entrada', () => {
    const player = (id: number, name: string, position: PlayerPosition) => ({ id, name, position });
    const input = [
      player(6, 'Ana-Maria Silva', 'MEI'),
      player(5, 'Ána Lima', 'MEI'),
      player(4, 'Ana Lima', 'MEI'),
      player(3, 'Rui Prado', 'GOL'),
      player(2, 'Davi Lins', 'LAT'),
      player(1, 'Téo Brandão', 'ZAG'),
      player(7, 'Otto Rangel', 'ATA'),
    ];
    expect(sortSquad(input).map((j) => j.id)).toEqual([3, 1, 2, 4, 5, 6, 7]);
    expect(input[0].id).toBe(6);
  });
});
