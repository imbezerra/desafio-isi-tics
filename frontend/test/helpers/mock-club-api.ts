import { vi } from 'vitest';
import type { Club } from '../../src/shared/api/contracts';
import { club, playerList } from '../fixtures/league.fixture';

export function mockClubApi({
  initial = [club],
  read,
}: {
  initial?: Club[];
  read?: (sort: string, clubs: Club[]) => Response | Promise<Response>;
} = {}) {
  const clubs = [...initial];
  const mock = vi.fn(async (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(String(input));

    if (url.pathname === '/api/v1/clubs') {
      return read?.(url.searchParams.get('sort') ?? '', clubs) ?? Response.json(clubs);
    }

    if (url.pathname === '/api/v1/players') return Response.json(playerList());

    if (url.pathname === '/api/v1/matches' || url.pathname === '/api/v1/standings')
      return Response.json([]);

    throw new Error(`Endpoint inesperado no teste: ${url}`);
  });

  vi.stubGlobal('fetch', mock);

  return {
    mock,
  };
}
