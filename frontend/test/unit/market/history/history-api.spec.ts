import { describe, expect, it, vi } from 'vitest';
import {
  buildHistoryQuery,
  getHistory,
  getHistoryCsv,
} from '../../../../src/features/market/history/history.api';
import { history, historyCsv } from '../../../fixtures/history.fixture';
import { readTestBlob } from '../../../helpers/read-blob';

describe('Contrato HTTP do histórico e CSV', () => {
  it('não envia parâmetros vazios', () =>
    expect(buildHistoryQuery({ types: [], playerId: '' })).toBe(''));

  it('envia múltiplos tipos sem repetir parâmetros e mantém o jogador', () => {
    const query = new URLSearchParams(
      buildHistoryQuery({ types: ['COMPRA', 'VENDA'], playerId: '23' }),
    );

    expect(query.getAll('type')).toEqual(['COMPRA,VENDA']);
    expect(query.get('player_id')).toBe('23');
  });

  it('preserva ordem, totais e cancelamento da consulta', async () => {
    const mock = vi.fn().mockResolvedValue(Response.json(history));

    vi.stubGlobal('fetch', mock);
    const signal = new AbortController().signal;

    expect(await getHistory('7', { types: ['VENDA'], playerId: '2' }, signal)).toEqual(history);
    expect(mock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/clubs/7/transactions?type=VENDA&player_id=2',
      { signal },
    );
  });

  it('baixa os bytes do CSV sem gerar BOM ou reformatar o texto', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(new Response(historyCsv, { headers: { 'Content-Type': 'text/csv' } }));

    vi.stubGlobal('fetch', mock);
    const blob = await getHistoryCsv('7', { types: ['VENDA'], playerId: '2' });

    expect(await readTestBlob(blob)).toBe(historyCsv);
    expect(mock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/clubs/7/transactions/export?type=VENDA&player_id=2',
      { signal: undefined },
    );
  });

  it.each([400, 404, 500])(
    'preserva o erro JSON %s na exportação sem tentar baixar um arquivo',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(Response.json({ message: 'Jogador não encontrado.' }, { status })),
      );

      await expect(getHistoryCsv('7', { types: [], playerId: '2' })).rejects.toMatchObject({
        status,
        message: 'Jogador não encontrado.',
      });
    },
  );
});
