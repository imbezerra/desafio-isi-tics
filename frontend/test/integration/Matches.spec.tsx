import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { match } from '../fixtures/match.fixture';
import { mockLeagueApi } from '../helpers/mock-league-api';
import { renderApp } from '../helpers/render-app';

async function chooseClubs() {
  const user = userEvent.setup();

  await screen.findByRole('dialog', { name: 'Nova partida' });
  await user.selectOptions(await screen.findByLabelText('Mandante'), '7');
  await user.selectOptions(screen.getByLabelText('Visitante'), '8');

  return user;
}

describe('Partidas e histórico', () => {
  it('mostra a ordem da API e as datas em Brasília, e abre os seis duelos', async () => {
    const previous = { ...match, id: 41, played_at: '2026-11-12T02:20:00Z' };

    mockLeagueApi({ initial: [match, previous] });
    const user = userEvent.setup();

    renderApp('/matches');
    const table = await screen.findByRole('table', { name: 'Histórico de partidas' });
    const rows = within(table).getAllByRole('row');

    expect(
      within(rows[1]).getByRole('link', { name: 'Ver duelos da partida #42' }),
    ).toBeInTheDocument();

    expect(
      within(rows[2]).getByRole('link', { name: 'Ver duelos da partida #41' }),
    ).toBeInTheDocument();

    expect(rows[1]).toHaveTextContent('12/11/2026 15:00');
    expect(rows[2]).toHaveTextContent('11/11/2026 23:20');
    await user.click(within(rows[1]).getByRole('link', { name: 'Ver duelos da partida #42' }));
    const duels = await screen.findByRole('table', { name: 'Duelos da partida' });

    expect(within(duels).getAllByRole('row')).toHaveLength(7);
    expect(within(duels).getByText('Otto Rangel Histórico')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar às partidas' })).toHaveAttribute(
      'href',
      '/matches',
    );
  });

  it('envia o filtro ao servidor, mantém ele ao voltar do detalhe e permite limpar', async () => {
    const api = mockLeagueApi();
    const user = userEvent.setup();

    renderApp('/matches');
    await screen.findByRole('table', { name: 'Histórico de partidas' });
    await user.selectOptions(screen.getByLabelText('Filtrar por clube'), '7');
    await waitFor(() =>
      expect(api.mock.mock.calls.some(([url]) => String(url).endsWith('/matches?club_id=7'))).toBe(
        true,
      ),
    );

    await user.click(await screen.findByRole('link', { name: 'Ver duelos da partida #42' }));
    await screen.findByRole('table', { name: 'Duelos da partida' });
    await user.click(screen.getByRole('link', { name: 'Voltar às partidas' }));
    expect(await screen.findByLabelText('Filtrar por clube')).toHaveValue('7');
    await user.selectOptions(screen.getByLabelText('Filtrar por clube'), '');
    expect(screen.getByLabelText('Filtrar por clube')).toHaveValue('');
    expect(
      api.mock.mock.calls.every(
        ([url]) => !String(url).includes('club_id=') || !String(url).endsWith('club_id='),
      ),
    ).toBe(true);
  });

  it('envia um filtro de clube inexistente e mostra a recusa sem apagá-lo', async () => {
    const api = mockLeagueApi({
      readList: (clubId) =>
        clubId
          ? Response.json({ message: 'Clube não encontrado.' }, { status: 404 })
          : Response.json([]),
    });

    renderApp('/matches?club_id=999');
    expect(await within(screen.getByRole('main')).findByRole('alert')).toHaveTextContent(
      'Clube não encontrado.',
    );

    expect(screen.getByLabelText('Filtrar por clube')).toHaveValue('999');
    expect(api.mock.mock.calls.some(([url]) => String(url).endsWith('/matches?club_id=999'))).toBe(
      true,
    );

    expect(screen.queryByRole('region', { name: 'Placar da partida' })).not.toBeInTheDocument();
  });

  it('apresenta vazio e carregamento sem partidas ou resultados inventados', async () => {
    let finish!: (response: Response) => void;

    mockLeagueApi({
      readList: (clubId) =>
        clubId === '9'
          ? new Promise<Response>((resolve) => {
              finish = resolve;
            })
          : Response.json([]),
    });

    renderApp('/matches?club_id=9');
    expect(await screen.findByText('Carregando histórico de partidas…')).toBeInTheDocument();
    finish(Response.json([]));
    expect(
      await screen.findByText('Nenhuma partida encontrada com este filtro.'),
    ).toBeInTheDocument();

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('permite recuperar uma consulta com erro sem repetição automática', async () => {
    let failed = true;
    const api = mockLeagueApi({
      readList: (clubId) => {
        if (clubId && failed) throw new TypeError('Failed to fetch');

        return Response.json([match]);
      },
    });
    const user = userEvent.setup();

    renderApp('/matches?club_id=7');
    const main = within(screen.getByRole('main'));

    expect(await main.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API.');
    expect(
      api.mock.mock.calls.filter(([url]) => String(url).endsWith('/matches?club_id=7')),
    ).toHaveLength(1);

    failed = false;
    await user.click(main.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByRole('table', { name: 'Histórico de partidas' });
  });

  it('valida mandante e visitante antes do POST e mantém as opções utilizáveis', async () => {
    const api = mockLeagueApi();

    renderApp('/matches?new=1');
    await screen.findByLabelText('Mandante');
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Jogar partida' }));
    expect(screen.getByText('Selecione o mandante.')).toBeInTheDocument();
    expect(screen.getByText('Selecione o visitante.')).toBeInTheDocument();
    expect(screen.getByLabelText('Mandante')).toHaveFocus();
    expect(api.writes()).toHaveLength(0);
  });

  it('não bloqueia clubes iguais e mostra o message 400 devolvido pelo servidor', async () => {
    const api = mockLeagueApi({
      write: () =>
        Response.json({ message: 'Mandante e visitante devem ser diferentes.' }, { status: 400 }),
    });

    renderApp('/matches?new=1');
    const user = await chooseClubs();

    await user.selectOptions(screen.getByLabelText('Visitante'), '7');
    await user.click(screen.getByRole('button', { name: 'Jogar partida' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Mandante e visitante devem ser diferentes.',
    );

    expect(JSON.parse(String(api.writes()[0][1]?.body))).toEqual({
      home_club_id: 7,
      away_club_id: 7,
    });

    expect(screen.getByLabelText('Visitante')).toHaveValue('7');
  });

  it.each([404, 409])(
    'preserva o message %s, os clubes escolhidos e a opção de abrir suas escalações',
    async (status) => {
      const api = mockLeagueApi({
        write: () =>
          Response.json({ message: 'O visitante não possui escalação completa.' }, { status }),
      });

      renderApp('/matches?new=1');
      const user = await chooseClubs();

      await user.click(screen.getByRole('button', { name: 'Jogar partida' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'O visitante não possui escalação completa.',
      );

      expect(api.writes()).toHaveLength(1);
      expect(screen.getByLabelText('Mandante')).toHaveValue('7');
      expect(screen.getByLabelText('Visitante')).toHaveValue('8');
      expect(screen.getByRole('button', { name: 'Escalação do visitante' })).toBeEnabled();
    },
  );

  it('mostra o resultado do POST e mantém a confirmação mesmo se a atualização da lista falhar', async () => {
    let created = false;
    const api = mockLeagueApi({
      initial: [],
      write: () => {
        created = true;

        return Response.json(match, { status: 201 });
      },
      readList: () =>
        created
          ? Response.json({ message: 'Falha ao atualizar histórico.' }, { status: 500 })
          : Response.json([]),
      readDetail: () =>
        Response.json({ message: 'Não deveria substituir o POST.' }, { status: 500 }),
    });

    renderApp('/matches?new=1');
    const user = await chooseClubs();

    await user.click(screen.getByRole('button', { name: 'Jogar partida' }));
    expect(await screen.findByText('Partida realizada com sucesso.')).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: 'Duelos da partida' });

    expect(within(table).getAllByRole('row')).toHaveLength(7);
    expect(screen.getByText('1 × 2')).toBeInTheDocument();
    expect(api.mock.mock.calls.some(([url]) => String(url).includes('/matches/42'))).toBe(false);
    expect(JSON.parse(String(api.writes()[0][1]?.body))).toEqual({
      home_club_id: 7,
      away_club_id: 8,
    });
  });

  it('bloqueia clique duplo, edição, fechamento e Escape durante o POST', async () => {
    let finish!: (response: Response) => void;
    const api = mockLeagueApi({
      initial: [],
      write: () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    });

    renderApp('/matches?new=1');
    await chooseClubs();
    const form = screen.getByRole('form', { name: 'Nova partida' });

    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(api.writes()).toHaveLength(1));
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
    expect(screen.getByLabelText('Mandante')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fechar janela' })).toBeDisabled();
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    finish(Response.json(match, { status: 201 }));
    await screen.findByText('Partida realizada com sucesso.');
    expect(api.writes()).toHaveLength(1);
  });

  it('cancela sem enviar e restaura o foco no botão Nova partida', async () => {
    const api = mockLeagueApi();
    const user = userEvent.setup();

    renderApp('/matches');
    await screen.findByRole('table', { name: 'Histórico de partidas' });
    const button = screen.getByRole('button', { name: 'Nova partida' });

    await user.click(button);
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
    expect(api.writes()).toHaveLength(0);
  });

  it('não repete falha de rede automaticamente e aceita nova tentativa manual', async () => {
    let failed = true;
    const api = mockLeagueApi({
      initial: [],
      write: () => {
        if (failed) throw new TypeError('Failed to fetch');

        return Response.json(match, { status: 201 });
      },
    });

    renderApp('/matches?new=1');
    const user = await chooseClubs();

    await user.click(screen.getByRole('button', { name: 'Jogar partida' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API.');
    expect(api.writes()).toHaveLength(1);
    failed = false;
    await user.click(screen.getByRole('button', { name: 'Jogar partida' }));
    await screen.findByText('Partida realizada com sucesso.');
    expect(api.writes()).toHaveLength(2);
  });

  it('preserva o placar, o result e o goal devolvidos, sem inferi-los dos valores dos duelos', async () => {
    const response = {
      ...match,
      home: { ...match.home, goals: 3 },
      away: { ...match.away, goals: 0 },
      result: 'EMPATE' as const,
      duels: match.duels.map((duel, index) =>
        index === 0
          ? {
              ...duel,
              attacker: { ...duel.attacker, value: 1 },
              defender: { ...duel.defender, value: 99 },
              goal: true,
            }
          : duel,
      ),
    };

    mockLeagueApi({ readDetail: () => Response.json(response) });
    renderApp('/matches/42');
    const table = await screen.findByRole('table', { name: 'Duelos da partida' });

    expect(screen.getByText('3 × 0')).toBeInTheDocument();
    expect(screen.getByText('Empate')).toBeInTheDocument();
    const rows = within(table).getAllByRole('row');

    expect(within(rows[1]).getByText('Gol')).toBeInTheDocument();
    expect(within(rows[1]).getByText('99')).toBeInTheDocument();
    expect(within(rows[3]).getByText('Sem gol')).toBeInTheDocument();
    expect(within(rows[3]).getAllByText('63')).toHaveLength(2);
    expect(within(table).getByText('56')).toBeInTheDocument();
    expect(within(table).queryByText('54')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument();
  });

  it.each(['999', '042', 'invalido'])(
    'envia o id %s e apresenta a recusa de detalhe',
    async (id) => {
      const api = mockLeagueApi({
        readDetail: () => Response.json({ message: 'Partida não encontrada.' }, { status: 404 }),
      });

      renderApp(`/matches/${id}`);
      expect(await within(screen.getByRole('main')).findByRole('alert')).toHaveTextContent(
        'Partida não encontrada.',
      );

      expect(api.mock.mock.calls.some(([url]) => String(url).endsWith(`/matches/${id}`))).toBe(
        true,
      );
    },
  );

  it('mostra carregamento e permite recuperar o detalhe após erro sem repetir a partida', async () => {
    let finish!: (response: Response) => void;
    let first = true;
    const api = mockLeagueApi({
      readDetail: () => {
        if (!first) return Response.json(match);

        first = false;

        return new Promise<Response>((resolve) => {
          finish = resolve;
        });
      },
    });

    renderApp('/matches/42');
    expect(screen.getByText('Carregando partida…')).toBeInTheDocument();
    await waitFor(() => expect(finish).toBeDefined());
    finish(Response.json({ message: 'Falha ao consultar partida.' }, { status: 500 }));
    const main = within(screen.getByRole('main'));

    expect(await main.findByRole('alert')).toHaveTextContent('Falha ao consultar partida.');
    await userEvent.click(main.getByRole('button', { name: 'Tentar novamente' }));
    expect(await main.findByRole('table', { name: 'Duelos da partida' })).toBeInTheDocument();
    expect(api.writes()).toHaveLength(0);
  });
});
