import { arredondarMoeda, decimal } from '../../common/calculations/money.calculator';

type TransacaoParaResumo = {
  type: string;
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
};

export function calcularResumoHistorico(transacoes: TransacaoParaResumo[]) {
  let gasto = decimal(0);
  let recebido = decimal(0);
  let taxas = decimal(0);
  let multas = decimal(0);
  let lucro = decimal(0);
  for (const transacao of transacoes) {
    taxas = taxas.plus(transacao.fee);
    if (transacao.type === 'COMPRA') {
      gasto = gasto.plus(transacao.value).plus(transacao.fee);
    } else if (transacao.type === 'VENDA') {
      recebido = recebido.plus(transacao.cash_change);
      multas = multas.plus(transacao.penalty);
      lucro = lucro.plus(transacao.profit ?? 0);
    }
  }
  return {
    total_spent: arredondarMoeda(gasto).toNumber(),
    total_received: arredondarMoeda(recebido).toNumber(),
    total_fees: arredondarMoeda(taxas).toNumber(),
    total_penalties: arredondarMoeda(multas).toNumber(),
    total_profit: arredondarMoeda(lucro).toNumber(),
  };
}
