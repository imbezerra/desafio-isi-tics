import { vi } from 'vitest';
import { club, playerList } from '../fixtures/league.fixture';

export function mockApi(
  resolvePlayers: (url: URL) => Response = () => Response.json(playerList()),
) {
  const mock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));

    switch (url.pathname) {
      case '/api/v1/players':
        return resolvePlayers(url);
      case '/api/v1/clubs':
        return Response.json([club]);
      case '/api/v1/matches':
        return Response.json([]);
      case '/api/v1/standings':
        return Response.json([]);
      default:
        throw new Error(`Endpoint inesperado no teste: ${url}`);
    }
  });

  vi.stubGlobal('fetch', mock);

  return mock;
}
