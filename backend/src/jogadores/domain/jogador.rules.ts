import { Condicao } from '../../common/domain.types';
import { RegraNegocioError } from '../../common/errors/regra-negocio.error';

type EstadoJogador = { clubeId: number | null; posicao: string; idade: number; condicao: string };

export function validarEdicaoJogador(
  jogador: EstadoJogador,
  novaPosicao: string,
  novaIdade: number,
): void {
  if (jogador.clubeId !== null && novaPosicao !== jogador.posicao) {
    throw new RegraNegocioError('Jogador com clube não pode mudar de posição.');
  }
  if (novaIdade < jogador.idade) throw new RegraNegocioError('A idade não pode diminuir.');
}

export function validarTransicaoCondicao(condicaoAtual: string, novaCondicao: Condicao): void {
  if (condicaoAtual === 'DOENTE' && novaCondicao === 'APTO') {
    throw new RegraNegocioError('Jogador DOENTE não pode passar direto para APTO.');
  }
}

export function validarExclusaoJogador(jogador: EstadoJogador): void {
  if (jogador.clubeId !== null)
    throw new RegraNegocioError('Só jogadores livres podem ser excluídos.');
}
