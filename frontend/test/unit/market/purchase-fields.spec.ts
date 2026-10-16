import { describe, expect, it } from 'vitest';
import {
  toPurchaseInput,
  validatePurchaseForm,
} from '../../../src/features/market/purchase-fields';

const values = { clubId: '7', date: '02/03/2027', time: '10:15' };

describe('Campos da compra', () => {
  it('valida os três campos obrigatórios', () => {
    expect(Object.keys(validatePurchaseForm({ clubId: '', date: '', time: '' }))).toEqual([
      'clubId',
      'date',
      'time',
    ]);
  });

  it.each(['0', '-1', '1.5', '01', 'abc', '2147483648'])('recusa id inválido: %s', (clubId) => {
    expect(validatePurchaseForm({ ...values, clubId })).toHaveProperty('clubId');
  });

  it.each([
    '31/02/2027',
    '29/02/2027',
    '29/02/1900',
    '00/03/2027',
    '02/13/2027',
    '2027-03-02',
    '2/3/2027',
    '02/03/0000',
  ])('recusa data inválida sem ajustá-la: %s', (date) => {
    expect(validatePurchaseForm({ ...values, date })).toHaveProperty('date');
  });

  it.each(['29/02/2028', '29/02/2000', '31/12/2027'])('aceita uma data real: %s', (date) => {
    expect(validatePurchaseForm({ ...values, date })).toEqual({});
  });

  it.each(['24:00', '12:60', '-1:00', '1:05', '12:00Z', ' 12:00'])(
    'recusa hora inválida: %s',
    (time) => {
      expect(validatePurchaseForm({ ...values, time })).toHaveProperty('time');
    },
  );

  it.each(['00:00', '23:59'])('aceita hora no limite: %s', (time) => {
    expect(validatePurchaseForm({ ...values, time })).toEqual({});
  });

  it('monta apenas id numérico e fidelidade com -03:00, sem converter pelo fuso local', () => {
    expect(toPurchaseInput(values)).toEqual({
      club_id: 7,
      loyalty_until: '2027-03-02T10:15-03:00',
    });
  });

  it.each(['01/01/2020', '01/01/2099'])(
    'deixa limites dependentes do momento para a API: %s',
    (date) => {
      expect(validatePurchaseForm({ ...values, date })).toEqual({});
    },
  );
});
