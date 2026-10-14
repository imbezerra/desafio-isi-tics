import Decimal from 'decimal.js';

import { arredondarMoeda, decimal } from '../../common/calculations/money.calculator';
import { RegraNegocioError } from '../../common/errors/regra-negocio.error';
import { calcularFidelidade } from './fidelidade.rules';

export function validarVenda(clubeId: number | null): asserts clubeId is number {
  if (clubeId === null) throw new RegraNegocioError('Jogador livre não pode ser vendido.');
}

export function calcularVenda(
  valorMercado: Decimal.Value,
  valorCompra: Decimal.Value,
  fimFidelidade: Date,
  momento: Date,
) {
  const valor = decimal(valorMercado);
  const fidelidade = calcularFidelidade(fimFidelidade, momento);
  const multa = Decimal.min(arredondarMoeda(valor.times(fidelidade.percentualMulta).div(100)), 10);
  const lucro = valor.minus(valorCompra);
  const lucroPositivo = Decimal.max(lucro, 0);
  const primeiraFaixa = Decimal.min(lucroPositivo, 10);
  const segundaFaixa = Decimal.max(lucroPositivo.minus(10), 0);
  const comissao = arredondarMoeda(primeiraFaixa.times('0.10').plus(segundaFaixa.times('0.20')));
  const credito = valor.minus(multa).minus(comissao);
  const situacaoContrato = fidelidade.diasRestantes > 0 ? 'RESCINDIDO' : 'ENCERRADO';
  return { valor, multa, lucro, comissao, credito, situacaoContrato, ...fidelidade };
}

export type CalculoVenda = ReturnType<typeof calcularVenda>;
