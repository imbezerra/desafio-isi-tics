import { POSICOES } from '../../common/domain.types';
import { compararNomes, normalizarParaOrdenacao } from '../../common/formatters/text.formatter';
import { ConsultaJogadores, OrdenacaoJogador } from '../dto/jogador.dto';

type JogadorNaLista = {
  id: number;
  name: string;
  age: number;
  position: (typeof POSICOES)[number];
  market_value: number;
};

function comparar(a: JogadorNaLista, b: JogadorNaLista, criterio: OrdenacaoJogador): number {
  switch (criterio) {
    case 'value_asc':
      return a.market_value - b.market_value;
    case 'value_desc':
      return b.market_value - a.market_value;
    case 'age_asc':
      return a.age - b.age;
    case 'age_desc':
      return b.age - a.age;
    case 'position':
      return POSICOES.indexOf(a.position) - POSICOES.indexOf(b.position);
    case 'name':
      return compararNomes(a.name, b.name);
  }
}

export function montarListaJogadores<T extends JogadorNaLista>(
  jogadores: T[],
  consulta: ConsultaJogadores,
) {
  const busca =
    consulta.search === undefined ? undefined : normalizarParaOrdenacao(consulta.search);
  const filtrados = jogadores.filter(
    (jogador) =>
      (busca === undefined || normalizarParaOrdenacao(jogador.name).includes(busca)) &&
      jogador.market_value >= consulta.valorMinimo &&
      jogador.market_value <= consulta.valorMaximo,
  );
  filtrados.sort((a, b) => {
    for (const criterio of consulta.sort) {
      const resultado = comparar(a, b, criterio);
      if (resultado !== 0) return resultado;
    }
    return comparar(a, b, 'name') || a.id - b.id;
  });
  const inicio = (consulta.page - 1) * consulta.limit;
  return {
    data: filtrados.slice(inicio, inicio + consulta.limit),
    meta: {
      page: consulta.page,
      limit: consulta.limit,
      total_items: filtrados.length,
      total_pages: Math.ceil(filtrados.length / consulta.limit),
    },
  };
}
