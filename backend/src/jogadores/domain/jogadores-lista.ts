import { POSICOES } from '../../common/domain.types';
import { normalizarParaOrdenacao } from '../../common/formatters/text.formatter';
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
    case 'name': {
      const primeiro = [...normalizarParaOrdenacao(a.name)];
      const segundo = [...normalizarParaOrdenacao(b.name)];
      for (let i = 0; i < Math.min(primeiro.length, segundo.length); i++) {
        const diferenca = primeiro[i].codePointAt(0)! - segundo[i].codePointAt(0)!;
        if (diferenca !== 0) return diferenca;
      }
      return primeiro.length - segundo.length;
    }
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
      jogador.market_value >= consulta.minValue &&
      jogador.market_value <= consulta.maxValue,
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
