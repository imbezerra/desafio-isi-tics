import { describe, expect, it, vi } from 'vitest';
import { buyPlayer } from '../../../src/features/market/purchases.api';
import { purchase } from '../../fixtures/purchase.fixture';

describe('Contrato HTTP de compra', () => {
  const input = { club_id: 7, loyalty_until: '2027-03-02T10:15-03:00' };

  it('envia POST com apenas clube e fidelidade e preserva o resultado da API', async () => {
    const mock = vi.fn().mockResolvedValue(Response.json(purchase));

    vi.stubGlobal('fetch', mock);
    expect(await buyPlayer(1, input)).toEqual(purchase);
    expect(mock).toHaveBeenCalledWith('http://localhost:3000/api/v1/players/1/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  });

  it.each([400, 404, 409])('preserva status %s e mensagem de recusa', async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ message: 'Recusa exata da API.' }, { status })),
    );

    await expect(buyPlayer(1, input)).rejects.toMatchObject({
      status,
      message: 'Recusa exata da API.',
    });
  });
});
