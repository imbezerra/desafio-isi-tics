import { vi } from 'vitest';
import type { Lineup, LineupInput } from '../../src/features/lineups/lineups.api';
import { completeLineup, lineupClub, lineupPlayers } from '../fixtures/lineup.fixture';
import { mockClubApi } from './mock-club-api';

export function mockLineupApi({
  initial = completeLineup,
  read,
  write,
}: {
  initial?: Lineup;
  read?: (clubId: string) => Response | Promise<Response>;
  write?: (input: LineupInput) => Response | Promise<Response>;
} = {}) {
  const base = mockClubApi({ detail: () => Response.json(lineupClub) });
  let current = initial;
  const mock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit) => {
    const url = new URL(String(input));

    if (url.pathname.endsWith('/lineup')) {
      if (options?.method === 'PUT') {
        const body = JSON.parse(String(options.body)) as LineupInput;

        if (write) return write(body);
        current = {
          club_id: 7,
          formation: body.formation,
          complete: true,
          players: lineupPlayers.filter((player) => body.player_ids.includes(player.id)),
        };

        return Response.json(current);
      }

      return read?.(url.pathname.split('/').at(-2)!) ?? Response.json(current);
    }

    return base.mock(input, options);
  });

  vi.stubGlobal('fetch', mock);

  return { mock, writes: () => mock.mock.calls.filter(([, options]) => options?.method === 'PUT') };
}
