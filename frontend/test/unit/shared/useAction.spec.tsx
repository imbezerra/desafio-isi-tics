import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useAction } from '../../../src/shared/hooks/useAction';

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient();

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('Bloqueio síncrono das ações de escrita', () => {
  it('impede duplicação mesmo antes da próxima renderização', async () => {
    let release!: (result: string) => void;
    const action = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        }),
    );
    const saved = vi.fn();
    const hook = renderHook(() => useAction(action, saved), { wrapper });

    act(() => {
      void hook.result.current.submit(undefined);
      void hook.result.current.submit(undefined);
    });

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    await act(async () => {
      release('ok');
    });

    expect(saved).toHaveBeenCalledExactlyOnceWith('ok');
  });

  it('não repete falhas automaticamente e libera uma tentativa explícita', async () => {
    const action = vi.fn().mockRejectedValue(new Error('Recusa da API.'));
    const saved = vi.fn();
    const hook = renderHook(() => useAction(action, saved), { wrapper });

    await act(async () => {
      await hook.result.current.submit(undefined);
    });

    await waitFor(() => expect(hook.result.current.error).toBe('Recusa da API.'));
    expect(action).toHaveBeenCalledTimes(1);
    expect(saved).not.toHaveBeenCalled();
    await act(async () => {
      await hook.result.current.submit(undefined);
    });

    expect(action).toHaveBeenCalledTimes(2);
  });
});
