import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { PurchaseReceipt } from '../../../src/features/market/PurchaseReceipt';
import { purchase } from '../../fixtures/purchase.fixture';

describe('Resultado reutilizável da compra', () => {
  it('mostra os valores e a fidelidade recebidos e soma apenas valor e taxa', () => {
    render(
      <MemoryRouter>
        <PurchaseReceipt result={purchase} clubName="Águias FC" onClose={vi.fn()} />
      </MemoryRouter>,
    );

    for (const value of ['37,62', '1,88', '39,50', '260,50', '02/03/2027, 10:15', 'ATIVO'])
      expect(screen.getByText(value)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver clube' })).toHaveAttribute('href', '/clubs/7');
  });

  it('permite fechar a confirmação, com foco inicial na ação de fechar', async () => {
    const close = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PurchaseReceipt result={purchase} clubName="Águias FC" onClose={close} />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', { name: 'Fechar' });

    expect(button).toHaveFocus();
    await user.click(button);
    expect(close).toHaveBeenCalledTimes(1);
  });
});
