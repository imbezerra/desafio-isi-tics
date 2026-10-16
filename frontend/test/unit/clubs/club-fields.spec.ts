import { describe, expect, it } from 'vitest';
import { toCreateClubInput, validateClubForm } from '../../../src/features/clubs/club-fields';
import { normalizeTextSpaces } from '../../../src/shared/validation/text';

describe('Validação individual do cadastro de clubes', () => {
  it('exige nome e sigla', () => {
    expect(validateClubForm({ name: '', acronym: '' })).toEqual({
      name: 'Informe o nome.',
      acronym: 'Informe a sigla.',
    });
  });

  it.each([' a ', 'a'.repeat(61), '𐐀'.repeat(61)])('recusa o tamanho do nome %s', (name) => {
    expect(validateClubForm({ name, acronym: 'AGU' }).name).toBe('Use de 3 a 60 caracteres.');
  });

  it.each(['abc', 'a'.repeat(60), '𐐀'.repeat(60)])(
    'aceita limites do nome em pontos de código',
    (name) => {
      expect(validateClubForm({ name, acronym: 'AGU' }).name).toBeUndefined();
    },
  );

  it.each(['AG', 'AGUU', 'agu', 'ÁGU', 'A1U', ' AGU '])(
    'recusa a sigla %s sem corrigi-la silenciosamente',
    (acronym) => {
      expect(validateClubForm({ name: 'Águias FC', acronym }).acronym).toBeTruthy();
    },
  );

  it('normaliza apenas U+0020 e envia somente nome e sigla', () => {
    expect(toCreateClubInput({ name: '  Águias   FC  ', acronym: 'AGU' })).toEqual({
      name: 'Águias FC',
      acronym: 'AGU',
    });

    expect(normalizeTextSpaces('\tÁguias\n FC')).toBe('\tÁguias\n FC');
  });

  it('deixa quantidade de palavras, formato do nome e relação da sigla para a API', () => {
    expect(validateClubForm({ name: 'Clube123', acronym: 'AAA' })).toEqual({});
    expect(validateClubForm({ name: 'Águias FC', acronym: 'XYZ' })).toEqual({});
  });
});
