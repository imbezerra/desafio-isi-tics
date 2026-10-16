import { describe, expect, it, vi } from 'vitest';
import { getClubs } from '../../../src/features/clubs/clubs.api';
import { club } from '../../fixtures/league.fixture';

describe('Contrato HTTP de clubes', () => {
  it.each(['name', 'net_worth_asc', 'net_worth_desc'] as const)(
    'envia sort=%s e o sinal de cancelamento',
    async (sort) => {
      const mock = vi.fn().mockResolvedValue(Response.json([club]));
      const signal = new AbortController().signal;

      vi.stubGlobal('fetch', mock);
      expect(await getClubs(sort, signal)).toEqual([club]);
      expect(mock).toHaveBeenCalledWith(`http://localhost:3000/api/v1/clubs?sort=${sort}`, {
        signal,
      });
    },
  );

  it('usa nome por padrão', async () => {
    const mock = vi.fn().mockResolvedValue(Response.json([]));

    vi.stubGlobal('fetch', mock);
    await getClubs();
    expect(mock).toHaveBeenCalledWith('http://localhost:3000/api/v1/clubs?sort=name', {
      signal: undefined,
    });
  });
});
