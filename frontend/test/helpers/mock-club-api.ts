import { vi } from 'vitest';
import type { Club } from '../../src/shared/api/contracts';
import type { CreateClubInput } from '../../src/features/clubs/clubs.api';
import { club, playerList } from '../fixtures/league.fixture';

export function mockClubApi({
  initial = [club],
  read,
  create,
  detail,
}: {
  initial?: Club[];
  read?: (sort: string, clubs: Club[]) => Response | Promise<Response>;
  create?: (input: CreateClubInput) => Response | Promise<Response> | undefined;
  detail?: (id: string) => Response | Promise<Response>;
} = {}) {
  const clubs = [...initial];
  const mock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    const url = new URL(String(input));

    if (/^\/api\/v1\/clubs\/[^/]+$/.test(url.pathname))
      return (
        detail?.(decodeURIComponent(url.pathname.split('/').at(-1)!)) ??
        Response.json({ ...club, players: [] })
      );

    if (url.pathname === '/api/v1/clubs') {
      if (options?.method === 'POST') {
        const body = JSON.parse(String(options.body)) as CreateClubInput;
        const intercepted = create?.(body);

        if (intercepted) return intercepted;

        const created = { id: 99, ...body, cash: 300, squad_value: 0, net_worth: 300 };

        clubs.push(created);

        return Response.json(created, { status: 201 });
      }

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
    writes: () => mock.mock.calls.filter(([, options]) => options?.method === 'POST'),
  };
}
