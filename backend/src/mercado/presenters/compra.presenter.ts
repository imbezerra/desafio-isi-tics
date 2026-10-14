import { Clube, Contrato, Transacao } from '@prisma/client';

import { formatarDataHoraBrasilia } from '../../common/parsers/date.parser';

export function apresentarCompra(transacao: Transacao, contrato: Contrato, clube: Clube) {
  return {
    id: transacao.id,
    club_id: transacao.clubeId,
    player_id: transacao.jogadorId,
    player_name: transacao.nomeJogador,
    type: 'COMPRA',
    value: transacao.valor.toNumber(),
    fee: transacao.taxa.toNumber(),
    penalty: transacao.multa.toNumber(),
    profit: null,
    cash_change: transacao.variacaoCaixa.toNumber(),
    created_at: formatarDataHoraBrasilia(transacao.criadoEm),
    contract: {
      purchase_value: contrato.valorCompra.toNumber(),
      loyalty_until: formatarDataHoraBrasilia(contrato.fidelidadeAte),
      status: contrato.situacao,
    },
    club_cash: clube.caixa.toNumber(),
  };
}
