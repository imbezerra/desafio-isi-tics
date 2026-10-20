import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ClubSquad } from '../../../src/features/clubs/ClubSquad';
import { clubDetails } from '../../fixtures/league.fixture';

describe('Tabela reutilizável de elenco e contratos', () => {
  it('oferece a venda por jogador quando a página fornece a ação', async () => {
    const onSell = vi.fn();
    const user = userEvent.setup();

    render(<ClubSquad players={clubDetails.players} onRefresh={vi.fn()} onSell={onSell} />);
    await user.click(screen.getByRole('button', { name: 'Vender João Silva' }));
    expect(onSell).toHaveBeenCalledExactlyOnceWith(clubDetails.players[0]);
  });

  it('apresenta valores, fidelidade e percentual recebidos da API', () => {
    render(<ClubSquad players={clubDetails.players} onRefresh={vi.fn()} />);
    const table = screen.getByRole('table', { name: 'Elenco' });

    for (const value of ['37,62', '28,80', '02/03/2027', '10:15', '120', '10%'])
      expect(within(table).getByText(value)).toBeInTheDocument();
  });

  it('não muda a ordem do array recebido', () => {
    const players = [
      { ...clubDetails.players[0], id: 8, name: 'Zeta Silva', position: 'ATA' as const },
      { ...clubDetails.players[0], id: 2, name: 'Ana Costa', position: 'GOL' as const },
    ];

    render(<ClubSquad players={players} onRefresh={vi.fn()} />);
    const rows = within(screen.getByRole('table')).getAllByRole('row');

    expect(rows[1]).toHaveTextContent('Zeta Silva');
    expect(rows[2]).toHaveTextContent('Ana Costa');
  });

  it('identifica o elenco vazio sem criar linhas fictícias', () => {
    render(<ClubSquad players={[]} onRefresh={vi.fn()} />);
    expect(screen.getByText('Este clube ainda não tem jogadores.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
