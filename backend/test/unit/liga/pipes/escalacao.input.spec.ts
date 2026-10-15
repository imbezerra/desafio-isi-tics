import { BadRequestException } from '@nestjs/common';

import { EscalacaoInputPipe } from '../../../../src/liga/pipes/escalacao.input';

describe('entrada da escalação conforme RN19 e V1–V7', () => {
  const pipe = new EscalacaoInputPipe();

  it('aceita cinco ids distintos fora de ordem e ignora campos extras', () => {
    expect(pipe.transform({ formation: '2-1-1', player_ids: [5, 4, 3, 2, 1], cash: 0 })).toEqual({
      formacao: '2-1-1',
      jogadoresIds: [5, 4, 3, 2, 1],
    });
  });

  it.each([
    null,
    [],
    { formation: '2-1-1' },
    { player_ids: [1, 2, 3, 4, 5] },
    { formation: '4-0', player_ids: [1, 2, 3, 4, 5] },
    { formation: '2-1-1', playerIds: [1, 2, 3, 4, 5] },
    { formation: '2-1-1', player_ids: '1,2,3,4,5' },
    { formation: '2-1-1', player_ids: [1, 2, 3, 4] },
    { formation: '2-1-1', player_ids: [1, 2, 3, 4, 4] },
    { formation: '2-1-1', player_ids: [1, 2, 3, 4, '5'] },
    { formation: '2-1-1', player_ids: [1, 2, 3, 4, 0] },
    { formation: '2-1-1', player_ids: [1, 2, 3, 4, 1.5] },
    { formation: '2-1-1', player_ids: [1, 2, 3, 4, null] },
  ])('recusa entrada inválida: %j', (valor) => {
    expect(() => pipe.transform(valor)).toThrow(BadRequestException);
  });
});
