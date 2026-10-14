import Decimal from 'decimal.js';

import { arredondarMoeda, decimal } from '../../common/calculations/money.calculator';
import { RegraNegocioError } from '../../common/errors/regra-negocio.error';
import { EntradaInvalidaError } from '../../common/errors/entrada-invalida.error';

const DURACAO_DIA_MS = 24 * 60 * 60 * 1000;

export function validarPrazoFidelidade(fim: Date, momento: Date): void {
  const prazo = fim.getTime() - momento.getTime();
  if (prazo <= 0 || prazo > 1095 * DURACAO_DIA_MS) {
    throw new EntradaInvalidaError('loyalty_until deve ser futuro e estar até 1.095 dias adiante.');
  }
}

export function calcularCompra(valorMercado: Decimal.Value, caixa: Decimal.Value) {
  const valor = decimal(valorMercado);
  const caixaAtual = decimal(caixa);
  const taxa = valor.gt(30) ? arredondarMoeda(valor.times('0.05')) : decimal(0);
  const custo = valor.plus(taxa);
  if (custo.gt(caixaAtual.div(2))) {
    throw new RegraNegocioError('O custo da compra ultrapassa 50% do caixa do clube.');
  }
  return { valor, taxa, custo };
}

export function validarCompra(jogadorTemClube: boolean, vendidoAntes: boolean, elenco: number) {
  if (jogadorTemClube) throw new RegraNegocioError('Jogador já pertence a um clube.');
  if (vendidoAntes) throw new RegraNegocioError('Este clube já vendeu o jogador.');
  if (elenco >= 12) throw new RegraNegocioError('O clube atingiu o limite de 12 jogadores.');
}
