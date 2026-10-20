import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { completeLineup, emptyLineup, lineupPlayers } from '../fixtures/lineup.fixture';
import { mockLineupApi } from '../helpers/mock-lineup-api';
import { renderApp } from '../helpers/render-app';

async function openLineup() {
  renderApp('/clubs/7?tab=lineup');

  return screen.findByRole('table', { name: 'Titulares da escalação' });
}

describe('Escalação do clube', () => {
  it('consulta somente ao abrir a aba e mostra a escalação atual da API', async () => {
    const api = mockLineupApi();
    const user = userEvent.setup();

    renderApp('/clubs/7');
    await screen.findByRole('table', { name: 'Elenco' });
    expect(api.mock.mock.calls.some(([url]) => String(url).endsWith('/lineup'))).toBe(false);
    await user.click(screen.getByRole('tab', { name: 'Escalação' }));
    await screen.findByRole('table', { name: 'Titulares da escalação' });
    expect(screen.getByRole('radio', { name: /^2-1-1/ })).toBeChecked();
    expect(screen.getByLabelText('Goleiro 1')).toHaveValue('1');
    expect(screen.getByLabelText('Defesa 1')).toHaveValue('2');
    expect(screen.getByLabelText('Defesa 2')).toHaveValue('3');
    expect(screen.getByLabelText('Meio 1')).toHaveValue('4');
    expect(screen.getByLabelText('Ataque 1')).toHaveValue('5');
    expect(screen.getByText('Completa')).toBeInTheDocument();
    expect(api.writes()).toHaveLength(0);
  });

  it('oferece apenas o elenco, por setor, sem doentes e sem duplicar titulares', async () => {
    mockLineupApi();
    await openLineup();
    const goalkeeper = within(screen.getByLabelText('Goleiro 1'));
    const defense = within(screen.getByLabelText('Defesa 1'));
    const midfield = within(screen.getByLabelText('Meio 1'));

    expect(goalkeeper.getByRole('option', { name: 'Rui Prado (GOL)' })).toBeEnabled();
    expect(goalkeeper.queryByRole('option', { name: /Felipe/ })).not.toBeInTheDocument();
    expect(defense.getByRole('option', { name: 'Diego Ramos (LAT)' })).toBeDisabled();
    expect(
      within(screen.getByLabelText('Defesa 2')).getByRole('option', { name: 'Diego Ramos (LAT)' }),
    ).toBeEnabled();

    expect(midfield.getByRole('option', { name: 'Sávio Lima (MEI)' })).toBeEnabled();
    expect(midfield.queryByRole('option', { name: /Lucas/ })).not.toBeInTheDocument();
    expect(screen.getByText('Doente não pode ser escalado.')).toBeInTheDocument();
  });

  it.each([
    ['3-1', ['Goleiro 1', 'Defesa 1', 'Defesa 2', 'Defesa 3', 'Ataque 1']],
    ['2-2', ['Goleiro 1', 'Defesa 1', 'Defesa 2', 'Ataque 1', 'Ataque 2']],
    ['2-1-1', ['Goleiro 1', 'Defesa 1', 'Defesa 2', 'Meio 1', 'Ataque 1']],
    ['1-2-1', ['Goleiro 1', 'Defesa 1', 'Meio 1', 'Meio 2', 'Ataque 1']],
  ])('oferece exatamente as cinco vagas da formação %s', async (formation, labels) => {
    mockLineupApi();
    const user = userEvent.setup();
    const table = await openLineup();

    await user.click(screen.getByRole('radio', { name: new RegExp(`^${formation}`) }));
    expect(within(table).getAllByRole('combobox')).toHaveLength(5);

    for (const label of labels) expect(screen.getByLabelText(label)).toBeInTheDocument();
  });

  it('valida a formação e cada uma das cinco vagas antes de enviar', async () => {
    const api = mockLineupApi({ initial: emptyLineup });
    const user = userEvent.setup();

    await openLineup();
    expect(screen.getByText('Escalação incompleta: o clube não pode jogar.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }));
    expect(screen.getByText('Selecione a formação.')).toBeInTheDocument();
    expect(screen.getAllByText(/^Escolha um titular/)).toHaveLength(5);
    expect(screen.getByRole('radio', { name: /^3-1/ })).toHaveFocus();
    expect(api.writes()).toHaveLength(0);
    await user.click(screen.getByRole('radio', { name: /^2-1-1/ }));
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }));
    expect(screen.getByLabelText('Goleiro 1')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Goleiro 1')).toHaveFocus();
    expect(api.writes()).toHaveLength(0);
  });

  it('mostra os atributos recebidos e apenas explica o efeito de mal condicionamento', async () => {
    mockLineupApi();
    const table = await openLineup();
    const row = within(table).getByLabelText('Defesa 2').closest('tr')!;

    expect(within(row).getByText('66')).toBeInTheDocument();
    expect(within(row).getByText('74')).toBeInTheDocument();
    expect(screen.getByText(/cada atributo vale 15% a menos/)).toBeInTheDocument();
    expect(within(row).queryByText('56')).not.toBeInTheDocument();
    expect(within(row).queryByText('63')).not.toBeInTheDocument();
  });

  it('salva por PUT e substitui as escolhas, nomes e atributos pelos da resposta', async () => {
    const returned = {
      ...completeLineup,
      players: [lineupPlayers[7], ...lineupPlayers.slice(1, 5)].map((player) => ({
        ...player,
        name: `Atual ${player.name}`,
        overall: 91,
      })),
    };
    const api = mockLineupApi({ write: () => Response.json(returned) });
    const user = userEvent.setup();

    await openLineup();
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }));
    expect(await screen.findByText(/Escalação salva\./)).toBeInTheDocument();
    expect(JSON.parse(String(api.writes()[0][1]?.body))).toEqual({
      formation: '2-1-1',
      player_ids: [1, 2, 3, 4, 5],
    });

    expect(screen.getByLabelText('Goleiro 1')).toHaveValue('8');
    expect(
      within(screen.getByLabelText('Goleiro 1')).getByRole('option', {
        name: 'Atual Rui Prado (GOL)',
      }),
    ).toBeInTheDocument();

    expect(within(screen.getByRole('table')).getAllByText('91')).toHaveLength(5);
  });

  it.each([400, 404, 409])(
    'mostra o message da recusa %s e preserva as escolhas para tentar novamente',
    async (status) => {
      const api = mockLineupApi({
        write: () =>
          Response.json({ message: 'Um dos jogadores mudou depois de abrir a tela.' }, { status }),
      });
      const user = userEvent.setup();

      await openLineup();
      await user.selectOptions(screen.getByLabelText('Goleiro 1'), '8');
      await user.click(screen.getByRole('button', { name: 'Salvar escalação' }));
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Um dos jogadores mudou depois de abrir a tela.',
      );

      expect(screen.getByLabelText('Goleiro 1')).toHaveValue('8');
      expect(api.writes()).toHaveLength(1);
      expect(screen.queryByText(/Escalação salva\./)).not.toBeInTheDocument();
    },
  );

  it('bloqueia envio duplo e edição enquanto a resposta está pendente', async () => {
    let finish!: (response: Response) => void;
    const api = mockLineupApi({
      write: () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    });

    await openLineup();
    const form = screen.getByRole('form', { name: 'Escalação do clube' });

    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(() => expect(api.writes()).toHaveLength(1));
    expect(screen.getByRole('button', { name: 'Salvando…' })).toBeDisabled();
    expect(screen.getByLabelText('Goleiro 1')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    finish(Response.json(completeLineup));
    await screen.findByText(/Escalação salva\./);
    expect(screen.getByRole('button', { name: 'Salvar escalação' })).toBeEnabled();
  });

  it('cancela somente as alterações locais, sem salvar nem apagar a escalação', async () => {
    const api = mockLineupApi();
    const user = userEvent.setup();

    await openLineup();
    await user.click(screen.getByRole('radio', { name: /^3-1/ }));
    await user.selectOptions(screen.getByLabelText('Goleiro 1'), '8');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('radio', { name: /^2-1-1/ })).toBeChecked();
    expect(screen.getByLabelText('Goleiro 1')).toHaveValue('1');
    expect(screen.queryByLabelText('Defesa 3')).not.toBeInTheDocument();
    expect(api.writes()).toHaveLength(0);
  });

  it('restaura a ordem da resposta mesmo quando o servidor devolve uma escalação igual ao cache', async () => {
    mockLineupApi({ write: () => Response.json(completeLineup) });
    const user = userEvent.setup();

    await openLineup();
    await user.selectOptions(screen.getByLabelText('Defesa 1'), '');
    await user.selectOptions(screen.getByLabelText('Defesa 2'), '2');
    await user.selectOptions(screen.getByLabelText('Defesa 1'), '3');
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }));
    await screen.findByText(/Escalação salva\./);
    expect(screen.getByLabelText('Defesa 1')).toHaveValue('2');
    expect(screen.getByLabelText('Defesa 2')).toHaveValue('3');
  });

  it('retira a confirmação anterior ao iniciar outro envio que termina em recusa', async () => {
    let failed = false;

    mockLineupApi({
      write: () =>
        failed
          ? Response.json({ message: 'Jogador DOENTE não pode ser escalado.' }, { status: 409 })
          : Response.json(completeLineup),
    });

    const user = userEvent.setup();

    await openLineup();
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }));
    await screen.findByText(/Escalação salva\./);
    failed = true;
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Jogador DOENTE não pode ser escalado.',
    );

    expect(screen.queryByText(/Escalação salva\./)).not.toBeInTheDocument();
  });

  it.each([
    ['3-1', 'Defesa 3', '7', [1, 2, 3, 7, 5]],
    ['2-2', 'Ataque 2', '9', [1, 2, 3, 5, 9]],
    ['1-2-1', 'Meio 2', '10', [1, 2, 4, 10, 5]],
  ])(
    'salva a formação %s com cinco ids e sem escolhas de setores removidos',
    async (formation, label, id, ids) => {
      const api = mockLineupApi();
      const user = userEvent.setup();

      await openLineup();
      await user.click(screen.getByRole('radio', { name: new RegExp(`^${formation}`) }));
      await user.selectOptions(screen.getByLabelText(label), id);
      await user.click(screen.getByRole('button', { name: 'Salvar escalação' }));
      await screen.findByText(/Escalação salva\./);
      expect(JSON.parse(String(api.writes()[0][1]?.body))).toEqual({ formation, player_ids: ids });
    },
  );

  it('mantém as escolhas após falha de rede e só envia novamente por ação manual', async () => {
    let failed = true;
    const api = mockLineupApi({
      write: () => {
        if (failed) throw new TypeError('Failed to fetch');

        return Response.json(completeLineup);
      },
    });
    const user = userEvent.setup();

    await openLineup();
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API.');
    expect(api.writes()).toHaveLength(1);
    expect(screen.getByLabelText('Meio 1')).toHaveValue('4');
    failed = false;
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }));
    await screen.findByText(/Escalação salva\./);
    expect(api.writes()).toHaveLength(2);
  });

  it('preserva a formação e os titulares restantes quando a API devolve escalação incompleta', async () => {
    let current = completeLineup;

    mockLineupApi({ read: () => Response.json(current) });
    const user = userEvent.setup();

    await openLineup();
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }));
    await screen.findByText(/Escalação salva\./);
    current = {
      ...completeLineup,
      complete: false,
      players: completeLineup.players.filter((player) => player.id !== 5),
    };

    await user.click(screen.getByRole('button', { name: 'Atualizar dados' }));
    expect(
      await screen.findByText('Escalação incompleta: o clube não pode jogar.'),
    ).toBeInTheDocument();

    expect(screen.getByRole('radio', { name: /^2-1-1/ })).toBeChecked();
    expect(screen.getByLabelText('Goleiro 1')).toHaveValue('1');
    expect(screen.getByLabelText('Ataque 1')).toHaveValue('');
    expect(screen.queryByText(/Escalação salva\./)).not.toBeInTheDocument();
    expect(
      within(screen.getByLabelText('Ataque 1')).getByRole('option', { name: 'João Silva (ATA)' }),
    ).toBeEnabled();
  });

  it('mostra carregamento e permite tentar novamente uma consulta sem repetição automática', async () => {
    let failed = true;
    const api = mockLineupApi({
      read: () =>
        failed
          ? Response.json({ message: 'Clube não encontrado.' }, { status: 404 })
          : Response.json(emptyLineup),
    });
    const user = userEvent.setup();

    renderApp('/clubs/7?tab=lineup');
    expect(await screen.findByRole('alert')).toHaveTextContent('Clube não encontrado.');
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(api.mock.mock.calls.filter(([url]) => String(url).endsWith('/lineup'))).toHaveLength(1);
    failed = false;
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByRole('table');
    expect(screen.getByText('Incompleta')).toBeInTheDocument();
  });

  it('apresenta o carregamento da escalação sem oferecer envio', async () => {
    mockLineupApi({ read: () => new Promise<Response>(() => {}) });
    renderApp('/clubs/7?tab=lineup');
    expect(await screen.findByText('Carregando escalação…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar escalação' })).not.toBeInTheDocument();
  });
});
