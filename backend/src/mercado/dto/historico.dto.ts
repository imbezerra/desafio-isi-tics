export const TIPOS_TRANSACAO = ['COMPRA', 'VENDA'] as const;
export type TipoTransacao = (typeof TIPOS_TRANSACAO)[number];

export type ConsultaHistorico = {
  tipos?: TipoTransacao[];
  jogadorId?: number;
};
