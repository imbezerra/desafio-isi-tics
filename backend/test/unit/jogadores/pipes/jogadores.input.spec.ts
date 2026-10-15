import { BadRequestException } from '@nestjs/common';

import {
  CadastroJogadorPipe,
  CondicaoJogadorPipe,
  EdicaoJogadorPipe,
} from '../../../../src/jogadores/pipes/jogadores.input';
import { ConsultaJogadoresPipe } from '../../../../src/jogadores/pipes/jogadores.query';

const entrada = {
  name: 'Meia Lua',
  position: 'MEI',
  agility: 85,
  age: 25,
  pace: 70,
  shooting: 68,
  passing: 82,
  dribbling: 79,
  defending: 55,
  physical: 64,
  potential: 86,
};

describe('validação de jogadores conforme V1–V7 e RN06–RN08', () => {
  const cadastro = new CadastroJogadorPipe();

  it('normaliza espaços e ignora campos controlados pelo sistema', () => {
    expect(
      cadastro.transform({ ...entrada, name: '  Meia   Lua  ', cash: 900, condition: 'DOENTE' }),
    ).toEqual(entrada);
  });

  it.each([
    null,
    [],
    5,
    'texto',
    { ...entrada, agility: '85' },
    { ...entrada, name: 'Meia\tLua' },
    { ...entrada, name: 'Meia 2Lua' },
    { ...entrada, name: 'Meia' },
    { ...entrada, age: 25.5 },
    { ...entrada, position: 'mei' },
    { ...entrada, potential: 81 },
    { ...entrada, age: 33 },
    { ...entrada, age: 35, agility: 86 },
    { ...entrada, pace: 99, shooting: 99, passing: 99, dribbling: 99, defending: 99, physical: 99 },
  ])('recusa corpo ou limites inválidos: %j', (valor) => {
    expect(() => cadastro.transform(valor)).toThrow(BadRequestException);
  });

  it('aos 33 anos exige potencial igual ao maior atributo apenas no cadastro', () => {
    expect(cadastro.transform({ ...entrada, age: 33, potential: 82 }).potential).toBe(82);
    expect(new EdicaoJogadorPipe().transform({ ...entrada, age: 33, potential: 99 })).toEqual({
      name: 'Meia Lua',
      position: 'MEI',
      agility: 85,
      age: 33,
    });
  });

  it('a alteração de condição ignora campos de outros endpoints', () => {
    expect(new CondicaoJogadorPipe().transform({ condition: 'DOENTE', name: 123 })).toBe('DOENTE');
  });
});

describe('query params conforme RN07', () => {
  const consulta = new ConsultaJogadoresPipe();

  it.each([
    { page: '01' },
    { club_id: '1e2' },
    { min_value: '01.5' },
    { min_value: '1.555' },
    { limit: '51' },
    { sort: 'value_asc,value_desc' },
    { sort: 'name,name' },
    { sort: 'age_asc, name' },
    { sort: 'name,age_asc,position' },
    { free: 'TRUE' },
    { free: 'true', club_id: '1' },
    { min_age: '30', max_age: '20' },
    { min_value: '50', max_value: '40' },
    { search: '' },
    { position: '' },
  ])('recusa formato ou combinação inválida: %j', (valor) => {
    expect(() => consulta.transform(valor)).toThrow(BadRequestException);
  });

  it('aceita dois critérios diferentes e free=false junto com clube', () => {
    expect(
      consulta.transform({
        free: 'false',
        club_id: '1',
        sort: 'value_desc,age_asc',
        extra: 'ignorado',
      }),
    ).toMatchObject({
      free: false,
      clubeId: 1,
      sort: ['value_desc', 'age_asc'],
      page: 1,
      limit: 10,
    });
  });
});
