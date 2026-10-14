import { Jogador } from '@prisma/client';

import { formatarDataHoraBrasilia } from '../../common/parsers/date.parser';
import { apresentarJogador } from '../../jogadores/presenters/jogador.presenter';
import { determinarResultado, TimePartida } from '../domain/partida.rules';
import { Formacao } from '../domain/formacoes';
import { PartidaComClubes, PartidaComDuelos } from '../repositories/partidas.repository';

export function prepararTimePartida(clube: {
  id: number;
  nome: string;
  formacao: string | null;
  escalacoes: { jogador: Jogador }[];
}): TimePartida {
  return {
    id: clube.id,
    name: clube.nome,
    formation: clube.formacao as Formacao | null,
    players: clube.escalacoes.map((item) => apresentarJogador(item.jogador)),
  };
}

export function apresentarResumoPartida(partida: PartidaComClubes) {
  return {
    id: partida.id,
    played_at: formatarDataHoraBrasilia(partida.jogadaEm),
    home: {
      club_id: partida.mandanteId,
      club_name: partida.mandante.nome,
      formation: partida.formacaoMandante,
      goals: partida.golsMandante,
    },
    away: {
      club_id: partida.visitanteId,
      club_name: partida.visitante.nome,
      formation: partida.formacaoVisitante,
      goals: partida.golsVisitante,
    },
    result: determinarResultado(partida.golsMandante, partida.golsVisitante),
  };
}

export function apresentarPartida(partida: PartidaComDuelos) {
  return {
    ...apresentarResumoPartida(partida),
    duels: partida.duelos.map((duelo) => ({
      order: duelo.ordem,
      attacking_club_id: duelo.clubeAtacanteId,
      attacker: {
        player_id: duelo.atacanteId,
        player_name: duelo.nomeAtacante,
        position: duelo.posicaoAtacante,
        condition: duelo.condicaoAtacante,
        attribute: duelo.atributoAtaque,
        value: duelo.valorAtaque,
      },
      defender: {
        player_id: duelo.defensorId,
        player_name: duelo.nomeDefensor,
        position: duelo.posicaoDefensor,
        condition: duelo.condicaoDefensor,
        attribute: duelo.atributoDefesa,
        value: duelo.valorDefesa,
      },
      goal: duelo.gol,
    })),
  };
}
