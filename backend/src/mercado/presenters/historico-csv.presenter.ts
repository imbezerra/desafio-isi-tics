import { decimal } from '../../common/calculations/money.calculator';
import { RespostaTransacao } from './transacao.presenter';

export const CABECALHO_HISTORICO_CSV =
  'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa';

function moedaCsv(valor: number): string {
  return decimal(valor).toFixed(2).replace('.', ',');
}

function textoCsv(valor: string): string {
  return /[;"\r\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

export function apresentarHistoricoCsv(transacoes: RespostaTransacao[]): string {
  const linhas = transacoes.map((transacao) =>
    [
      transacao.created_at,
      transacao.type,
      textoCsv(transacao.player_name),
      moedaCsv(transacao.value),
      moedaCsv(transacao.fee),
      moedaCsv(transacao.penalty),
      transacao.profit === null ? '' : moedaCsv(transacao.profit),
      moedaCsv(transacao.cash_change),
    ].join(';'),
  );
  return [CABECALHO_HISTORICO_CSV, ...linhas].join('\n') + '\n';
}
