import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { club } from '../fixtures/league.fixture';
import { mockClubApi } from '../helpers/mock-club-api';
import { renderApp } from '../helpers/render-app';

describe('Lista e navegação de clubes', () => {
  it('navega pelo menu e indica somente a rota atual', async () => {
    mockClubApi();
    const user = userEvent.setup();

    renderApp('/players');
    const players = screen.getByRole('link', { name: /^Jogadores/ });

    expect(players).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('link', { name: /^Clubes/ }));
    expect(await screen.findByRole('heading', { name: 'Clubes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Clubes/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /^Jogadores/ })).not.toHaveAttribute('aria-current');
  });

  it('mostra as cinco colunas, valores e ordem exata da API', async () => {
    mockClubApi({
      initial: [
        {
          ...club,
          id: 8,
          name: 'Zeta FC',
          acronym: 'ZFC',
          cash: 12.34,
          squad_value: 7.89,
          net_worth: 98.76,
        },
        club,
      ],
    });

    renderApp('/clubs');
    const table = await screen.findByRole('table', { name: 'Clubes' });

    for (const label of ['Clube', 'Sigla', 'Caixa', 'Valor do elenco', 'Patrimônio'])
      expect(within(table).getByRole('columnheader', { name: label })).toBeInTheDocument();
    expect(within(table).getByText('12,34')).toBeInTheDocument();
    expect(within(table).getByText('7,89')).toBeInTheDocument();
    expect(within(table).getByText('98,76')).toBeInTheDocument();
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Zeta FC');
  });

  it('envia as três ordenações sem ordenar no cliente', async () => {
    const other = { ...club, id: 8, name: 'Zeta FC', acronym: 'ZFC', net_worth: 800 };
    const api = mockClubApi({
      read: (sort) => Response.json(sort === 'net_worth_desc' ? [other, club] : [club, other]),
    });
    const user = userEvent.setup();

    renderApp('/clubs');
    await screen.findByRole('table');
    expect(screen.getByLabelText('Ordenar por')).toHaveValue('name');
    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'net_worth_desc');
    await waitFor(() =>
      expect(within(screen.getByRole('table')).getAllByRole('row')[1]).toHaveTextContent('Zeta FC'),
    );

    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'net_worth_asc');
    await waitFor(() =>
      expect(within(screen.getByRole('table')).getAllByRole('row')[1]).toHaveTextContent(
        'Águias FC',
      ),
    );

    expect(api.mock.mock.calls.some(([url]) => String(url).endsWith('sort=net_worth_asc'))).toBe(
      true,
    );
  });

  it('mostra a lista vazia', async () => {
    mockClubApi({ initial: [] });
    renderApp('/clubs');
    expect(await screen.findByText('Nenhum clube encontrado.')).toBeInTheDocument();

    expect(screen.getByText('0 de 20')).toBeInTheDocument();
  });

  it('mostra carregamento com rede lenta', () => {
    mockClubApi({ read: () => new Promise<Response>(() => {}) });
    renderApp('/clubs');
    expect(
      screen.getByText('Carregando clubes…', { selector: '.message span' }),
    ).toBeInTheDocument();
  });

  it('preserva o erro da lista e permite tentar novamente', async () => {
    let failed = true;

    mockClubApi({
      read: () =>
        failed
          ? Response.json({ message: 'Falha ao consultar clubes.' }, { status: 500 })
          : Response.json([club]),
    });

    const user = userEvent.setup();

    renderApp('/clubs');
    const list = screen.getByRole('region', { name: 'Lista de clubes' });

    expect(await within(list).findByRole('alert')).toHaveTextContent('Falha ao consultar clubes.');
    failed = false;
    await user.click(within(list).getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});
