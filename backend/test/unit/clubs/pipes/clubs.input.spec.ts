import { BadRequestException } from '@nestjs/common';

import { CreateClubPipe } from '../../../../src/clubs/pipes/clubs.input';
import { ClubsQueryPipe } from '../../../../src/clubs/pipes/clubs.query';

describe('validação de clubes conforme V4 e RN10', () => {
  const registration = new CreateClubPipe();

  it('normaliza o nome e ignora campos controlados pelo sistema', () => {
    expect(
      registration.transform({ name: '  Águias   FC  ', acronym: 'AGU', cash: 1, players: [] }),
    ).toEqual({ name: 'Águias FC', acronym: 'AGU' });
  });

  it.each([
    null,
    [],
    { name: 'Águias', acronym: 'AGU' },
    { name: 'Águias - .', acronym: 'AGU' },
    { name: 'Ω Águias', acronym: 'AGU' },
    { name: 'ß Águias', acronym: 'SAG' },
    { name: 'Águias FC Clube Cidade Time Extra', acronym: 'AGU' },
    { name: 'Águias 123', acronym: 'AGU' },
    { name: 'Águias FC', acronym: 'agu' },
    { name: 'Águias FC', acronym: 'AAA' },
    { name: 'Águias FC', acronym: 'AFZ' },
  ])('recusa corpo, formato ou sigla inválidos: %j', (value) => {
    expect(() => registration.transform(value)).toThrow(BadRequestException);
  });

  it('aceita sigla sem acentos que aparece no nome na mesma ordem', () => {
    expect(registration.transform({ name: 'Águias Futebol Clube', acronym: 'AFC' })).toEqual({
      name: 'Águias Futebol Clube',
      acronym: 'AFC',
    });
  });

  it.each([
    { name: 'A B C D E - .', acronym: 'ABC' },
    { name: 'Aliança Azul Bairro', acronym: 'AAB' },
    { name: '- Águias . Futebol Clube', acronym: 'AFC' },
  ])('conta somente palavras com letras e permite duas letras iguais: %j', (value) => {
    expect(registration.transform(value)).toEqual(value);
  });
});

describe('consulta de clubes conforme RN11', () => {
  const query = new ClubsQueryPipe();

  it.each(['name,net_worth_desc', 'NET_WORTH_DESC', '', 12])('recusa sort inválido: %j', (sort) => {
    expect(() => query.transform({ sort })).toThrow(BadRequestException);
  });

  it('usa nome como padrão e aceita patrimônio descendente', () => {
    expect(query.transform({})).toBe('name');
    expect(query.transform({ sort: 'net_worth_desc', ignored: 'x' })).toBe('net_worth_desc');
  });
});
