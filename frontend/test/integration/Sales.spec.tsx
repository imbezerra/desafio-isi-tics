import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { clubDetails } from '../fixtures/league.fixture';
import { sale } from '../fixtures/sale.fixture';
import { mockSaleApi } from '../helpers/mock-sale-api';
import { renderApp } from '../helpers/render-app';

async function openSale(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Vender João Silva' }));

  return screen.getByRole('dialog', { name: 'Vender João Silva?' });
}

describe('Venda pela página do clube', () => {
  it('exige confirmação e permite cancelar sem enviar', async () => {
    const api = mockSaleApi();
    const user = userEvent.setup();

    renderApp('/clubs/7');
    const dialog = await openSale(user);

    expect(within(dialog).getByText('28,80')).toBeInTheDocument();
    expect(within(dialog).getByText('02/03/2027, 10:15')).toBeInTheDocument();
    expect(within(dialog).getByText('120')).toBeInTheDocument();
    expect(within(dialog).getByText('10%')).toBeInTheDocument();
    expect(within(dialog).getByRole('note')).toHaveTextContent('Se for titular');
    expect(api.writes()).toHaveLength(0);
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(api.writes()).toHaveLength(0);
  });

  it('envia sem corpo e mostra os oito valores exatos da resposta', async () => {
    const api = mockSaleApi();
    const user = userEvent.setup();

    renderApp('/clubs/7');
    await openSale(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar venda' }));
    const receipt = await screen.findByRole('dialog', { name: 'Venda concluída' });

    for (const value of [
      '37,00',
      '40,00',
      '117',
      '4,00',
      '+3,00',
      '0,30',
      '+35,70',
      '296,85',
      'RESCINDIDO',
    ]) {
      expect(within(receipt).getByText(value)).toBeInTheDocument();
    }

    expect(api.writes()).toHaveLength(1);
    expect(api.writes()[0][1]).toEqual({ method: 'POST' });
    await user.click(within(receipt).getByRole('button', { name: 'Fechar' }));
    expect(await screen.findByText('Este clube ainda não tem jogadores.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Vender João Silva' })).not.toBeInTheDocument();
    const summary = screen.getByLabelText('Valores de Águias FC devolvidos pela API');

    expect(summary).toHaveTextContent('296,85');
  });

  it('atualiza jogadores livres ao navegar sem recarregar a página', async () => {
    mockSaleApi();
    const user = userEvent.setup();

    renderApp('/clubs/7');
    await openSale(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar venda' }));
    const receipt = await screen.findByRole('dialog', { name: 'Venda concluída' });

    await user.click(within(receipt).getByRole('button', { name: 'Fechar' }));
    await user.click(screen.getByRole('link', { name: 'Comprar jogadores' }));
    expect(await screen.findByRole('button', { name: 'Comprar João Silva' })).toBeInTheDocument();
    expect(screen.getByLabelText('Vínculo')).toHaveValue('true');
  });

  it.each([404, 409])(
    'mostra a recusa %s do servidor sem fechar ou repetir a venda',
    async (status) => {
      const api = mockSaleApi({
        write: () =>
          Response.json({ message: 'Jogador não está disponível para venda.' }, { status }),
      });
      const user = userEvent.setup();

      renderApp('/clubs/7');
      const dialog = await openSale(user);

      await user.click(within(dialog).getByRole('button', { name: 'Confirmar venda' }));
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'Jogador não está disponível para venda.',
      );

      expect(screen.queryByRole('dialog', { name: 'Venda concluída' })).not.toBeInTheDocument();
      expect(api.writes()).toHaveLength(1);
      expect(within(dialog).getByRole('button', { name: 'Confirmar venda' })).toBeEnabled();
    },
  );

  it('não repete falha de rede automaticamente e permite nova confirmação', async () => {
    let failed = true;
    const api = mockSaleApi({
      write: () => {
        if (failed) throw new TypeError('Failed to fetch');

        return Response.json(sale);
      },
    });
    const user = userEvent.setup();

    renderApp('/clubs/7');
    await openSale(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar venda' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API.');
    expect(api.writes()).toHaveLength(1);
    failed = false;
    await user.click(screen.getByRole('button', { name: 'Confirmar venda' }));
    await screen.findByRole('dialog', { name: 'Venda concluída' });
    expect(api.writes()).toHaveLength(2);
  });

  it('bloqueia clique duplo e fechamento durante envio', async () => {
    let resolve!: (value: Response) => void;
    const api = mockSaleApi({
      write: () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    });
    const user = userEvent.setup();

    renderApp('/clubs/7');
    const dialog = await openSale(user);
    const button = within(dialog).getByRole('button', { name: 'Confirmar venda' });

    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(api.writes()).toHaveLength(1));

    for (const item of within(dialog).getAllByRole('button')) expect(item).toBeDisabled();
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    expect(dialog).toBeInTheDocument();
    resolve(Response.json(sale));
    await screen.findByRole('dialog', { name: 'Venda concluída' });
  });

  it('envia mesmo sem contrato na consulta, deixando a recusa para a API', async () => {
    const api = mockSaleApi({
      initial: { ...clubDetails, players: [{ ...clubDetails.players[0], contract: null }] },
    });
    const user = userEvent.setup();

    renderApp('/clubs/7');
    const dialog = await openSale(user);

    expect(within(dialog).getByText(/Contrato indisponível na consulta/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Confirmar venda' }));
    await screen.findByRole('dialog', { name: 'Venda concluída' });
    expect(api.writes()).toHaveLength(1);
  });

  it('preserva o comprovante se a atualização do clube falhar após a venda', async () => {
    mockSaleApi({
      detail: (club) =>
        club.players.length
          ? Response.json(club)
          : Response.json({ message: 'Falha ao atualizar clube.' }, { status: 500 }),
    });

    const user = userEvent.setup();

    renderApp('/clubs/7');
    await openSale(user);
    await user.click(screen.getByRole('button', { name: 'Confirmar venda' }));
    const receipt = await screen.findByRole('dialog', { name: 'Venda concluída' });

    expect(within(receipt).getByText('+35,70')).toBeInTheDocument();
    await user.click(within(receipt).getByRole('button', { name: 'Fechar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao atualizar clube.');
  });
});
