import { calcularResumoHistorico } from '../../../../src/mercado/domain/historico-resumo';

const compra = {
  type: 'COMPRA',
  value: 37,
  fee: 1.85,
  penalty: 0,
  profit: null,
  cash_change: -38.85,
};
const venda = { type: 'VENDA', value: 40, fee: 0.3, penalty: 4, profit: 3, cash_change: 35.7 };

describe('totais do histórico conforme RN17', () => {
  it('soma compra e venda conforme o exemplo do enunciado', () => {
    expect(calcularResumoHistorico([compra, venda])).toEqual({
      total_spent: 38.85,
      total_received: 35.7,
      total_fees: 2.15,
      total_penalties: 4,
      total_profit: 3,
    });
  });

  it('calcula somente os registros fornecidos e mantém o sinal do prejuízo', () => {
    expect(
      calcularResumoHistorico([{ ...venda, profit: -7.5, fee: 0, penalty: 8.5, cash_change: 34 }]),
    ).toEqual({
      total_spent: 0,
      total_received: 34,
      total_fees: 0,
      total_penalties: 8.5,
      total_profit: -7.5,
    });
  });

  it('retorna zeros sem transações e soma centavos com precisão decimal', () => {
    expect(calcularResumoHistorico([])).toEqual({
      total_spent: 0,
      total_received: 0,
      total_fees: 0,
      total_penalties: 0,
      total_profit: 0,
    });
    expect(
      calcularResumoHistorico([
        { ...compra, value: 0.1, fee: 0 },
        { ...compra, value: 0.2, fee: 0 },
      ]).total_spent,
    ).toBe(0.3);
  });
});
