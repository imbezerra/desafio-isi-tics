import Decimal from 'decimal.js';

import { AtributosJogador, Condicao, Posicao } from '../domain.types';

import { arredondarMoeda, decimal, limitarMinimo } from './money.calculator';

const PESOS_POR_POSICAO: Record<Posicao, AtributosJogador> = {
  GOL: { pace: 10, shooting: 0, passing: 20, dribbling: 0, defending: 40, physical: 30 },
  ZAG: { pace: 10, shooting: 0, passing: 15, dribbling: 0, defending: 45, physical: 30 },
  LAT: { pace: 25, shooting: 0, passing: 20, dribbling: 15, defending: 25, physical: 15 },
  MEI: { pace: 10, shooting: 15, passing: 35, dribbling: 25, defending: 5, physical: 10 },
  ATA: { pace: 20, shooting: 40, passing: 10, dribbling: 20, defending: 0, physical: 10 },
};

export function calcularOverall(posicao: Posicao, atributos: AtributosJogador): number {
  const pesos = PESOS_POR_POSICAO[posicao];
  const soma = (Object.keys(pesos) as (keyof AtributosJogador)[]).reduce(
    (acumulado, atributo) => acumulado.plus(atributos[atributo] * pesos[atributo]),
    new Decimal(0),
  );

  return soma.dividedBy(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

export function calcularValorBase(
  overall: number,
  potencial: number,
  idadeNoCadastro: number,
): Decimal {
  const primeiraFaixa = Math.max(0, Math.min(overall, 60) - 40);
  const segundaFaixa = Math.max(0, Math.min(overall, 75) - 60);
  const terceiraFaixa = Math.max(0, Math.min(overall, 99) - 75);
  let valor = decimal(primeiraFaixa)
    .times(0.5)
    .plus(segundaFaixa * 2)
    .plus(terceiraFaixa * 6);

  if (idadeNoCadastro <= 21) {
    valor = valor.times(
      decimal(100)
        .plus(potencial - overall)
        .dividedBy(100),
    );
  }

  return limitarMinimo(arredondarMoeda(valor), 1);
}

export function calcularValorMercado(
  valorBase: Decimal.Value,
  condicao: Condicao,
  agilidade: number,
  idadeAtual: number,
): Decimal {
  const descontoCondicao = calcularDescontoCondicao(condicao, agilidade);
  const ajusteIdade = idadeAtual <= 21 ? 10 : idadeAtual >= 32 ? -10 : 0;
  const percentualTotal = Math.max(-40, ajusteIdade - descontoCondicao);
  const valor = decimal(valorBase).times(decimal(100).plus(percentualTotal)).dividedBy(100);

  return limitarMinimo(arredondarMoeda(valor), 1);
}

function calcularDescontoCondicao(condicao: Condicao, agilidade: number): number {
  const descontoBase = condicao === 'MAL_CONDICIONADO' ? 15 : condicao === 'DOENTE' ? 30 : 0;

  if (descontoBase === 0) {
    return 0;
  }

  if (agilidade >= 80) {
    return descontoBase / 2;
  }

  return agilidade <= 30 ? descontoBase + 10 : descontoBase;
}
