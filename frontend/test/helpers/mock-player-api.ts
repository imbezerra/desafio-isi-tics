import { vi } from 'vitest';
import type { Player } from '../../src/shared/api/contracts';
import { club, player, playerList } from '../fixtures/league.fixture';

type WriteHandler = (
  method: string,
  path: string,
  body: Record<string, unknown>,
) => Response | Promise<Response> | undefined;

export function mockPlayerApi({
  initial = [player],
  write,
  detail,
}: {
  initial?: Player[];
  write?: WriteHandler;
  detail?: () => Response;
} = {}) {
  let players = [...initial];
  const mock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    const url = new URL(String(input));
    const path = url.pathname;
    const method = options?.method ?? 'GET';
    const body = options?.body ? (JSON.parse(String(options.body)) as Record<string, unknown>) : {};

    if (method !== 'GET') {
      const intercepted = write?.(method, path, body);

      if (intercepted) return intercepted;

      if (method === 'POST') {
        const created: Player = {
          ...player,
          ...body,
          id: 99,
          base_value: 42.17,
          overall: 79,
          market_value: 47.89,
        };

        players.push(created);

        return Response.json(created, { status: 201 });
      }

      const id = Number(path.split('/')[4]);
      const current = players.find((item) => item.id === id);

      if (!current) return Response.json({ message: 'Jogador não encontrado.' }, { status: 404 });

      if (method === 'DELETE') {
        players = players.filter((item) => item.id !== id);

        return new Response(null, { status: 204 });
      }

      const updated: Player = { ...current, ...body, market_value: 29.43 };

      players = players.map((item) => (item.id === id ? updated : item));

      return Response.json(updated);
    }

    if (path === '/api/v1/players') {
      const search = url.searchParams.get('search') ?? '';
      const condition = url.searchParams.get('condition');
      const filtered = players.filter(
        (item) => item.name.includes(search) && (!condition || item.condition === condition),
      );
      const page = Number(url.searchParams.get('page') ?? 1);

      return Response.json(
        playerList(filtered.slice((page - 1) * 10, page * 10), page, filtered.length),
      );
    }

    if (path.startsWith('/api/v1/players/')) {
      const current = players.find((item) => item.id === Number(path.split('/')[4]));

      return (
        detail?.() ??
        (current
          ? Response.json(current)
          : Response.json({ message: 'Jogador não encontrado.' }, { status: 404 }))
      );
    }

    if (path === '/api/v1/clubs') return Response.json([club]);

    if (path === '/api/v1/matches' || path === '/api/v1/standings') return Response.json([]);

    throw new Error(`Endpoint inesperado no teste: ${url}`);
  });

  vi.stubGlobal('fetch', mock);

  function writes(method: string) {
    return mock.mock.calls.filter(([, options]) => options?.method === method);
  }

  return { mock, writes };
}
