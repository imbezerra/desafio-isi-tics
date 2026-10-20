import { describe, expect, it, vi } from 'vitest';
import { getLineup, saveLineup } from '../../../src/features/lineups/lineups.api';
import { completeLineup } from '../../fixtures/lineup.fixture';

describe('Contrato HTTP da escalação', () => {
  it('consulta o id codificado, sem query params, encaminhando o cancelamento', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(completeLineup));
    const controller = new AbortController();

    vi.stubGlobal('fetch', fetch);
    expect(await getLineup('7/8', controller.signal)).toEqual(completeLineup);
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/clubs/7%2F8/lineup', {
      signal: controller.signal,
    });
  });

  it('envia somente formation e player_ids e preserva a ordem da resposta', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(completeLineup));
    const input = { formation: '2-1-1' as const, player_ids: [5, 4, 3, 2, 1] };

    vi.stubGlobal('fetch', fetch);
    expect(await saveLineup('7', input)).toEqual(completeLineup);
    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/v1/clubs/7/lineup', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  });
});
