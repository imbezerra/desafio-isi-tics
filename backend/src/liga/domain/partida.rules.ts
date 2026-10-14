import Decimal from 'decimal.js';

import { decimal } from '../../common/calculations/money.calculator';
import { AtributosJogador, Condicao, Posicao } from '../../common/domain.types';
import { RegraNegocioError } from '../../common/errors/regra-negocio.error';
import { ordenarElenco } from '../../common/orderings/elenco.ordering';
import { Formacao } from './formacoes';

export type JogadorPartida = AtributosJogador & {
  id: number;
  name: string;
  position: Posicao;
  condition: Condicao;
};
export type TimePartida = {
  id: number;
  name: string;
  formation: Formacao | null;
  players: JogadorPartida[];
};

export function calcularAtributoNaPartida(valor: number, condicao: Condicao): number {
  return condicao === 'MAL_CONDICIONADO'
    ? decimal(valor).times('0.85').toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
    : valor;
}

export function determinarResultado(golsMandante: number, golsVisitante: number) {
  return golsMandante > golsVisitante
    ? 'MANDANTE'
    : golsMandante < golsVisitante
      ? 'VISITANTE'
      : 'EMPATE';
}

function validarTimeCompleto(
  time: TimePartida,
): asserts time is TimePartida & { formation: Formacao } {
  if (
    time.formation === null ||
    time.players.length !== 5 ||
    time.players.some((j) => j.condition === 'DOENTE')
  ) {
    throw new RegraNegocioError('Os dois clubes devem ter escalação completa para jogar.');
  }
}

function atributoAtaque(jogador: JogadorPartida): 'shooting' | 'passing' | 'dribbling' {
  if (jogador.position === 'ATA') return 'shooting';
  if (jogador.position === 'MEI') return 'passing';
  return 'dribbling';
}

function calcularDuelo(
  ordem: number,
  clubeId: number,
  atacante: JogadorPartida,
  defensor: JogadorPartida,
) {
  const atributo = atributoAtaque(atacante);
  const ataque = calcularAtributoNaPartida(atacante[atributo], atacante.condition);
  const defesa = calcularAtributoNaPartida(defensor.defending, defensor.condition);
  return {
    order: ordem,
    attacking_club_id: clubeId,
    attacker: {
      player_id: atacante.id,
      player_name: atacante.name,
      position: atacante.position,
      condition: atacante.condition,
      attribute: atributo,
      value: ataque,
    },
    defender: {
      player_id: defensor.id,
      player_name: defensor.name,
      position: defensor.position,
      condition: defensor.condition,
      attribute: 'defending',
      value: defesa,
    },
    goal: ataque > defesa,
  };
}

export function jogarPartida(mandante: TimePartida, visitante: TimePartida) {
  validarTimeCompleto(mandante);
  validarTimeCompleto(visitante);
  const titularesMandante = ordenarElenco(mandante.players);
  const titularesVisitante = ordenarElenco(visitante.players);
  // Índice 0 é o goleiro; os índices 1 a 4 são os jogadores de linha na ordem RN11.
  const confrontos = [
    [4, 0],
    [3, 1],
    [2, 2],
  ] as const;
  const duels = [
    ...confrontos.map(([atacante, defensor], i) =>
      calcularDuelo(i + 1, mandante.id, titularesMandante[atacante], titularesVisitante[defensor]),
    ),
    ...confrontos.map(([atacante, defensor], i) =>
      calcularDuelo(i + 4, visitante.id, titularesVisitante[atacante], titularesMandante[defensor]),
    ),
  ];
  return {
    homeId: mandante.id,
    awayId: visitante.id,
    homeFormation: mandante.formation,
    awayFormation: visitante.formation,
    homeGoals: duels.slice(0, 3).filter((d) => d.goal).length,
    awayGoals: duels.slice(3).filter((d) => d.goal).length,
    duels,
  };
}

export type PartidaCalculada = ReturnType<typeof jogarPartida>;
