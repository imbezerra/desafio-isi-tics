import { ordenarElenco } from '../../../../src/common/orderings/elenco.ordering';
import { Posicao } from '../../../../src/common/domain.types';

describe('ordenação compartilhada do elenco conforme RN11', () => {
  it('ordena por posição, nome normalizado Unicode e id, preservando a entrada', () => {
    const jogador = (id: number, name: string, position: Posicao) => ({ id, name, position });
    const entrada = [
      jogador(6, 'Ana-Maria Silva', 'MEI'),
      jogador(5, 'Ána Lima', 'MEI'),
      jogador(4, 'Ana Lima', 'MEI'),
      jogador(3, 'Rui Prado', 'GOL'),
      jogador(2, 'Davi Lins', 'LAT'),
      jogador(1, 'Téo Brandão', 'ZAG'),
      jogador(7, 'Otto Rangel', 'ATA'),
    ];
    expect(ordenarElenco(entrada).map((j) => j.id)).toEqual([3, 1, 2, 4, 5, 6, 7]);
    expect(entrada[0].id).toBe(6);
  });
});
