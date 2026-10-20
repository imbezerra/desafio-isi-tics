import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SaleReceipt } from '../../../src/features/market/SaleReceipt';
import { sale } from '../../fixtures/sale.fixture';

describe('Comprovante da venda', () => {
  it('mostra prejuízo e contrato encerrado sem inventar multa ou comissão', () => {
    render(
      <SaleReceipt
        result={{
          ...sale,
          profit: -7.5,
          fee: 0,
          penalty: 0,
          remaining_days: 0,
          penalty_rate: 0,
          contract_status: 'ENCERRADO',
        }}
        clubName="Águias FC"
        onClose={vi.fn()}
        onHistory={vi.fn()}
      />,
    );

    expect(screen.getByText('-7,50')).toBeInTheDocument();
    expect(screen.getByText('Sem lucro: sem comissão')).toBeInTheDocument();
    expect(screen.getByText('Fidelidade cumprida: sem multa')).toBeInTheDocument();
    expect(screen.getByText('ENCERRADO')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver histórico' })).toBeEnabled();
  });

  it('preserva valores sentinela, sem calcular lucro, multa, comissão, crédito ou caixa', () => {
    render(
      <SaleReceipt
        result={{
          ...sale,
          purchase_value: 12.34,
          value: 98.76,
          remaining_days: 321,
          penalty_rate: 20,
          penalty: 7.89,
          profit: 11.23,
          fee: 4.56,
          cash_change: 67.89,
          club_cash: 123.45,
        }}
        clubName="Águias FC"
        onClose={vi.fn()}
        onHistory={vi.fn()}
      />,
    );

    for (const value of ['12,34', '98,76', '321', '7,89', '+11,23', '4,56', '+67,89', '123,45'])
      expect(screen.getByText(value)).toBeInTheDocument();
  });
});
