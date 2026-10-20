import { vi } from 'vitest';
import type { ClubDetails } from '../../src/shared/api/contracts';
import { clubDetails, playerList } from '../fixtures/league.fixture';
import { sale } from '../fixtures/sale.fixture';

export function mockSaleApi({
  initial = clubDetails,
  write,
  detail,
}: {
  initial?: ClubDetails;
  write?: () => Response | Promise<Response>;
  detail?: (club: ClubDetails) => Response | Promise<Response>;
} = {}) {
  let club = structuredClone(initial);
  const originalPlayers = [...club.players];
  const mock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    const url = new URL(String(input));

    if (url.pathname.endsWith('/sell') && options?.method === 'POST') {
      const response = await (write?.() ?? Response.json(sale));

      if (response.ok) {
        club = { ...club, cash: 296.85, squad_value: 0, net_worth: 296.85, players: [] };
      }

      return response;
    }

    if (/^\/api\/v1\/clubs\/\d+$/.test(url.pathname)) return detail?.(club) ?? Response.json(club);

    if (url.pathname === '/api/v1/clubs') return Response.json([club]);

    if (url.pathname === '/api/v1/players')
      return Response.json(
        playerList(
          originalPlayers.map((player) => ({
            ...player,
            club_id: club.players.length ? club.id : null,
          })),
        ),
      );

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
