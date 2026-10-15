import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { player } from '../fixtures/league.fixture';
import { mockPlayerApi } from '../helpers/mock-player-api';
import { renderApp } from '../helpers/render-app';

async function openAction(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  name = player.name,
) {
  await user.click(await screen.findByRole('button', { name: `Ações de ${name}` }));
  await user.click(screen.getByRole('menuitem', { name: label }));

  return screen.findByRole('dialog');
}

async function fillCreate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Novo jogador' }));
  const dialog = screen.getByRole('dialog');

  await user.type(within(dialog).getByRole('textbox', { name: 'Nome' }), 'Pedro Silva');
  await user.click(within(dialog).getByRole('radio', { name: /MEI/ }));

  for (const [label, value] of Object.entries({
    Idade: '20',
    Agilidade: '80',
    Velocidade: '70',
    Finalização: '65',
    Passe: '80',
    Drible: '75',
    Defesa: '60',
    Físico: '70',
    Potencial: '85',
  })) {
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: label }), {
      target: { value },
    });
  }

  return dialog;
}

const flows = [
  { kind: 'create', method: 'POST', label: 'Salvar jogador', menu: '' },
  { kind: 'edit', method: 'PUT', label: 'Salvar alterações', menu: 'Editar' },
  { kind: 'condition', method: 'PATCH', label: 'Salvar condição', menu: 'Alterar condição' },
  { kind: 'delete', method: 'DELETE', label: 'Excluir jogador', menu: 'Excluir' },
] as const;

async function prepareFlow(user: ReturnType<typeof userEvent.setup>, flow: (typeof flows)[number]) {
  if (flow.kind === 'create') return fillCreate(user);

  await openAction(user, flow.menu);
  const button = await screen.findByRole('button', { name: flow.label });

  if (flow.kind === 'condition') await user.click(screen.getByRole('radio', { name: 'Doente' }));

  return button.closest('dialog')!;
}

describe('Cadastro de jogadores', () => {
  it('mostra erros junto aos onze campos sem enviar a API', async () => {
    const api = mockPlayerApi();
    const user = userEvent.setup();

    renderApp('/players');
    await user.click(screen.getByRole('button', { name: 'Novo jogador' }));
    await user.click(screen.getByRole('button', { name: 'Salvar jogador' }));
    expect(screen.getByText('Informe o nome.')).toBeInTheDocument();
    expect(screen.getByText('Selecione a posição.')).toBeInTheDocument();
    expect(screen.getByText('Informe potencial.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveAttribute(
      'aria-describedby',
      'player-name-error',
    );

    expect(api.writes('POST')).toHaveLength(0);
  });

  it('envia onze campos e mostra base, overall e mercado exatos do servidor após salvar', async () => {
    const api = mockPlayerApi();
    const user = userEvent.setup();

    renderApp('/players');
    await fillCreate(user);
    await user.click(screen.getByRole('button', { name: 'Salvar jogador' }));
    await screen.findByText('Pedro Silva cadastrado com sucesso.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Pedro Silva')).toBeInTheDocument();
    const result = screen.getByLabelText('Valores de Pedro Silva devolvidos pela API');

    expect(within(result).getByText('42,17')).toBeInTheDocument();
    expect(within(result).getByText('47,89')).toBeInTheDocument();
    expect(within(result).getByText('79')).toBeInTheDocument();
    expect(screen.getByText('2 resultados')).toBeInTheDocument();
    const body = JSON.parse(String(api.writes('POST')[0][1]?.body));

    expect(body).toEqual({
      name: 'Pedro Silva',
      position: 'MEI',
      age: 20,
      agility: 80,
      pace: 70,
      shooting: 65,
      passing: 80,
      dribbling: 75,
      defending: 60,
      physical: 70,
      potential: 85,
    });
  });

  it('mostra recusa de regra cruzada da API e preserva os campos para corrigir', async () => {
    const api = mockPlayerApi({
      write: () =>
        Response.json({ message: 'A soma dos atributos não pode passar de 480.' }, { status: 400 }),
    });
    const user = userEvent.setup();

    renderApp('/players');
    await fillCreate(user);
    await user.click(screen.getByRole('button', { name: 'Salvar jogador' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A soma dos atributos não pode passar de 480.',
    );

    expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveValue('Pedro Silva');
    expect(api.writes('POST')).toHaveLength(1);
    expect(screen.queryByText(/cadastrado com sucesso/)).not.toBeInTheDocument();
  });
});

describe('Detalhes e edição', () => {
  it('carrega o jogador por id, mostra os sete indicadores e permite abrir edição', async () => {
    const api = mockPlayerApi();
    const user = userEvent.setup();

    renderApp('/players');
    await openAction(user, 'Ver detalhes');
    const dialog = await screen.findByRole('dialog', { name: 'Detalhes do jogador' });

    expect(within(dialog).getAllByRole('meter')).toHaveLength(7);
    expect(within(dialog).getByRole('meter', { name: 'Potencial' })).toHaveAttribute('value', '85');
    expect(api.mock.mock.calls.some(([url]) => String(url).endsWith('/players/1'))).toBe(true);
    await user.click(within(dialog).getByRole('button', { name: 'Editar' }));
    expect(await screen.findByRole('textbox', { name: 'Nome' })).toHaveValue(player.name);
  });

  it('envia apenas nome, posição, idade e agilidade, atualizando a lista', async () => {
    const api = mockPlayerApi();
    const user = userEvent.setup();

    renderApp('/players');
    await openAction(user, 'Editar');
    const name = await screen.findByRole('textbox', { name: 'Nome' });

    await user.clear(name);
    await user.type(name, 'João Santos');
    expect(screen.queryByRole('spinbutton', { name: 'Potencial' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await screen.findByText('João Santos atualizado com sucesso.');
    expect(within(screen.getByRole('table')).getByText('João Santos')).toBeInTheDocument();
    expect(JSON.parse(String(api.writes('PUT')[0][1]?.body))).toEqual({
      name: 'João Santos',
      position: 'MEI',
      age: 20,
      agility: 85,
    });
  });

  it('não permite mudar posição de jogador com clube e não oferece excluir', async () => {
    mockPlayerApi({ initial: [{ ...player, club_id: 7 }] });
    const user = userEvent.setup();

    renderApp('/players');
    await user.click(await screen.findByRole('button', { name: `Ações de ${player.name}` }));
    expect(screen.queryByRole('menuitem', { name: 'Excluir' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
    expect(await screen.findByRole('radio', { name: /GOL/ })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /MEI/ })).toBeEnabled();
  });

  it('expõe erro de carregamento dos detalhes e permite tentar novamente', async () => {
    let failed = true;

    mockPlayerApi({
      detail: () =>
        failed
          ? Response.json({ message: 'Falha temporária.' }, { status: 500 })
          : Response.json(player),
    });

    const user = userEvent.setup();

    renderApp('/players');
    await openAction(user, 'Ver detalhes');
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha temporária.');
    failed = false;
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Tentar novamente' }),
    );

    expect(await screen.findByRole('dialog', { name: 'Detalhes do jogador' })).toBeInTheDocument();
  });
});

describe('Condição e exclusão', () => {
  it('atualiza condição e mercado pela API e reaplica o filtro sem recarregar', async () => {
    const api = mockPlayerApi();
    const user = userEvent.setup();

    renderApp('/players');
    await user.selectOptions(screen.getByLabelText('Condição'), 'APTO');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await openAction(user, 'Alterar condição');
    await screen.findByRole('button', { name: 'Salvar condição' });
    await user.click(screen.getByRole('radio', { name: 'Doente' }));
    await user.click(screen.getByRole('button', { name: 'Salvar condição' }));
    await screen.findByText('Condição de João Silva atualizada com sucesso.');
    expect(screen.getByText(/Nenhum jogador encontrado/)).toBeInTheDocument();
    expect(screen.getByLabelText('Condição')).toHaveValue('APTO');
    expect(screen.getByText('29,43')).toBeInTheDocument();
    expect(JSON.parse(String(api.writes('PATCH')[0][1]?.body))).toEqual({ condition: 'DOENTE' });
  });

  it('explica a transição proibida de Doente direto para Apto sem enviar', async () => {
    const api = mockPlayerApi({ initial: [{ ...player, condition: 'DOENTE' }] });
    const user = userEvent.setup();

    renderApp('/players');
    await openAction(user, 'Alterar condição');
    await screen.findByRole('button', { name: 'Salvar condição' });
    await user.click(screen.getByRole('radio', { name: 'Apto' }));
    await user.click(screen.getByRole('button', { name: 'Salvar condição' }));
    expect(
      screen.getByText('Jogador DOENTE não pode passar direto para APTO.'),
    ).toBeInTheDocument();

    expect(api.writes('PATCH')).toHaveLength(0);
  });

  it('exige confirmação e permite cancelar a exclusão sem pedido', async () => {
    const api = mockPlayerApi();
    const user = userEvent.setup();

    renderApp('/players');
    await openAction(user, 'Excluir');
    expect(api.writes('DELETE')).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(api.writes('DELETE')).toHaveLength(0);
    expect(within(screen.getByRole('table')).getByText(player.name)).toBeInTheDocument();
  });

  it('trata DELETE 204 sem ler JSON e retira o jogador da lista e contadores', async () => {
    const api = mockPlayerApi();
    const user = userEvent.setup();

    renderApp('/players');
    await openAction(user, 'Excluir');
    await user.click(screen.getByRole('button', { name: 'Excluir jogador' }));
    await screen.findByText('João Silva excluído com sucesso.');
    expect(screen.getByText(/Nenhum jogador encontrado/)).toBeInTheDocument();
    expect(screen.getByText('0 resultados')).toBeInTheDocument();
    expect(api.writes('DELETE')).toHaveLength(1);
    expect(api.writes('DELETE')[0][1]).not.toHaveProperty('body');
  });

  it('volta uma página ao excluir o único jogador da última página', async () => {
    mockPlayerApi({
      initial: Array.from({ length: 11 }, (_, index) => ({
        ...player,
        id: index + 1,
        name: `Jogador ${index + 1} Silva`,
      })),
    });

    const user = userEvent.setup();

    renderApp('/players');
    await screen.findByText('11 resultados');
    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    await openAction(user, 'Excluir', 'Jogador 11 Silva');
    await user.click(screen.getByRole('button', { name: 'Excluir jogador' }));
    await screen.findByText('Jogador 11 Silva excluído com sucesso.');
    expect(await screen.findByText('1 / 1')).toBeInTheDocument();
    expect(screen.getByText('Mostrando 1–10 de 10 jogadores')).toBeInTheDocument();
  });
});

describe.each(flows)('Proteção de envio e recusas: $kind', (flow) => {
  it('envia um único pedido no clique duplo e bloqueia fechar enquanto pendente', async () => {
    let release!: (response: Response) => void;
    const api = mockPlayerApi({
      write: () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    });
    const user = userEvent.setup();

    renderApp('/players');
    const dialog = await prepareFlow(user, flow);

    await user.dblClick(screen.getByRole('button', { name: flow.label }));
    expect(api.writes(flow.method)).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fechar janela' })).toBeDisabled();
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(dialog).toBeInTheDocument();
    release(flow.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json(player));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.writes(flow.method)).toHaveLength(1);
  });

  it.each([404, 409])('preserva message de recusa %i e não anuncia sucesso', async (status) => {
    const api = mockPlayerApi({
      write: () => Response.json({ message: `Recusa específica ${status}.` }, { status }),
    });
    const user = userEvent.setup();

    renderApp('/players');
    await prepareFlow(user, flow);
    await user.click(screen.getByRole('button', { name: flow.label }));
    expect(await screen.findByRole('alert')).toHaveTextContent(`Recusa específica ${status}.`);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: flow.label })).toBeEnabled();
    expect(screen.queryByText(/com sucesso/)).not.toBeInTheDocument();
    expect(api.writes(flow.method)).toHaveLength(1);
  });
});
