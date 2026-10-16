import { vi } from 'vitest';
import type { Club, Player } from '../../src/shared/api/contracts';
import type { PurchaseInput, PurchaseResult } from '../../src/features/market/purchases.api';
import { club, player, playerList } from '../fixtures/league.fixture';
import { purchase } from '../fixtures/purchase.fixture';

export function mockPurchaseApi({
  initialPlayers = [player],
  initialClubs = [club],
  write,
  detail,
  readClubs,
}: {
  initialPlayers?: Player[];
  initialClubs?: Club[];
  write?: (input: PurchaseInput) => Response | Promise<Response>;
  detail?: (id: number) => Response | Promise<Response>;
  readClubs?: () => Response | Promise<Response>;
} = {}) {
  let players = [...initialPlayers];
  let clubs = [...initialClubs];
  let saved: PurchaseResult | undefined;
  const mock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    const url = new URL(String(input));

    if (url.pathname.endsWith('/buy') && options?.method === 'POST') {
      const body = JSON.parse(String(options.body)) as PurchaseInput;
      const response = await (write?.(body) ?? Response.json(purchase));

      if (response.ok) {
        saved = (await response.clone().json()) as PurchaseResult;
        const result = saved;

        players = players.map((item) =>
          item.id === result.player_id ? { ...item, club_id: result.club_id } : item,
        );

        clubs = clubs.map((item) =>
          item.id === result.club_id
            ? {
                ...item,
                cash: result.club_cash,
                squad_value: 37.62,
                net_worth: 298.12,
              }
            : item,
        );
      }

      return response;
    }

    if (url.pathname === '/api/v1/players') {
      const free = url.searchParams.get('free');
      const clubId = url.searchParams.get('club_id');
      const search = url.searchParams.get('search');
      const filtered = players.filter(
        (item) =>
          (!free || (free === 'true' ? item.club_id === null : item.club_id !== null)) &&
          (!clubId || item.club_id === Number(clubId)) &&
          (!search || item.name.includes(search)),
      );
      const page = Number(url.searchParams.get('page') ?? 1);

      return Response.json(
        playerList(filtered.slice((page - 1) * 10, page * 10), page, filtered.length),
      );
    }

    if (/^\/api\/v1\/players\/\d+$/.test(url.pathname)) {
      const id = Number(url.pathname.split('/').at(-1));

      return detail?.(id) ?? Response.json(players.find((item) => item.id === id));
    }

    if (url.pathname === '/api/v1/clubs') return readClubs?.() ?? Response.json(clubs);

    if (/^\/api\/v1\/clubs\/\d+$/.test(url.pathname)) {
      const id = Number(url.pathname.split('/').at(-1));

      return Response.json({
        ...clubs.find((item) => item.id === id),
        players: players
          .filter((item) => item.club_id === id)
          .map((item) => ({
            ...item,
            contract: saved
              ? {
                  purchase_value: saved.contract.purchase_value,
                  loyalty_until: saved.contract.loyalty_until,
                  remaining_days: 144,
                  penalty_rate: 10,
                }
              : null,
          })),
      });
    }

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
