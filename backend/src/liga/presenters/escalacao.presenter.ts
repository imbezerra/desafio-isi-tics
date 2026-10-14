import { Jogador } from '@prisma/client';

import { ordenarElenco } from '../../common/orderings/elenco.ordering';
import { apresentarJogador } from '../../jogadores/presenters/jogador.presenter';

type ClubeComEscalacao = {
  id: number;
  formacao: string | null;
  escalacoes: { jogador: Jogador }[];
};

export function apresentarEscalacao(clube: ClubeComEscalacao) {
  const players = ordenarElenco(clube.escalacoes.map((item) => apresentarJogador(item.jogador)));
  return { club_id: clube.id, formation: clube.formacao, complete: players.length === 5, players };
}
