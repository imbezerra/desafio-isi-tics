import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HistorySummary } from '../../../../src/features/market/history/HistorySummary';
import { emptySummary, history } from '../../../fixtures/history.fixture';

describe('Totais filtrados do histórico', () => {
  it('exibe exatamente os sentinelas da API, sem somar transações', () => {
    render(<HistorySummary summary={history.summary} />);

    for (const value of ['93,21', '65,43', '9,87', '6,54', '-4,56'])
      expect(screen.getByText(value)).toBeInTheDocument();
  });

  it('preserva os cinco zeros', () => {
    render(<HistorySummary summary={emptySummary} />);
    expect(screen.getAllByText('0,00')).toHaveLength(5);
  });
});
