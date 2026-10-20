import { describe, expect, it, vi } from 'vitest';
import { getMatch, getMatches, playMatch } from '../../../src/features/matches/matches.api';
import { getStandings } from '../../../src/features/standings/standings.api';
import { match, standings } from '../../fixtures/match.fixture';

describe('Contratos HTTP de partidas e classificação', () => {
  it('omite filtro vazio e envia club_id codificado com sinal de cancelamento', async () => {
    const fetch = vi.fn().mockImplementation(async () => Response.json([match]));
    const controller = new AbortController();

    vi.stubGlobal('fetch', fetch);
    await getMatches('', controller.signal);
    expect(fetch).toHaveBeenLastCalledWith('http://localhost:3000/api/v1/matches', {
      signal: controller.signal,
    });

    await getMatches('7&8', controller.signal);
    expect(fetch).toHaveBeenLastCalledWith('http://localhost:3000/api/v1/matches?club_id=7%268', {
      signal: controller.signal,
    });
  });

  it('consulta o detalhe pelo id codificado e preserva todos os duelos', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(match));

    vi.stubGlobal('fetch', fetch);
    expect(await getMatch('42/7')).toEqual(match);
    expect(fetch).toHaveBeenLastCalledWith('http://localhost:3000/api/v1/matches/42%2F7', {
      signal: undefined,
    });
  });

  it('envia POST com somente os ids e recebe o resultado completo', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(match, { status: 201 }));
    const input = { home_club_id: 7, away_club_id: 8 };

    vi.stubGlobal('fetch', fetch);
    expect(await playMatch(input)).toEqual(match);
    expect(fetch).toHaveBeenLastCalledWith('http://localhost:3000/api/v1/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  });

  it.each([400, 404, 409])(
    'preserva o status %s e o message de recusa da partida',
    async (status) => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(Response.json({ message: 'Recusa exata do servidor.' }, { status })),
      );

      await expect(playMatch({ home_club_id: 7, away_club_id: 8 })).rejects.toMatchObject({
        status,
        message: 'Recusa exata do servidor.',
      });
    },
  );

  it('consulta a classificação sem parâmetros e preserva a ordem e todos os campos', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json(standings));
    const controller = new AbortController();

    vi.stubGlobal('fetch', fetch);
    expect(await getStandings(controller.signal)).toEqual(standings);
    expect(fetch).toHaveBeenLastCalledWith('http://localhost:3000/api/v1/standings', {
      signal: controller.signal,
    });
  });
});
