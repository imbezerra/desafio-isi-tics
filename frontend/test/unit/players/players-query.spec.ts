import { describe, expect, it } from 'vitest';
import { buildPlayersQuery, initialFilters } from '../../../src/features/players/players.api';

describe('Consulta de jogadores', () => {
  it('envia paginação de dez itens e ordenação para a API', () => {
    const params = new URLSearchParams(buildPlayersQuery(initialFilters, 2));

    expect(Object.fromEntries(params)).toEqual({ page: '2', limit: '10', sort: 'name' });
  });

  it('envia filtros combinados com os nomes obrigatórios do contrato', () => {
    const params = new URLSearchParams(
      buildPlayersQuery(
        {
          ...initialFilters,
          search: ' João ',
          position: 'MEI',
          condition: 'APTO',
          clubId: '7',
          minAge: '16',
          maxAge: '25',
          minValue: '20.50',
          maxValue: '100',
          sort: 'value_desc',
        },
        1,
      ),
    );

    expect(Object.fromEntries(params)).toEqual({
      page: '1',
      limit: '10',
      search: 'João',
      position: 'MEI',
      condition: 'APTO',
      club_id: '7',
      min_age: '16',
      max_age: '25',
      min_value: '20.50',
      max_value: '100',
      sort: 'value_desc',
    });
  });

  it('normaliza somente espaços U+0020 na busca', () => {
    const params = new URLSearchParams(
      buildPlayersQuery({ ...initialFilters, search: '  João   Silva  ' }, 1),
    );

    expect(params.get('search')).toBe('João Silva');
  });

  it.each(['\tJoão', 'João\t', '\u00a0João\u00a0'])(
    'não remove caracteres diferentes de U+0020 na busca: %j',
    (search) => {
      expect(
        new URLSearchParams(buildPlayersQuery({ ...initialFilters, search }, 1)).get('search'),
      ).toBe(search);
    },
  );

  it.each(['true', 'false'])('não perde o filtro free=%s', (free) => {
    expect(new URLSearchParams(buildPlayersQuery({ ...initialFilters, free }, 1)).get('free')).toBe(
      free,
    );
  });
});
