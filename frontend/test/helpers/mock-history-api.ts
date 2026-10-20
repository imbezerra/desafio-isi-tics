import { vi } from 'vitest';
import type { Club } from '../../src/shared/api/contracts';
import { club, clubDetails } from '../fixtures/league.fixture';
import { emptySummary, history, historyCsv } from '../fixtures/history.fixture';
import { mockClubApi } from './mock-club-api';
import { sale } from '../fixtures/sale.fixture';

export function mockHistoryApi({
  read,
  exportFile,
  clubs = [club],
}: {
  read?: (url: URL) => Response | Promise<Response>;
  exportFile?: (url: URL) => Response | Promise<Response>;
  clubs?: Club[];
} = {}) {
  const base = mockClubApi({
    initial: clubs,
    detail: (id) =>
      Response.json({ ...clubDetails, ...clubs.find((item) => String(item.id) === id) }),
  });
  const mock = vi.fn(async (input: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    const url = new URL(String(input));

    if (url.pathname.endsWith('/transactions/export'))
      return (
        exportFile?.(url) ?? new Response(historyCsv, { headers: { 'Content-Type': 'text/csv' } })
      );

    if (url.pathname.endsWith('/transactions')) {
      if (read) return read(url);
      const data = history.data.filter(
        (transaction) =>
          (!url.searchParams.has('type') ||
            url.searchParams.get('type')!.split(',').includes(transaction.type)) &&
          (!url.searchParams.has('player_id') ||
            String(transaction.player_id) === url.searchParams.get('player_id')),
      );

      return Response.json({
        data,
        summary: data.length
          ? url.searchParams.get('type') === 'VENDA'
            ? { ...emptySummary, total_received: 11.22, total_profit: 3.45 }
            : history.summary
          : emptySummary,
      });
    }

    if (url.pathname.endsWith('/sell')) return Response.json(sale);

    return base.mock(input, options);
  });

  vi.stubGlobal('fetch', mock);

  return {
    mock,
    exports: () => mock.mock.calls.filter(([url]) => String(url).includes('/transactions/export')),
  };
}
