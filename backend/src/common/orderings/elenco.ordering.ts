import { Posicao, POSICOES } from '../domain.types';
import { compararNomes } from '../formatters/text.formatter';

type JogadorOrdenavel = { id: number; name: string; position: Posicao };

export function ordenarElenco<T extends JogadorOrdenavel>(jogadores: T[]): T[] {
  return [...jogadores].sort(
    (a, b) =>
      POSICOES.indexOf(a.position) - POSICOES.indexOf(b.position) ||
      compararNomes(a.name, b.name) ||
      a.id - b.id,
  );
}
