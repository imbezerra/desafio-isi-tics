import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TransactionSummary } from '../../../src/features/market/TransactionSummary';

describe('Resumo reutilizável de valores do mercado', () => {
  it('preserva a ordem e os zeros e diferencia destaques sem alterar valores', () => {
    render(
      <TransactionSummary
        label="Valores da API"
        rows={[
          { label: 'Dias restantes', value: 0 },
          {
            label: 'Crédito',
            value: '+35,70',
            hint: 'Valor do servidor',
            emphasis: true,
            tone: 'positive',
          },
        ]}
      />,
    );

    const summary = screen.getByLabelText('Valores da API');

    expect(summary.querySelectorAll('dt')[0]).toHaveTextContent('Dias restantes');
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('+35,70')).toHaveAttribute('data-tone', 'positive');
    expect(screen.getByText('Valor do servidor')).toBeInTheDocument();
  });
});
