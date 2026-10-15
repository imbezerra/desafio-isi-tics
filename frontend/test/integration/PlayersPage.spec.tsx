import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { player, playerList } from '../fixtures/league.fixture';
import { mockApi } from '../helpers/mock-api';
import { renderApp } from '../helpers/render-app';

describe('Listagem integrada à camada HTTP', () => {
  it('mostra colunas obrigatórias e valores exatos da API', async () => {
    mockApi();
    renderApp('/players');
    expect(await screen.findByText('João Silva')).toBeInTheDocument();
    for (const label of [
      'Jogador',
      'Posição',
      'Overall',
      'Agilidade',
      'Idade',
      'Condição',
      'Valor base',
      'Valor de mercado',
      'Clube',
    ])
      expect(screen.getByRole('columnheader', { name: label })).toBeInTheDocument();
    expect(screen.getByText('34,20')).toBeInTheDocument();
    expect(screen.getByText('37,62')).toBeInTheDocument();
    expect(screen.getByText('Livre')).toBeInTheDocument();
  });
  it('consulta a segunda página e volta à primeira ao aplicar filtros', async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi((url) =>
      Response.json(
        playerList(
          [
            {
              ...player,
              name: url.searchParams.get('page') === '2' ? 'Pedro Silva' : 'João Silva',
            },
          ],
          Number(url.searchParams.get('page') ?? 1),
          11,
        ),
      ),
    );
    renderApp('/players');
    await screen.findByText('João Silva');
    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    await screen.findByText('Pedro Silva');
    await user.type(screen.getByLabelText('Buscar por nome'), 'João');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([input]) => {
          const url = new URL(String(input));
          return (
            url.searchParams.get('search') === 'João' &&
            url.searchParams.get('page') === '1' &&
            url.searchParams.get('limit') === '10'
          );
        }),
      ).toBe(true),
    );
  });
  it('exibe o clube identificado pela API', async () => {
    mockApi(() => Response.json(playerList([{ ...player, club_id: 7 }])));
    renderApp('/players');
    expect(await screen.findByText('AGU · Águias FC')).toBeInTheDocument();
  });
  it('mostra lista vazia e bloqueia a próxima página', async () => {
    mockApi(() => Response.json(playerList([])));
    renderApp('/players');
    expect(await screen.findByText(/Nenhum jogador encontrado/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
    expect(screen.getByText('Mostrando 0–0 de 0 jogadores')).toBeInTheDocument();
  });
  it('mostra carregamento enquanto o pedido está pendente', async () => {
    mockApi();
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(() => new Promise<Response>(() => {}));
    renderApp('/players');
    expect(screen.getByText('Carregando jogadores…')).toBeInTheDocument();
  });
  it('preserva a mensagem de recusa sem substituí-la por erro genérico', async () => {
    mockApi(() =>
      Response.json({ message: 'Combinação contraditória de filtros.' }, { status: 400 }),
    );
    renderApp('/players');
    expect(
      (await screen.findAllByRole('alert')).some((element) =>
        element.textContent?.includes('Combinação contraditória de filtros.'),
      ),
    ).toBe(true);
  });
});
