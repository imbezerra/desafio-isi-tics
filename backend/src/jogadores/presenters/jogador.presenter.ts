import { Jogador } from '@prisma/client';

import { Condicao, Posicao } from '../../common/domain.types';
import {
  calcularOverall,
  calcularValorMercado,
} from '../../common/calculations/player-value.calculator';

export function apresentarJogador(jogador: Jogador) {
  const atributos = {
    pace: jogador.velocidade,
    shooting: jogador.finalizacao,
    passing: jogador.passe,
    dribbling: jogador.drible,
    defending: jogador.defesa,
    physical: jogador.fisico,
  };
  return {
    id: jogador.id,
    name: jogador.nome,
    position: jogador.posicao as Posicao,
    agility: jogador.agilidade,
    age: jogador.idade,
    condition: jogador.condicao as Condicao,
    base_value: jogador.valorBase.toNumber(),
    market_value: calcularValorMercado(
      jogador.valorBase.toString(),
      jogador.condicao as Condicao,
      jogador.agilidade,
      jogador.idade,
    ).toNumber(),
    ...atributos,
    potential: jogador.potencial,
    overall: calcularOverall(jogador.posicao as Posicao, atributos),
    club_id: jogador.clubeId,
  };
}

export type RespostaJogador = ReturnType<typeof apresentarJogador>;
