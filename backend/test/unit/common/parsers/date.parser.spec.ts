import { BadRequestException } from '@nestjs/common';

import {
  formatBrasiliaDateTime,
  parseBrasiliaDateTime,
} from '../../../../src/common/parsers/date.parser';

describe('datas no horário de Brasília', () => {
  it('aceita o formato estrito e preserva o instante', () => {
    const date = parseBrasiliaDateTime('2027-03-02T21:15-03:00');

    expect(formatBrasiliaDateTime(date)).toBe('2027-03-02T21:15:00-03:00');
  });

  it('recusa formatos e datas inexistentes', () => {
    expect(() => parseBrasiliaDateTime('2027-03-02T10:15Z')).toThrow(BadRequestException);
    expect(() => parseBrasiliaDateTime('2027-02-30T10:15-03:00')).toThrow(BadRequestException);
  });

  it.each(['2018-12-01T10:15-03:00', '2018-11-04T00:00-03:00'])(
    'usa o UTC−3 fixo da RN01, sem aplicar horário de verão histórico: %s',
    (value) => {
      const date = parseBrasiliaDateTime(value);

      expect(date.toISOString()).toBe(new Date(value).toISOString());
      expect(formatBrasiliaDateTime(date)).toBe(value.replace('-03:00', ':00-03:00'));
    },
  );

  it('preserva a virada de dia no UTC−3 e apresenta meia-noite como 00', () => {
    expect(formatBrasiliaDateTime(new Date('2027-01-01T02:59:59Z'))).toBe(
      '2026-12-31T23:59:59-03:00',
    );
    expect(formatBrasiliaDateTime(new Date('2027-01-01T03:00:00Z'))).toBe(
      '2027-01-01T00:00:00-03:00',
    );
  });
});
