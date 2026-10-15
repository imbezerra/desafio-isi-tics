import { BadRequestException } from '@nestjs/common';

import { PurchaseInputPipe } from '../../../../src/market/pipes/purchase.input';

describe('entrada de compra conforme V1–V7 e RN01', () => {
  const pipe = new PurchaseInputPipe();

  it('aceita formato de Brasília e ignora campos extras', () => {
    expect(
      pipe.transform({ club_id: 1, loyalty_until: '2027-03-02T10:15-03:00', cash: 999 }),
    ).toEqual({ clubId: 1, loyaltyUntil: new Date('2027-03-02T13:15:00Z') });
  });

  it.each([
    null,
    [],
    { loyalty_until: '2027-03-02T10:15-03:00' },
    { club_id: '1', loyalty_until: '2027-03-02T10:15-03:00' },
    { club_id: 0, loyalty_until: '2027-03-02T10:15-03:00' },
    { club_id: 1, loyaltyUntil: '2027-03-02T10:15-03:00' },
    { club_id: 1, loyalty_until: '2027-02-30T10:15-03:00' },
    { club_id: 1, loyalty_until: '2027-03-02T10:15:00-03:00' },
  ])('recusa entrada inválida: %j', (value) => {
    expect(() => pipe.transform(value)).toThrow(BadRequestException);
  });
});
