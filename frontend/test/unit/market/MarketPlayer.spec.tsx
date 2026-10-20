import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarketPlayer } from '../../../src/features/market/MarketPlayer';
import { player } from '../../fixtures/league.fixture';

describe('Resumo compartilhado do jogador no mercado', () => {
  it('apresenta nome, posição, idade e valor da API, sem calcular', () => {
    render(<MarketPlayer player={{ ...player, market_value: 98.76 }} />);
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('MEI · Meio-campo · 20 anos')).toBeInTheDocument();
    expect(screen.getByText('98,76')).toBeInTheDocument();
    expect(screen.getByText('JS')).toHaveAttribute('aria-hidden', 'true');
  });
});
