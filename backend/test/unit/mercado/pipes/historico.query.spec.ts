import { BadRequestException } from '@nestjs/common';

import { ConsultaHistoricoPipe } from '../../../../src/mercado/pipes/historico.query';

describe('filtros de histórico conforme RN17 e RN18', () => {
  const pipe = new ConsultaHistoricoPipe();

  it('combina tipos e jogador e ignora parâmetros desconhecidos', () => {
    expect(pipe.transform({ type: 'VENDA,COMPRA', player_id: '12', extra: 'x' })).toEqual({
      tipos: ['VENDA', 'COMPRA'],
      jogadorId: 12,
    });
    expect(pipe.transform({})).toEqual({ tipos: undefined, jogadorId: undefined });
  });

  it.each([
    { type: '' },
    { type: 'compra' },
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
  ])('recusa filtro inválido: %j', (consulta) => {
    expect(() => pipe.transform(consulta)).toThrow(BadRequestException);
  });
});
