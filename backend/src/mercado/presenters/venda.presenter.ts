import { Clube, Contrato, Transacao } from '@prisma/client';

import { CalculoVenda } from '../domain/venda.rules';
import { apresentarTransacao } from './transacao.presenter';

export function apresentarVenda(
  transacao: Transacao,
  contrato: Contrato,
  clube: Clube,
  venda: CalculoVenda,
) {
  return {
    ...apresentarTransacao(transacao),
    purchase_value: contrato.valorCompra.toNumber(),
    remaining_days: venda.diasRestantes,
    penalty_rate: venda.percentualMulta,
    contract_status: contrato.situacao,
    club_cash: clube.caixa.toNumber(),
  };
}
