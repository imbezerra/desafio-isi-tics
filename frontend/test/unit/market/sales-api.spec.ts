import { describe, expect, it, vi } from 'vitest';
import { sellPlayer } from '../../../src/features/market/sales.api';
import { sale } from '../../fixtures/sale.fixture';

describe('Contrato HTTP de venda', () => {
  it('envia POST sem corpo, clube ou valores calculados', async () => {
    const mock = vi.fn().mockResolvedValue(Response.json(sale));

    vi.stubGlobal('fetch', mock);
    expect(await sellPlayer(1)).toEqual(sale);
    expect(mock).toHaveBeenCalledWith('http://localhost:3000/api/v1/players/1/sell', {
      method: 'POST',
    });
  });

  it.each([404, 409])('preserva status %s e mensagem exata da API', async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ message: 'Recusa exata da venda.' }, { status })),
    );

    await expect(sellPlayer(1)).rejects.toMatchObject({
      status,
      message: 'Recusa exata da venda.',
    });
  });
});
