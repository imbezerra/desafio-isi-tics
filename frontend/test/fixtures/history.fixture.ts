import type { HistoryResult } from '../../src/features/market/history/history.api';

export const emptySummary = {
  total_spent: 0,
  total_received: 0,
  total_fees: 0,
  total_penalties: 0,
  total_profit: 0,
};

export const history: HistoryResult = {
  data: [
    {
      id: 11,
      club_id: 7,
      player_id: 2,
      player_name: 'Meia Lua',
      type: 'VENDA',
      value: 40,
      fee: 0.3,
      penalty: 4,
      profit: 3,
      cash_change: 35.7,
      created_at: '2026-11-05T16:40:00-03:00',
    },
    {
      id: 10,
      club_id: 7,
      player_id: 3,
      player_name: 'Renan Castro',
      type: 'COMPRA',
      value: 38,
      fee: 1.9,
      penalty: 0,
      profit: null,
      cash_change: -39.9,
      created_at: '2026-11-04T00:00:00-03:00',
    },
    {
      id: 9,
      club_id: 7,
      player_id: 4,
      player_name: 'Lucas Ferraz',
      type: 'VENDA',
      value: 42.5,
      fee: 0,
      penalty: 8.5,
      profit: -7.5,
      cash_change: 34,
      created_at: '2026-11-03T23:30:00Z',
    },
    {
      id: 8,
      club_id: 7,
      player_id: 2,
      player_name: 'Meia Lua Antigo',
      type: 'COMPRA',
      value: 37,
      fee: 1.85,
      penalty: 0,
      profit: null,
      cash_change: -38.85,
      created_at: '2026-11-02T10:15:00-03:00',
    },
  ],
  summary: {
    total_spent: 93.21,
    total_received: 65.43,
    total_fees: 9.87,
    total_penalties: 6.54,
    total_profit: -4.56,
  },
};

export const historyCsv =
  'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n2026-11-05T16:40:00-03:00;VENDA;Meia Lua;40,00;0,30;4,00;3,00;35,70\n';
