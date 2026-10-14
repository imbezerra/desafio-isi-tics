import { Clube, Contrato, Transacao } from '@prisma/client';

import { formatarDataHoraBrasilia } from '../../common/parsers/date.parser';
import { apresentarTransacao } from './transacao.presenter';

export function apresentarCompra(transacao: Transacao, contrato: Contrato, clube: Clube) {
  return {
    ...apresentarTransacao(transacao),
    contract: {
      purchase_value: contrato.valorCompra.toNumber(),
      loyalty_until: formatarDataHoraBrasilia(contrato.fidelidadeAte),
      status: contrato.situacao,
    },
    club_cash: clube.caixa.toNumber(),
  };
}
