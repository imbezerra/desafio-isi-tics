import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { club, player } from '../fixtures/league.fixture';
import { purchase } from '../fixtures/purchase.fixture';
import { mockPurchaseApi } from '../helpers/mock-purchase-api';
import { renderApp } from '../helpers/render-app';

async function openPurchase(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: `Comprar ${player.name}` }));
  await screen.findByLabelText('Clube comprador');

  return screen.getByRole('dialog');
}

async function fillPurchase(user: ReturnType<typeof userEvent.setup>) {
  const dialog = await openPurchase(user);

  await user.selectOptions(within(dialog).getByLabelText('Clube comprador'), '7');
  await user.type(within(dialog).getByLabelText('Data da fidelidade'), '02/03/2027');
  await user.type(within(dialog).getByLabelText('Hora da fidelidade'), '10:15');

  return dialog;
}

describe('Compra de jogadores pela interface', () => {
  it('volta à página anterior ao comprar o único livre da última página', async () => {
    const others = Array.from({ length: 10 }, (_, index) => ({
      ...player,
      id: index + 2,
      name: `Outro jogador ${index}`,
    }));
    const api = mockPurchaseApi({ initialPlayers: [...others, player] });
    const user = userEvent.setup();

    renderApp('/players?free=true');
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    await fillPurchase(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    const receipt = await screen.findByRole('dialog', { name: 'Compra concluída' });

    await user.click(within(receipt).getByRole('button', { name: 'Fechar' }));
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(11);
    expect(api.writes()).toHaveLength(1);
  });

  it('não bloqueia a compra se o vínculo mudou desde a listagem; exibe a recusa do servidor', async () => {
    const api = mockPurchaseApi({
      detail: () => Response.json({ ...player, club_id: 7 }),
      write: () => Response.json({ message: 'Jogador já pertence a um clube.' }, { status: 409 }),
    });
    const user = userEvent.setup();

    renderApp('/players');
    await fillPurchase(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Jogador já pertence a um clube.');
    expect(api.writes()).toHaveLength(1);
  });

  it('mostra carregamento antes de montar o formulário com os dados do jogador', async () => {
    mockPurchaseApi({ detail: () => new Promise<Response>(() => {}) });
    const user = userEvent.setup();

    renderApp('/players');
    await user.click(await screen.findByRole('button', { name: 'Comprar João Silva' }));
    expect(screen.getByText('Carregando jogador e clubes…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar compra' })).not.toBeInTheDocument();
  });

  it('mostra falha na consulta de clubes e permite recuperar a consulta', async () => {
    let failed = true;

    mockPurchaseApi({
      readClubs: () =>
        failed
          ? Response.json({ message: 'Falha ao consultar clubes.' }, { status: 500 })
          : Response.json([club]),
    });

    const user = userEvent.setup();

    renderApp('/players');
    await user.click(await screen.findByRole('button', { name: 'Comprar João Silva' }));
    const dialog = screen.getByRole('dialog');

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Falha ao consultar clubes.',
    );

    failed = false;
    await user.click(within(dialog).getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByLabelText('Clube comprador')).toBeInTheDocument();
  });

  it('mostra Comprar só para jogadores livres', async () => {
    mockPurchaseApi({
      initialPlayers: [player, { ...player, id: 2, name: 'Pedro Silva', club_id: 7 }],
    });

    renderApp('/players');
    expect(
      await screen.findByRole('button', { name: `Comprar ${player.name}` }),
    ).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'Comprar Pedro Silva' })).not.toBeInTheDocument();
  });

  it('valida obrigatórios junto aos campos, sem enviar', async () => {
    const api = mockPurchaseApi();
    const user = userEvent.setup();

    renderApp('/players');
    await openPurchase(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    expect(screen.getByText('Selecione o clube comprador.')).toBeInTheDocument();
    expect(screen.getByText('Informe a data da fidelidade.')).toBeInTheDocument();
    expect(screen.getByText('Informe a hora da fidelidade.')).toBeInTheDocument();
    expect(screen.getByLabelText('Clube comprador')).toHaveAttribute(
      'aria-describedby',
      'purchase-club-error',
    );

    expect(api.writes()).toHaveLength(0);
  });

  it('recusa calendário e hora inexistentes, sem normalizá-los', async () => {
    const api = mockPurchaseApi();
    const user = userEvent.setup();

    renderApp('/players');
    await fillPurchase(user);
    await user.clear(screen.getByLabelText('Data da fidelidade'));
    await user.type(screen.getByLabelText('Data da fidelidade'), '31/02/2027');
    await user.clear(screen.getByLabelText('Hora da fidelidade'));
    await user.type(screen.getByLabelText('Hora da fidelidade'), '24:00');
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    expect(screen.getByText('Use uma data válida no formato DD/MM/AAAA.')).toBeInTheDocument();
    expect(screen.getByText('Use uma hora válida no formato HH:MM.')).toBeInTheDocument();
    expect(screen.getByLabelText('Data da fidelidade')).toHaveValue('31/02/2027');
    expect(api.writes()).toHaveLength(0);
  });

  it('envia só clube numérico e fidelidade com -03:00, mostra o resultado e o clube na tabela', async () => {
    const api = mockPurchaseApi();
    const user = userEvent.setup();

    renderApp('/players');
    await fillPurchase(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    const receipt = await screen.findByRole('dialog', { name: 'Compra concluída' });

    expect(within(receipt).getByText('João Silva agora é do Águias FC.')).toBeInTheDocument();

    for (const value of ['37,62', '1,88', '39,50', '02/03/2027, 10:15', '260,50', 'ATIVO'])
      expect(within(receipt).getByText(value)).toBeInTheDocument();
    expect(JSON.parse(String(api.writes()[0][1]?.body))).toEqual({
      club_id: 7,
      loyalty_until: '2027-03-02T10:15-03:00',
    });

    expect(within(screen.getByRole('table')).getByText('AGU · Águias FC')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Comprar João Silva' })).not.toBeInTheDocument();
  });

  it('preserva taxa, valor, fidelidade e novo caixa da resposta, mesmo diferentes da consulta inicial', async () => {
    mockPurchaseApi({
      write: () =>
        Response.json({
          ...purchase,
          value: 10.23,
          fee: 7.89,
          club_cash: 98.76,
          contract: { ...purchase.contract, loyalty_until: '2028-07-09T08:45:00-03:00' },
        }),
    });

    const user = userEvent.setup();

    renderApp('/players');
    await fillPurchase(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    const receipt = await screen.findByRole('dialog', { name: 'Compra concluída' });

    for (const value of ['10,23', '7,89', '18,12', '98,76', '09/07/2028, 08:45'])
      expect(within(receipt).getByText(value)).toBeInTheDocument();
  });

  it('retira o comprado de Só livres, preserva filtros e o encontra pelo clube', async () => {
    mockPurchaseApi();
    const user = userEvent.setup();

    renderApp('/players?free=true');
    await user.type(screen.getByLabelText('Buscar por nome'), 'João');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await fillPurchase(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    const receipt = await screen.findByRole('dialog', { name: 'Compra concluída' });

    await user.click(within(receipt).getByRole('button', { name: 'Fechar' }));
    expect(await screen.findByText(/Nenhum jogador encontrado/)).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar por nome')).toHaveValue('João');
    await user.click(screen.getByText('Vínculo, idade, valor de mercado e ordenação'));
    expect(screen.getByLabelText('Vínculo')).toHaveValue('true');
    await user.selectOptions(screen.getByLabelText('Vínculo'), '');
    await user.selectOptions(screen.getByLabelText('Clube'), '7');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('João Silva')).toBeInTheDocument();
  });

  it('abre o clube atualizado pelo resultado, com jogador e contrato no elenco', async () => {
    mockPurchaseApi();
    const user = userEvent.setup();

    renderApp('/players');
    await fillPurchase(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    const receipt = await screen.findByRole('dialog', { name: 'Compra concluída' });

    await user.click(within(receipt).getByRole('link', { name: 'Ver clube' }));
    const squad = await screen.findByRole('table', { name: 'Elenco' });

    expect(within(squad).getByText('João Silva')).toBeInTheDocument();
    expect(within(squad).getByText('144')).toBeInTheDocument();
    expect(screen.getByText('260,50')).toBeInTheDocument();
  });

  it.each([
    [409, 'O custo da compra ultrapassa 50% do caixa do clube.'],
    [409, 'O clube atingiu o limite de 12 jogadores.'],
    [409, 'Este clube já vendeu o jogador.'],
    [409, 'Jogador já pertence a um clube.'],
    [404, 'Clube não encontrado.'],
    [404, 'Jogador não encontrado.'],
    [400, 'loyalty_until deve ser futuro e estar até 1.095 dias adiante.'],
  ])('envia a tentativa e mostra a mensagem exata (%s): %s', async (status, message) => {
    const api = mockPurchaseApi({
      initialClubs: [{ ...club, cash: 1 }],
      write: () => Response.json({ message }, { status }),
    });
    const user = userEvent.setup();

    renderApp('/players');
    await fillPurchase(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(message);
    expect(api.writes()).toHaveLength(1);
    expect(screen.getByLabelText('Data da fidelidade')).toHaveValue('02/03/2027');
    expect(screen.queryByRole('dialog', { name: 'Compra concluída' })).not.toBeInTheDocument();
  });

  it('envia uma só compra no clique duplo e bloqueia campos, cancelar, fechar e Escape', async () => {
    let release!: (response: Response) => void;
    const api = mockPurchaseApi({
      write: () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    });
    const user = userEvent.setup();

    renderApp('/players');
    const form = await fillPurchase(user);

    await user.dblClick(screen.getByRole('button', { name: 'Confirmar compra' }));
    expect(api.writes()).toHaveLength(1);

    for (const name of ['Enviando…', 'Cancelar', 'Fechar janela'])
      expect(screen.getByRole('button', { name })).toBeDisabled();
    expect(screen.getByLabelText('Clube comprador')).toBeDisabled();
    expect(screen.getByLabelText('Data da fidelidade')).toBeDisabled();
    fireEvent(form, new Event('cancel', { cancelable: true }));
    expect(form).toBeInTheDocument();
    release(Response.json(purchase));
    await screen.findByRole('dialog', { name: 'Compra concluída' });
    expect(api.writes()).toHaveLength(1);
  });

  it('não repete falha de rede automaticamente e permite nova tentativa explícita', async () => {
    let failed = true;
    const api = mockPurchaseApi({
      write: () => {
        if (failed) throw new TypeError('Failed to fetch');

        return Response.json(purchase);
      },
    });
    const user = userEvent.setup();

    renderApp('/players');
    await fillPurchase(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API.');
    expect(api.writes()).toHaveLength(1);
    failed = false;
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }));
    await screen.findByRole('dialog', { name: 'Compra concluída' });
    expect(api.writes()).toHaveLength(2);
  });

  it('permite cancelar sem efetuar compra', async () => {
    const api = mockPurchaseApi();
    const user = userEvent.setup();

    renderApp('/players');
    await openPurchase(user);
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.writes()).toHaveLength(0);
  });

  it('mostra jogador inexistente na abertura e permite tentar novamente', async () => {
    let missing = true;

    mockPurchaseApi({
      detail: () =>
        missing
          ? Response.json({ message: 'Jogador não encontrado.' }, { status: 404 })
          : Response.json(player),
    });

    const user = userEvent.setup();

    renderApp('/players');
    await user.click(await screen.findByRole('button', { name: 'Comprar João Silva' }));
    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(
      'Jogador não encontrado.',
    );

    missing = false;
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Tentar novamente' }),
    );

    expect(await screen.findByLabelText('Clube comprador')).toBeInTheDocument();
  });

  it('mostra ausência de clubes e mantém os obrigatórios, sem compra fictícia', async () => {
    const api = mockPurchaseApi({ initialClubs: [] });
    const user = userEvent.setup();

    renderApp('/players');
    await openPurchase(user);
    expect(screen.getByRole('link', { name: 'Cadastre um clube' })).toHaveAttribute(
      'href',
      '/clubs',
    );

    expect(api.writes()).toHaveLength(0);
  });

  it('entra pelo clube com Só livres aplicado e visível no formulário de filtros', async () => {
    const api = mockPurchaseApi();
    const user = userEvent.setup();

    renderApp('/clubs/7');
    await user.click(await screen.findByRole('link', { name: 'Comprar jogadores' }));
    await screen.findByRole('button', { name: 'Comprar João Silva' });
    expect(screen.getByLabelText('Clube')).toBeDisabled();
    await user.click(screen.getByText('Vínculo, idade, valor de mercado e ordenação'));
    expect(screen.getByLabelText('Vínculo')).toHaveValue('true');
    await waitFor(() =>
      expect(api.mock.mock.calls.some(([url]) => String(url).includes('free=true'))).toBe(true),
    );
  });
});
