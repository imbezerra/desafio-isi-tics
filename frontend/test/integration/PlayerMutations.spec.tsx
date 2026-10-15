import { fireEvent, screen, waitFor, within } from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import { describe, expect, it } from 'vitest';

import { player } from '../fixtures/league.fixture';

import { mockPlayerApi } from '../helpers/mock-player-api';

import { renderApp } from '../helpers/render-app';

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

const flows = [{ kind: 'create', method: 'POST', label: 'Salvar jogador', menu: '' }] as const;

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
    const dialog = await fillCreate(user);

    await user.dblClick(screen.getByRole('button', { name: flow.label }));
    expect(api.writes(flow.method)).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fechar janela' })).toBeDisabled();
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(dialog).toBeInTheDocument();
    release(Response.json(player));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.writes(flow.method)).toHaveLength(1);
  });

  it.each([404, 409])('preserva message de recusa %i e não anuncia sucesso', async (status) => {
    const api = mockPlayerApi({
      write: () => Response.json({ message: `Recusa específica ${status}.` }, { status }),
    });
    const user = userEvent.setup();

    renderApp('/players');
    await fillCreate(user);
    await user.click(screen.getByRole('button', { name: flow.label }));
    expect(await screen.findByRole('alert')).toHaveTextContent(`Recusa específica ${status}.`);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: flow.label })).toBeEnabled();
    expect(screen.queryByText(/com sucesso/)).not.toBeInTheDocument();
    expect(api.writes(flow.method)).toHaveLength(1);
  });
});
