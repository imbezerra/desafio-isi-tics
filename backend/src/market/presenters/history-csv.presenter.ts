import { decimal } from '../../common/calculations/money.calculator';
import { TransactionResponse } from './transaction.presenter';

export const HISTORY_CSV_HEADER =
  'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa';

function csvMoney(value: number): string {
  return decimal(value).toFixed(2).replace('.', ',');
}

function csvText(value: string): string {
  return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function presentHistoryCsv(transactions: TransactionResponse[]): string {
  const rows = transactions.map((transaction) =>
    [
      transaction.created_at,
      transaction.type,
      csvText(transaction.player_name),
      csvMoney(transaction.value),
      csvMoney(transaction.fee),
      csvMoney(transaction.penalty),
      transaction.profit === null ? '' : csvMoney(transaction.profit),
      csvMoney(transaction.cash_change),
    ].join(';'),
  );
  return [HISTORY_CSV_HEADER, ...rows].join('\n') + '\n';
}
