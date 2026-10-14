import { Transacao } from '@prisma/client';

import { formatarDataHoraBrasilia } from '../../common/parsers/date.parser';

export function apresentarTransacao(transacao: Transacao) {
  return {
    id: transacao.id,
    club_id: transacao.clubeId,
    player_id: transacao.jogadorId,
    player_name: transacao.nomeJogador,
    type: transacao.tipo,
    value: transacao.valor.toNumber(),
    fee: transacao.taxa.toNumber(),
    penalty: transacao.multa.toNumber(),
    profit: transacao.lucro?.toNumber() ?? null,
    cash_change: transacao.variacaoCaixa.toNumber(),
    created_at: formatarDataHoraBrasilia(transacao.criadoEm),
  };
}

export type RespostaTransacao = ReturnType<typeof apresentarTransacao>;
