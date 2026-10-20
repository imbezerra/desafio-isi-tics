import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { history, emptySummary, historyCsv } from '../fixtures/history.fixture';
import { mockHistoryApi } from '../helpers/mock-history-api';
import { mockDownload } from '../helpers/mock-download';
import { renderApp } from '../helpers/render-app';
import { readTestBlob } from '../helpers/read-blob';

describe('Histórico de transações na página do clube', () => {
  it('não mantém o filtro de jogador ao navegar para outro clube', async () => {
    const clubs = [
      { id: 7, name: 'Águias FC', acronym: 'AGU', cash: 300, squad_value: 0, net_worth: 300 },
      { id: 8, name: 'Delta FC', acronym: 'DFC', cash: 300, squad_value: 0, net_worth: 300 },
    ];
    const api = mockHistoryApi({ clubs });
    const user = userEvent.setup();

    renderApp('/clubs/7?tab=history');
    await screen.findByRole('table');
    await user.selectOptions(screen.getByLabelText('Jogador do histórico'), '2');
    await user.click(screen.getByRole('link', { name: 'Abrir Delta FC' }));
    await screen.findByRole('heading', { name: 'Delta FC' });
    await user.click(screen.getByRole('tab', { name: 'Histórico' }));
    await waitFor(() =>
      expect(
        api.mock.mock.calls.some(([url]) => String(url).includes('/clubs/8/transactions')),
      ).toBe(true),
    );

    expect(screen.getByLabelText('Jogador do histórico')).toHaveValue('');
  });

  it('não repete uma exportação com falha de rede e permite nova tentativa manual', async () => {
    let failed = true;
    const api = mockHistoryApi({
      exportFile: () => {
        if (failed) throw new TypeError('Failed to fetch');

        return new Response(historyCsv, { headers: { 'Content-Type': 'text/csv' } });
      },
    });
    const download = mockDownload();
    const user = userEvent.setup();

    renderApp('/clubs/7?tab=history');
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API.');
    expect(api.exports()).toHaveLength(1);
    expect(download.saved).toHaveLength(0);
    failed = false;
    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    await screen.findByText('CSV exportado com os filtros aplicados.');
    expect(api.exports()).toHaveLength(2);
    expect(download.saved).toHaveLength(1);
  });

  it('abre pela aba com a ordem da API, os nomes históricos e as datas em Brasília', async () => {
    mockHistoryApi();
    const user = userEvent.setup();

    renderApp('/clubs/7');
    await user.click(await screen.findByRole('tab', { name: 'Histórico' }));
    const table = await screen.findByRole('table', { name: 'Histórico de transações' });
    const rows = within(table).getAllByRole('row');

    expect(rows[1]).toHaveTextContent('Meia Lua');
    expect(rows[4]).toHaveTextContent('Meia Lua Antigo');
    expect(within(table).getByText('20:30')).toBeInTheDocument();
    expect(within(table).getByText('00:00')).toBeInTheDocument();

    for (const value of ['+35,70', '-39,90', '+3,00', '-7,50'])
      expect(within(table).getByText(value)).toBeInTheDocument();
    expect(within(table).getAllByText('—')).toHaveLength(2);
    expect(screen.queryByRole('table', { name: 'Elenco' })).not.toBeInTheDocument();
  });

  it('aplica um ou mais tipos no servidor e usa o summary correspondente', async () => {
    const api = mockHistoryApi();
    const user = userEvent.setup();

    renderApp('/clubs/7?tab=history');
    await screen.findByRole('table');
    await user.click(screen.getByRole('checkbox', { name: 'Compra' }));
    expect(await screen.findByText('11,22')).toBeInTheDocument();
    expect(screen.getByText('+3,45')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3);
    await user.click(screen.getByRole('checkbox', { name: 'Compra' }));
    expect(await screen.findByText('93,21')).toBeInTheDocument();
    expect(
      api.mock.mock.calls.some(
        ([url]) => new URL(String(url)).searchParams.get('type') === 'COMPRA,VENDA',
      ),
    ).toBe(true);
  });

  it('mantém opções de jogadores de todo o histórico ao filtrar somente vendas', async () => {
    const api = mockHistoryApi();
    const user = userEvent.setup();

    renderApp('/clubs/7?tab=history');
    await screen.findByRole('table');
    await user.click(screen.getByRole('checkbox', { name: 'Compra' }));
    await screen.findByText('11,22');
    expect(screen.getByRole('option', { name: 'Renan Castro (#3)' })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Jogador do histórico'), '2');
    await waitFor(() =>
      expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2),
    );

    expect(
      api.mock.mock.calls.some(([url]) => {
        const query = new URL(String(url)).searchParams;

        return query.get('type') === 'VENDA' && query.get('player_id') === '2';
      }),
    ).toBe(true);
  });

  it('envia jogador excluído e mostra o message 404 sem remover a opção ou os filtros', async () => {
    mockHistoryApi({
      read: (url) =>
        url.searchParams.get('player_id') === '3'
          ? Response.json({ message: 'Jogador não encontrado.' }, { status: 404 })
          : Response.json(history),
    });

    const user = userEvent.setup();

    renderApp('/clubs/7?tab=history');
    await screen.findByRole('table');
    await user.selectOptions(screen.getByLabelText('Jogador do histórico'), '3');
    expect(await screen.findByRole('alert')).toHaveTextContent('Jogador não encontrado.');
    expect(screen.getByLabelText('Jogador do histórico')).toHaveValue('3');
    expect(screen.queryByLabelText('Totais filtrados devolvidos pela API')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('oferece CSV mesmo com histórico vazio e mostra totais zerados', async () => {
    mockHistoryApi({ read: () => Response.json({ data: [], summary: emptySummary }) });
    renderApp('/clubs/7?tab=history');
    expect(
      await screen.findByText('Nenhuma transação encontrada com os filtros aplicados.'),
    ).toBeInTheDocument();

    expect(
      within(screen.getByLabelText('Totais filtrados devolvidos pela API')).getAllByText('0,00'),
    ).toHaveLength(5);

    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled();
  });

  it('mostra carregamento e não inventa totais antes da resposta', async () => {
    mockHistoryApi({ read: () => new Promise<Response>(() => {}) });
    renderApp('/clubs/7?tab=history');
    expect(await screen.findByText('Carregando histórico de transações…')).toBeInTheDocument();
    expect(screen.queryByLabelText('Totais filtrados devolvidos pela API')).not.toBeInTheDocument();
  });

  it('permite recuperar a consulta sem repetir automaticamente', async () => {
    let failed = true;

    mockHistoryApi({
      read: () =>
        failed
          ? Response.json({ message: 'Falha ao consultar histórico.' }, { status: 500 })
          : Response.json(history),
    });

    const user = userEvent.setup();

    renderApp('/clubs/7?tab=history');
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao consultar histórico.');
    failed = false;
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('não envia type vazio quando nenhum tipo estiver marcado', async () => {
    const api = mockHistoryApi();
    const user = userEvent.setup();

    renderApp('/clubs/7?tab=history');
    await screen.findByRole('table');
    await user.click(screen.getByRole('checkbox', { name: 'Compra' }));
    await user.click(screen.getByRole('checkbox', { name: 'Venda' }));
    expect(screen.getByText('Sem tipo selecionado: exibindo todos os tipos.')).toBeInTheDocument();
    await waitFor(() =>
      expect(api.mock.mock.calls.some(([url]) => String(url).endsWith('/transactions'))).toBe(true),
    );
  });

  it('baixa o arquivo da API com os mesmos filtros e bloqueia o clique duplo', async () => {
    let resolve!: (response: Response) => void;
    const api = mockHistoryApi({
      exportFile: () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    });
    const download = mockDownload();
    const user = userEvent.setup();

    renderApp('/clubs/7?tab=history');
    await screen.findByRole('table');
    await user.click(screen.getByRole('checkbox', { name: 'Compra' }));
    await user.selectOptions(screen.getByLabelText('Jogador do histórico'), '2');
    const button = screen.getByRole('button', { name: 'Exportar CSV' });

    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(api.exports()).toHaveLength(1));
    expect(screen.getByRole('button', { name: 'Exportando…' })).toBeDisabled();
    expect(screen.getByLabelText('Jogador do histórico')).toBeDisabled();
    resolve(new Response(historyCsv, { headers: { 'Content-Type': 'text/csv' } }));
    expect(await screen.findByText('CSV exportado com os filtros aplicados.')).toBeInTheDocument();
    expect(download.saved[0].filename).toBe('historico-clube-7.csv');
    expect(await readTestBlob(download.create.mock.calls[0][0])).toBe(historyCsv);
    const params = new URL(String(api.exports()[0][0])).searchParams;

    expect(params.get('type')).toBe('VENDA');
    expect(params.get('player_id')).toBe('2');
  });

  it.each([400, 404])('mostra erro JSON %s do CSV sem baixar um arquivo', async (status) => {
    const api = mockHistoryApi({
      exportFile: () => Response.json({ message: 'Filtro recusado pela API.' }, { status }),
    });
    const download = mockDownload();
    const user = userEvent.setup();

    renderApp('/clubs/7?tab=history');
    await screen.findByRole('table');
    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Filtro recusado pela API.');
    expect(download.create).not.toHaveBeenCalled();
    expect(api.exports()).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled();
  });

  it('o comprovante da venda abre a aba Histórico', async () => {
    mockHistoryApi();
    const user = userEvent.setup();

    renderApp('/clubs/7');
    await user.click(await screen.findByRole('button', { name: 'Vender João Silva' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar venda' }));
    await screen.findByRole('dialog', { name: 'Venda concluída' });
    await user.click(screen.getByRole('button', { name: 'Ver histórico' }));
    expect(
      await screen.findByRole('table', { name: 'Histórico de transações' }),
    ).toBeInTheDocument();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
