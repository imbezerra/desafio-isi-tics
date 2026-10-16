import { normalizeTextSpaces } from '../../shared/validation/text';
import type { CreateClubInput } from './clubs.api';

export type ClubFormErrors = Partial<Record<keyof CreateClubInput, string>>;

export function validateClubForm(values: CreateClubInput): ClubFormErrors {
  const errors: ClubFormErrors = {};
  const name = normalizeTextSpaces(values.name);

  if (!name) errors.name = 'Informe o nome.';
  else if ([...name].length < 3 || [...name].length > 60) errors.name = 'Use de 3 a 60 caracteres.';

  if (!values.acronym) errors.acronym = 'Informe a sigla.';
  else if (!/^[A-Z]{3}$/.test(values.acronym))
    errors.acronym = 'Use exatamente 3 letras maiúsculas de A a Z.';

  return errors;
}

export function toCreateClubInput(values: CreateClubInput): CreateClubInput {
  return { name: normalizeTextSpaces(values.name), acronym: values.acronym };
}
