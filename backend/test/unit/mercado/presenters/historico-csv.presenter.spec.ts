import { apresentarHistoricoCsv } from '../../../../src/mercado/presenters/historico-csv.presenter';

const cabecalho = 'data_hora;tipo;jogador;valor;taxa_ou_comissao;multa;lucro;variacao_caixa\n';
const transacao = {
  id: 1,
  club_id: 1,
  player_id: 2,
  player_name: 'Zé "Foguete"; Lima',
  type: 'COMPRA',
  value: 37,
  fee: 1.85,
  penalty: 0,
  profit: null,
  cash_change: -38.85,
  created_at: '2026-11-02T10:15:00-03:00',
};

describe('CSV conforme RN18', () => {
  it('exporta nomes escapados, vírgula decimal, lucro nulo vazio e LF final', () => {
    expect(apresentarHistoricoCsv([transacao])).toBe(
      cabecalho +
        '2026-11-02T10:15:00-03:00;COMPRA;"Zé ""Foguete""; Lima";37,00;1,85;0,00;;-38,85\n',
    );
  });

  it('preserva ordem e lucro negativo, com duas casas', () => {
    const csv = apresentarHistoricoCsv([{ ...transacao, type: 'VENDA', profit: -7.5 }, transacao]);
    expect(csv.split('\n')[1]).toContain(';VENDA;');
    expect(csv.split('\n')[1]).toContain(';0,00;-7,50;-38,85');
    expect(csv.split('\n')[2]).toContain(';COMPRA;');
  });

  it('retorna apenas cabeçalho e LF quando não há transações', () => {
    expect(apresentarHistoricoCsv([])).toBe(cabecalho);
  });
});
