import { vi } from 'vitest';
import type { MatchSummary, Standing } from '../../src/shared/api/contracts';
import type { MatchDetails, MatchInput } from '../../src/features/matches/matches.api';
import { leagueClubs, match, standings } from '../fixtures/match.fixture';
import { mockClubApi } from './mock-club-api';

export function mockLeagueApi({
  initial = [match],
  readList,
  readDetail,
  readStandings,
  write,
}: {
  initial?: MatchSummary[];
  readList?: (clubId: string) => Response | Promise<Response>;
  readDetail?: (id: string) => Response | Promise<Response>;
  readStandings?: () => Response | Promise<Response>;
  write?: (input: MatchInput) => Response | Promise<Response>;
} = {}) {
  const base = mockClubApi({ initial: leagueClubs });
  const matches = [...initial];
  const mock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    const url = new URL(String(input));

    if (url.pathname === '/api/v1/matches') {
      if (options?.method === 'POST') {
        const body = JSON.parse(String(options.body)) as MatchInput;
        const response = write ? await write(body) : Response.json(match, { status: 201 });

        if (response.ok) matches.unshift((await response.clone().json()) as MatchDetails);

        return response;
      }

      const clubId = url.searchParams.get('club_id') ?? '';

      return (
        readList?.(clubId) ??
        Response.json(
          clubId
            ? matches.filter((item) =>
                [String(item.home.club_id), String(item.away.club_id)].includes(clubId),
              )
            : matches,
        )
      );
    }

    if (url.pathname.startsWith('/api/v1/matches/'))
      return (
        readDetail?.(decodeURIComponent(url.pathname.split('/').at(-1)!)) ?? Response.json(match)
      );

    if (url.pathname === '/api/v1/standings')
      return readStandings?.() ?? Response.json(standings satisfies Standing[]);

    return base.mock(input, options);
  });

  vi.stubGlobal('fetch', mock);

  return {
    mock,
    writes: () => mock.mock.calls.filter(([, options]) => options?.method === 'POST'),
  };
}
