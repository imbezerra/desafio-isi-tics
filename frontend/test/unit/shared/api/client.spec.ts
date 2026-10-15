import { describe, expect, it, vi } from 'vitest';
import { apiGet, apiWrite, ApiError } from '../../../../src/shared/api/client';

describe('Cliente HTTP centralizado', () => {
  it('não tenta ler JSON na exclusão 204 sem corpo', async () => {
    const response = new Response(null, { status: 204 });
    const json = vi.spyOn(response, 'json');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    await expect(apiWrite<void>('DELETE', '/players/1')).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it('envia escrita JSON com o método e cabeçalho corretos', async () => {
    const mock = vi.fn().mockResolvedValue(Response.json({ id: 1 }));

    vi.stubGlobal('fetch', mock);
    await apiWrite('PATCH', '/players/1/condition', { condition: 'DOENTE' });
    expect(mock).toHaveBeenCalledWith('http://localhost:3000/api/v1/players/1/condition', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{"condition":"DOENTE"}',
    });
  });

  it('usa a origem configurada e o prefixo da API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: [] }));

    vi.stubGlobal('fetch', fetchMock);
    const signal = new AbortController().signal;

    expect(await apiGet('/players', signal)).toEqual({ data: [] });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/v1/players', { signal });
  });

  it.each([400, 404, 409, 500])('preserva o message da API no status %i', async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ message: 'Mensagem exata da API.' }, { status })),
    );

    await expect(apiGet('/players')).rejects.toMatchObject({
      message: 'Mensagem exata da API.',
      status,
    });
  });

  it('explica falha de rede sem inventar uma resposta da API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(apiGet('/players')).rejects.toBeInstanceOf(ApiError);
    await expect(apiGet('/players')).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('conectar à API'),
    });
  });

  it('mantém o cancelamento da consulta sem convertê-lo em erro de rede', async () => {
    const controller = new AbortController();

    controller.abort();
    const error = new DOMException('Consulta cancelada', 'AbortError');

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
    await expect(apiGet('/players', controller.signal)).rejects.toBe(error);
  });
});
