import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { club } from '../fixtures/league.fixture';
import { mockClubApi } from '../helpers/mock-club-api';
import { renderApp } from '../helpers/render-app';

async function fillClub(
  user: ReturnType<typeof userEvent.setup>,
  name = 'Leões da Serra',
  acronym = 'LDS',
) {
  await user.click(screen.getByRole('button', { name: 'Novo clube' }));
  const dialog = screen.getByRole('dialog');

  await user.type(within(dialog).getByRole('textbox', { name: 'Nome' }), name);
  await user.type(within(dialog).getByRole('textbox', { name: 'Sigla' }), acronym);

  return dialog;
}

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
    expect(screen.getByRole('button', { name: 'Novo clube' })).toBeInTheDocument();
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

  it('mostra a lista vazia e mantém cadastro disponível', async () => {
    mockClubApi({ initial: [] });
    renderApp('/clubs');
    expect(
      await screen.findByText('Nenhum clube cadastrado. Crie o primeiro clube para começar.'),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Novo clube' })).toBeEnabled();
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

describe('Criação de clubes', () => {
  it('exibe os erros junto aos campos e não envia formulário vazio', async () => {
    const api = mockClubApi();
    const user = userEvent.setup();

    renderApp('/clubs');
    await user.click(screen.getByRole('button', { name: 'Novo clube' }));
    await user.click(screen.getByRole('button', { name: 'Criar clube' }));
    expect(screen.getByText('Informe o nome.')).toBeInTheDocument();
    expect(screen.getByText('Informe a sigla.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveAttribute(
      'aria-describedby',
      'club-name-error',
    );

    expect(api.writes()).toHaveLength(0);
  });

  it('envia só nome e sigla e atualiza lista, contadores, filtro e números da API', async () => {
    const api = mockClubApi();
    const user = userEvent.setup();

    renderApp('/clubs');
    await fillClub(user, '  Leões   da Serra  ');
    await user.click(screen.getByRole('button', { name: 'Criar clube' }));
    expect(await screen.findByText('Leões da Serra (LDS) criado com sucesso.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Leões da Serra')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clubes 2' })).toBeInTheDocument();
    expect(screen.getByText('2 de 20')).toBeInTheDocument();
    const values = screen.getByLabelText('Valores de Leões da Serra devolvidos pela API');

    expect(within(values).getAllByText('300,00')).toHaveLength(2);
    expect(within(values).getByText('0,00')).toBeInTheDocument();
    expect(JSON.parse(String(api.writes()[0][1]?.body))).toEqual({
      name: 'Leões da Serra',
      acronym: 'LDS',
    });

    await user.click(screen.getByRole('link', { name: /^Jogadores/ }));
    expect(await screen.findByRole('option', { name: 'Leões da Serra' })).toBeInTheDocument();
  });

  it('não substitui os valores da resposta por constantes ou somas locais', async () => {
    mockClubApi({
      create: () =>
        Response.json(
          {
            ...club,
            id: 99,
            name: 'Leões da Serra',
            acronym: 'LDS',
            cash: 10.23,
            squad_value: 5.67,
            net_worth: 98.76,
          },
          { status: 201 },
        ),
    });

    const user = userEvent.setup();

    renderApp('/clubs');
    await fillClub(user);
    await user.click(screen.getByRole('button', { name: 'Criar clube' }));
    const result = await screen.findByLabelText('Valores de Leões da Serra devolvidos pela API');

    for (const value of ['10,23', '5,67', '98,76'])
      expect(within(result).getByText(value)).toBeInTheDocument();
  });

  it('mantém a ordenação aplicada depois de salvar', async () => {
    mockClubApi();
    const user = userEvent.setup();

    renderApp('/clubs');
    await screen.findByRole('table');
    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'net_worth_desc');
    await fillClub(user);
    await user.click(screen.getByRole('button', { name: 'Criar clube' }));
    await screen.findByText('Leões da Serra (LDS) criado com sucesso.');
    expect(screen.getByLabelText('Ordenar por')).toHaveValue('net_worth_desc');
  });

  it.each([
    'Nome de clube já cadastrado.',
    'Sigla de clube já cadastrada.',
    'A liga já atingiu o limite de 20 clubes.',
  ])('envia o pedido e exibe a recusa: %s', async (message) => {
    const api = mockClubApi({
      initial: Array.from({ length: 20 }, (_, index) => ({ ...club, id: index + 1 })),
      create: () => Response.json({ message }, { status: 409 }),
    });
    const user = userEvent.setup();

    renderApp('/clubs');
    await fillClub(user);
    await user.click(screen.getByRole('button', { name: 'Criar clube' }));
    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Leões da Serra');

    expect(api.writes()).toHaveLength(1);
    expect(screen.queryByText(/criado com sucesso/)).not.toBeInTheDocument();
  });

  it('preserva a recusa 400 de formato ou relação entre nome e sigla', async () => {
    const api = mockClubApi({
      create: () =>
        Response.json(
          { message: 'acronym deve aparecer no nome do clube, na mesma ordem.' },
          { status: 400 },
        ),
    });
    const user = userEvent.setup();

    renderApp('/clubs');
    await fillClub(user, 'Leões da Serra', 'XYZ');
    await user.click(screen.getByRole('button', { name: 'Criar clube' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'acronym deve aparecer no nome do clube, na mesma ordem.',
    );

    expect(api.writes()).toHaveLength(1);
  });

  it('envia um pedido no clique duplo e bloqueia ações enquanto aguarda', async () => {
    let release!: (response: Response) => void;
    const api = mockClubApi({
      create: () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    });
    const user = userEvent.setup();

    renderApp('/clubs');
    const dialog = await fillClub(user);

    await user.dblClick(screen.getByRole('button', { name: 'Criar clube' }));
    expect(api.writes()).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fechar janela' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Nome' })).toBeDisabled();
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(dialog).toBeInTheDocument();
    release(Response.json({ ...club, name: 'Leões da Serra', acronym: 'LDS' }, { status: 201 }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.writes()).toHaveLength(1);
  });

  it('não repete falha de rede automaticamente e permite uma nova tentativa explícita', async () => {
    let failed = true;
    const api = mockClubApi({
      create: () => {
        if (failed) throw new TypeError('Failed to fetch');

        return undefined;
      },
    });
    const user = userEvent.setup();

    renderApp('/clubs');
    await fillClub(user);
    await user.click(screen.getByRole('button', { name: 'Criar clube' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API.');
    expect(api.writes()).toHaveLength(1);
    failed = false;
    await user.click(screen.getByRole('button', { name: 'Criar clube' }));
    await screen.findByText('Leões da Serra (LDS) criado com sucesso.');
    expect(api.writes()).toHaveLength(2);
  });

  it('permite abrir pelo atalho do menu e cancelar sem escrever', async () => {
    const api = mockClubApi();
    const user = userEvent.setup();

    renderApp('/clubs');
    await user.click(screen.getByRole('button', { name: 'Novo clube pelo menu' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(api.writes()).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Novo clube pelo menu' })).toHaveFocus();
  });
});
