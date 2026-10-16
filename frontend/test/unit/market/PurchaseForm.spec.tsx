import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { PurchaseForm } from '../../../src/features/market/PurchaseForm';
import { club, player } from '../../fixtures/league.fixture';

function renderForm() {
  const saved = vi.fn().mockResolvedValue(undefined);
  const cancel = vi.fn();
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PurchaseForm player={player} clubs={[club]} onClose={cancel} onSaved={saved} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { saved, cancel };
}

describe('Confirmação de compra reutilizável', () => {
  it('apresenta o jogador e os clubes recebidos, sem calcular taxa antecipada', () => {
    renderForm();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('37,62')).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Águias FC (AGU) · caixa 300,00' }),
    ).toBeInTheDocument();

    expect(screen.queryByText('1,88')).not.toBeInTheDocument();
  });

  it('mostra obrigatórios e não chama o retorno de sucesso com formulário vazio', async () => {
    const { saved } = renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    expect(screen.getByText('Selecione o clube comprador.')).toBeInTheDocument();
    expect(screen.getByText('Informe a data da fidelidade.')).toBeInTheDocument();
    expect(screen.getByText('Informe a hora da fidelidade.')).toBeInTheDocument();
    expect(saved).not.toHaveBeenCalled();
  });

  it('permite cancelar sem confirmar a compra', async () => {
    const { saved, cancel } = renderForm();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(saved).not.toHaveBeenCalled();
  });
});
