import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { club, clubDetails, player } from '../fixtures/league.fixture';
import { mockClubApi } from '../helpers/mock-club-api';
import { renderApp } from '../helpers/render-app';

describe('Página do clube e contratos', () => {
  it('abre pela lista e oferece retorno pelo breadcrumb', async () => {
    mockClubApi({ detail: () => Response.json(clubDetails) });
    const user = userEvent.setup();

    renderApp('/clubs');
    await user.click(await screen.findByRole('link', { name: 'Ver clube Águias FC' }));
    expect(await screen.findByRole('heading', { name: 'Águias FC' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir Águias FC' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    await user.click(screen.getByRole('link', { name: /^Clubes$/ }));
    expect(await screen.findByRole('heading', { name: 'Clubes' })).toBeInTheDocument();
  });

  it('abre pelo menu lateral usando o id, e não a posição na lista', async () => {
    const api = mockClubApi({ detail: () => Response.json(clubDetails) });
    const user = userEvent.setup();

    renderApp('/players');
    await user.click(await screen.findByRole('link', { name: 'Abrir Águias FC' }));
    await screen.findByRole('table', { name: 'Elenco' });
    expect(api.mock.mock.calls.some(([url]) => String(url).endsWith('/clubs/7'))).toBe(true);
  });

  it('mostra o resumo financeiro e contrato exatamente como vieram da API', async () => {
    mockClubApi({ detail: () => Response.json(clubDetails) });
    renderApp('/clubs/7');
    const values = await screen.findByLabelText('Valores de Águias FC devolvidos pela API');

    for (const value of ['51,58', '222,68', '274,26', '1 de 12'])
      expect(within(values).getByText(value)).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Elenco' });

    for (const label of [
      'Jogador',
      'Posição',
      'Overall',
      'Condição',
      'Valor de mercado',
      'Valor de compra',
      'Fim da fidelidade',
      'Dias restantes',
      '% de multa',
    ])
      expect(within(table).getByRole('columnheader', { name: label })).toBeInTheDocument();

    for (const value of ['37,62', '28,80', '02/03/2027', '10:15', '120', '10%'])
      expect(within(table).getByText(value)).toBeInTheDocument();
    expect(table.querySelector('time')).toHaveAttribute('datetime', '2027-03-02T10:15:00-03:00');
  });

  it('preserva a ordem do elenco recebida, sem ordenar ou paginar no cliente', async () => {
    const members = [
      { ...clubDetails.players[0], id: 8, name: 'Zeta Silva', position: 'ATA' as const },
      { ...clubDetails.players[0], id: 2, name: 'Ana Costa', position: 'GOL' as const },
      ...Array.from({ length: 10 }, (_, index) => ({
        ...clubDetails.players[0],
        id: index + 20,
        name: `Jogador de teste ${index}`,
      })),
    ];

    mockClubApi({ detail: () => Response.json({ ...clubDetails, players: members }) });
    renderApp('/clubs/7');
    const table = await screen.findByRole('table', { name: 'Elenco' });
    const rows = within(table).getAllByRole('row');

    expect(rows).toHaveLength(13);
    expect(rows[1]).toHaveTextContent('Zeta Silva');
    expect(rows[2]).toHaveTextContent('Ana Costa');
    expect(
      screen.queryByRole('navigation', { name: 'Paginação de jogadores' }),
    ).not.toBeInTheDocument();
  });

  it('não recalcula patrimônio, dias restantes ou multa usando o relógio do navegador', async () => {
    mockClubApi({
      detail: () =>
        Response.json({
          ...clubDetails,
          cash: 1.23,
          squad_value: 4.56,
          net_worth: 98.76,
          players: [
            {
              ...clubDetails.players[0],
              contract: {
                purchase_value: 11.23,
                loyalty_until: '2020-01-01T00:00:00-03:00',
                remaining_days: 144,
                penalty_rate: 20,
              },
            },
          ],
        }),
    });

    renderApp('/clubs/7');
    expect(await screen.findByText('98,76')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Elenco' });

    expect(within(table).getByText('144')).toBeInTheDocument();
    expect(within(table).getByText('20%')).toBeInTheDocument();
  });

  it('mostra fidelidade cumprida com zero dias e zero por cento, sem tratar zero como ausente', async () => {
    mockClubApi({
      detail: () =>
        Response.json({
          ...clubDetails,
          players: [
            {
              ...clubDetails.players[0],
              contract: {
                ...clubDetails.players[0].contract,
                remaining_days: 0,
                penalty_rate: 0,
              },
            },
          ],
        }),
    });

    renderApp('/clubs/7');
    const table = await screen.findByRole('table', { name: 'Elenco' });

    expect(within(table).getByText('0')).toBeInTheDocument();
    expect(within(table).getByText('0%')).toBeInTheDocument();
  });

  it('não inventa um contrato quando o servidor devolve null', async () => {
    mockClubApi({
      detail: () =>
        Response.json({
          ...clubDetails,
          players: [{ ...player, club_id: club.id, contract: null }],
        }),
    });

    renderApp('/clubs/7');
    const table = await screen.findByRole('table', { name: 'Elenco' });

    expect(within(table).getByText('Contrato indisponível')).toBeInTheDocument();
    expect(within(table).getAllByText('—')).toHaveLength(3);
    expect(within(table).queryByText('0%')).not.toBeInTheDocument();
  });

  it('mostra elenco vazio sem inventar jogadores ou contratos', async () => {
    mockClubApi();
    renderApp('/clubs/7');
    expect(await screen.findByText('Este clube ainda não tem jogadores.')).toBeInTheDocument();
    expect(screen.getByText('0 de 12 jogadores')).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Elenco' })).not.toBeInTheDocument();
  });

  it('mostra carregamento durante a consulta', () => {
    mockClubApi({ detail: () => new Promise<Response>(() => {}) });
    renderApp('/clubs/7');
    expect(screen.getByText('Carregando clube e elenco…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Atualizar dados' })).toBeDisabled();
  });

  it.each(['999', '007', 'invalido'])(
    'envia o id %s à API e apresenta a recusa 404',
    async (id) => {
      const api = mockClubApi({
        detail: () => Response.json({ message: 'Clube não encontrado.' }, { status: 404 }),
      });

      renderApp(`/clubs/${id}`);
      expect(await screen.findByRole('alert')).toHaveTextContent('Clube não encontrado.');
      expect(api.mock.mock.calls.some(([url]) => String(url).endsWith(`/clubs/${id}`))).toBe(true);
      expect(screen.getByRole('link', { name: 'Voltar para clubes' })).toHaveAttribute(
        'href',
        '/clubs',
      );
    },
  );

  it('permite tentar novamente após erro de rede sem repetição automática', async () => {
    let failed = true;
    const api = mockClubApi({
      detail: () => {
        if (failed) throw new TypeError('Failed to fetch');

        return Response.json(clubDetails);
      },
    });
    const user = userEvent.setup();

    renderApp('/clubs/7');
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API.');
    expect(api.mock.mock.calls.filter(([url]) => String(url).endsWith('/clubs/7'))).toHaveLength(1);
    failed = false;
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('table', { name: 'Elenco' })).toBeInTheDocument();
  });

  it('atualiza o resumo e o contrato com uma nova resposta da API', async () => {
    let updated = false;

    mockClubApi({
      detail: () =>
        Response.json(
          updated
            ? {
                ...clubDetails,
                cash: 19.87,
                players: [],
              }
            : clubDetails,
        ),
    });

    const user = userEvent.setup();

    renderApp('/clubs/7');
    await screen.findByRole('table', { name: 'Elenco' });
    updated = true;
    await user.click(screen.getByRole('button', { name: 'Atualizar dados' }));
    expect(await screen.findByText('19,87')).toBeInTheDocument();
    expect(await screen.findByText('Este clube ainda não tem jogadores.')).toBeInTheDocument();
  });

  it('consulta o outro clube ao navegar pelo menu sem manter o elenco anterior', async () => {
    const other = { ...club, id: 8, name: 'Delta FC', acronym: 'DFC' };

    mockClubApi({
      initial: [club, other],
      detail: (id) => Response.json(id === '7' ? clubDetails : { ...other, players: [] }),
    });

    const user = userEvent.setup();

    renderApp('/clubs/7');
    await screen.findByRole('table', { name: 'Elenco' });
    await user.click(screen.getByRole('link', { name: 'Abrir Delta FC' }));
    expect(await screen.findByRole('heading', { name: 'Delta FC' })).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Elenco' })).not.toBeInTheDocument();
  });

  it('mantém abas futuras desabilitadas e navega por teclado na aba implementada', async () => {
    const api = mockClubApi();
    const user = userEvent.setup();

    renderApp('/clubs/7');
    const tab = await screen.findByRole('tab', { name: 'Elenco 0' });

    expect(tab).toHaveAttribute('aria-controls', 'club-squad');
    expect(screen.getByRole('tabpanel', { name: 'Elenco 0' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Escalação Em breve' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Histórico Em breve' })).toBeDisabled();
    tab.focus();
    await user.keyboard('{ArrowRight}{End}{ArrowLeft}{Home}');
    await waitFor(() => expect(tab).toHaveFocus());
    expect(api.writes()).toHaveLength(0);
    expect(api.mock.mock.calls.some(([url]) => /lineup|transactions/.test(String(url)))).toBe(
      false,
    );
  });
});
