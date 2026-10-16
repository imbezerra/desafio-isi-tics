import { describe, expect, it, vi } from 'vitest';
import { createClub, getClub, getClubs } from '../../../src/features/clubs/clubs.api';
import { club, clubDetails } from '../../fixtures/league.fixture';

describe('Contrato HTTP de clubes', () => {
  it('consulta o clube completo sem query params e permite cancelar a requisição', async () => {
    const mock = vi.fn().mockResolvedValue(Response.json(clubDetails));
    const signal = new AbortController().signal;

    vi.stubGlobal('fetch', mock);
    expect(await getClub('7', signal)).toEqual(clubDetails);
    expect(mock).toHaveBeenCalledWith('http://localhost:3000/api/v1/clubs/7', { signal });
  });

  it('não transforma o id nem bloqueia a recusa da API', async () => {
    const mock = vi
      .fn()
      .mockResolvedValue(Response.json({ message: 'Recurso não encontrado.' }, { status: 404 }));

    vi.stubGlobal('fetch', mock);
    await expect(getClub('007')).rejects.toMatchObject({
      status: 404,
      message: 'Recurso não encontrado.',
    });

    expect(mock).toHaveBeenCalledWith('http://localhost:3000/api/v1/clubs/007', {
      signal: undefined,
    });
  });

  it('codifica o segmento do id sem criar parâmetros de consulta', async () => {
    const mock = vi.fn().mockResolvedValue(Response.json(clubDetails));

    vi.stubGlobal('fetch', mock);
    await getClub('7?sort=name');
    expect(mock).toHaveBeenCalledWith('http://localhost:3000/api/v1/clubs/7%3Fsort%3Dname', {
      signal: undefined,
    });
  });

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

  it('envia somente o contrato de criação, sem valores financeiros', async () => {
    const mock = vi.fn().mockResolvedValue(Response.json(club, { status: 201 }));

    vi.stubGlobal('fetch', mock);
    expect(await createClub({ name: 'Águias FC', acronym: 'AGU' })).toEqual(club);
    expect(mock).toHaveBeenCalledWith('http://localhost:3000/api/v1/clubs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"Águias FC","acronym":"AGU"}',
    });
  });
});
