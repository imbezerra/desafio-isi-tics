import { describe, expect, it } from 'vitest';
import { queryClient } from '../../../src/app/query-client';

describe('Configuração central das consultas', () => {
  it('define cache de trinta segundos e desativa novas tentativas automáticas', () => {
    expect(queryClient.getDefaultOptions().queries).toMatchObject({
      retry: false,
      staleTime: 30_000,
    });
  });
});
