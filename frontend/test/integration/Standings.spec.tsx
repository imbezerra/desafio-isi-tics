import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { match, standings } from '../fixtures/match.fixture';
import { mockLeagueApi } from '../helpers/mock-league-api';
import { renderApp } from '../helpers/render-app';

describe('Classificação da liga', () => {
  it('mostra todos os campos, inclusive o clube sem jogos, e mantém a ordem da API', async () => {
    const api = mockLeagueApi();

    renderApp('/standings');
    const table = await screen.findByRole('table', { name: 'Classificação' });
    const rows = within(table).getAllByRole('row');

    expect(within(table).getAllByRole('columnheader')).toHaveLength(10);

    for (const label of [
      'Posição',
      'Clube',
      'Jogos',
      'Vitórias',
      'Empates',
      'Derrotas',
      'Gols marcados',
      'Gols sofridos',
      'Saldo de gols',
      'Pontos',
    ])
      expect(within(table).getByRole('columnheader', { name: label })).toBeInTheDocument();
    expect(rows[1]).toHaveTextContent('Delta FC');
    expect(rows[2]).toHaveTextContent('Gama SC');
    expect(rows[3]).toHaveTextContent('Águias FC');
    expect(within(rows[2]).getAllByText('0')).toHaveLength(8);
    expect(within(rows[1]).getByText('+1')).toBeInTheDocument();
    expect(within(rows[3]).getByText('-1')).toBeInTheDocument();
    expect(
      api.mock.mock.calls
        .filter(([url]) => String(url).includes('/standings'))
        .every(([url]) => String(url).endsWith('/standings')),
    ).toBe(true);
  });

  it('não calcula pontos, saldo nem posição, e não ordena novamente pelo nome', async () => {
    const rows = [
      { ...standings[0], position: 7, wins: 0, points: 99, goal_difference: -18 },
      { ...standings[2], position: 2, points: 80, goal_difference: 34 },
    ];

    mockLeagueApi({ readStandings: () => Response.json(rows) });
    renderApp('/standings');
    const table = await screen.findByRole('table', { name: 'Classificação' });
    const visibleRows = within(table).getAllByRole('row');

    expect(visibleRows[1]).toHaveTextContent('Delta FC');
    expect(within(visibleRows[1]).getByText('7')).toBeInTheDocument();
    expect(within(visibleRows[1]).getByText('99')).toBeInTheDocument();
    expect(within(visibleRows[1]).getByText('-18')).toBeInTheDocument();
    expect(within(visibleRows[2]).getByText('+34')).toBeInTheDocument();
    expect(within(visibleRows[2]).getByText('80')).toBeInTheDocument();
  });

  it('mostra a liga vazia sem inventar posição ou líder', async () => {
    mockLeagueApi({ readStandings: () => Response.json([]), initial: [] });
    renderApp('/standings');
    expect(await screen.findByText('Nenhum clube cadastrado na liga.')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Classificação' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nova partida' })).toHaveAttribute(
      'href',
      '/matches?new=1',
    );
  });

  it('mostra carregamento sem tabela antiga durante a consulta', async () => {
    mockLeagueApi({ readStandings: () => new Promise<Response>(() => {}) });
    renderApp('/standings');
    expect(await screen.findByText('Carregando classificação…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atualizar dados' })).toBeDisabled();
  });

  it('preserva a mensagem de erro e permite nova tentativa', async () => {
    let failed = true;

    mockLeagueApi({
      readStandings: () =>
        failed
          ? Response.json({ message: 'Falha ao consultar classificação.' }, { status: 500 })
          : Response.json(standings),
    });

    const user = userEvent.setup();

    renderApp('/standings');
    const main = within(screen.getByRole('main'));

    expect(await main.findByRole('alert')).toHaveTextContent('Falha ao consultar classificação.');
    failed = false;
    await user.click(main.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('table', { name: 'Classificação' })).toBeInTheDocument();
  });

  it('mostra as últimas partidas na ordem recebida e permite abrir seus duelos', async () => {
    mockLeagueApi();
    const user = userEvent.setup();

    renderApp('/standings');
    await screen.findByRole('table', { name: 'Classificação' });
    const card = screen.getByRole('heading', { name: 'Últimas partidas' }).closest('section')!;
    const link = within(card).getByRole('link', { name: /12\/11\/2026, 15:00/ });

    expect(link).toHaveAttribute('href', `/matches/${match.id}`);
    await user.click(link);
    expect(await screen.findByRole('table', { name: 'Duelos da partida' })).toBeInTheDocument();
  });

  it('atualiza classificação após jogar, sem recarregar a página, e oferece links para os clubes', async () => {
    let created = false;

    mockLeagueApi({
      initial: [],
      readStandings: () => Response.json(created ? standings : []),
      write: () => {
        created = true;

        return Response.json(match, { status: 201 });
      },
    });

    const user = userEvent.setup();

    renderApp('/standings');
    await screen.findByText('Nenhum clube cadastrado na liga.');
    await user.click(screen.getByRole('link', { name: 'Nova partida' }));
    await screen.findByLabelText('Mandante');
    await user.selectOptions(screen.getByLabelText('Mandante'), '7');
    await user.selectOptions(screen.getByLabelText('Visitante'), '8');
    await user.click(screen.getByRole('button', { name: 'Jogar partida' }));
    await screen.findByText('Partida realizada com sucesso.');
    await user.click(screen.getByRole('link', { name: 'Classificação' }));
    const table = await screen.findByRole('table', { name: 'Classificação' });

    expect(within(table).getByRole('link', { name: 'Delta FC' })).toHaveAttribute(
      'href',
      '/clubs/8',
    );

    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Delta FC');
  });
});
