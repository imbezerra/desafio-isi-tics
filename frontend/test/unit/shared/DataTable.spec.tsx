import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from '../../../src/shared/components/DataTable';

const columns = [
  { key: 'name', label: 'Nome', render: (row: { id: number; name: string }) => row.name },
];
const defaults = {
  label: 'Jogadores',
  columns,
  rows: [],
  getRowKey: (row: { id: number; name: string }) => row.id,
  loading: false,
  onRetry: vi.fn(),
  emptyMessage: 'Nenhum jogador encontrado.',
};
describe('Tabela reutilizável', () => {
  it('mostra carregamento', () => {
    render(<DataTable {...defaults} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando jogadores');
  });
  it('mostra lista vazia', () => {
    render(<DataTable {...defaults} />);
    expect(screen.getByRole('status')).toHaveTextContent('Nenhum jogador encontrado.');
  });
  it('mostra mensagem da API e permite tentar novamente', async () => {
    const onRetry = vi.fn();
    render(<DataTable {...defaults} error="Clube não encontrado." onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Clube não encontrado.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
  it('renderiza tabela sem alterar a ordem recebida', () => {
    render(
      <DataTable
        {...defaults}
        rows={[
          { id: 2, name: 'Zeca' },
          { id: 1, name: 'Ana' },
        ]}
      />,
    );
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Zeca');
    expect(rows[2]).toHaveTextContent('Ana');
  });
});
