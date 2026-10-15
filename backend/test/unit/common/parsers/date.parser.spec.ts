import { BadRequestException } from '@nestjs/common';

import {
  formatBrasiliaDateTime,
  parseBrasiliaDateTime,
} from '../../../../src/common/parsers/date.parser';

describe('datas no horário de Brasília', () => {
  it('aceita o formato estrito e preserva o instante', () => {
    const data = parseBrasiliaDateTime('2027-03-02T21:15-03:00');

    expect(formatBrasiliaDateTime(data)).toBe('2027-03-02T21:15:00-03:00');
  });

  it('recusa formatos e datas inexistentes', () => {
    expect(() => parseBrasiliaDateTime('2027-03-02T10:15Z')).toThrow(BadRequestException);
    expect(() => parseBrasiliaDateTime('2027-02-30T10:15-03:00')).toThrow(BadRequestException);
  });
});
