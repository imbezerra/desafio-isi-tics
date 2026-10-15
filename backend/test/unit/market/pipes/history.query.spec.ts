import { BadRequestException } from '@nestjs/common';

import { HistoryQueryPipe } from '../../../../src/market/pipes/history.query';

describe('filtros de histórico conforme RN17 e RN18', () => {
  const pipe = new HistoryQueryPipe();

  it('combina tipos e jogador e ignora parâmetros desconhecidos', () => {
    expect(pipe.transform({ type: 'VENDA,COMPRA', player_id: '12', extra: 'x' })).toEqual({
      types: ['VENDA', 'COMPRA'],
      playerId: 12,
    });
    expect(pipe.transform({})).toEqual({ types: undefined, playerId: undefined });
  });

  it.each([
    { type: '' },
    { type: 'purchase' },
    { type: 'COMPRA,COMPRA' },
    { type: 'VENDA, COMPRA' },
    { type: 'VENDA,' },
    { type: ['VENDA'] },
    { player_id: '' },
    { player_id: '0' },
    { player_id: '-1' },
    { player_id: '01' },
    { player_id: '1.0' },
    { player_id: '1e2' },
    { player_id: ['1'] },
  ])('recusa filtro inválido: %j', (query) => {
    expect(() => pipe.transform(query)).toThrow(BadRequestException);
  });
});
