import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { normalizeForSorting } from '../../common/formatters/text.formatter';
import { parseObject, parseText } from '../../common/parsers/input.parser';
import { CreateClubInput } from '../dto/club.dto';

function validateAcronym(acronym: unknown, name: string): string {
  if (typeof acronym !== 'string' || !/^[A-Z]{3}$/.test(acronym) || new Set(acronym).size === 1) {
    throw new BadRequestException(
      'acronym deve ter três letras maiúsculas de A a Z, que não podem ser todas iguais.',
    );
  }

  const nameLetters = [...normalizeForSorting(name)].filter((letter) => /\p{L}/u.test(letter));
  let index = 0;
  for (const letter of acronym.toLowerCase()) {
    index = nameLetters.indexOf(letter, index);
    if (index === -1) {
      throw new BadRequestException('acronym deve aparecer no nome do clube, na mesma ordem.');
    }
    index += 1;
  }
  if (nameLetters[0] !== acronym[0].toLowerCase()) {
    throw new BadRequestException('A primeira letra de acronym deve ser a primeira letra do nome.');
  }
  return acronym;
}

@Injectable()
export class CreateClubPipe implements PipeTransform<unknown, CreateClubInput> {
  transform(value: unknown): CreateClubInput {
    const object = parseObject(value);
    const name = parseText(object.name, 'name', 3, 60);
    const wordCount = name.split(' ').filter((word) => /\p{L}/u.test(word)).length;
    if (!/^[\p{L} .-]+$/u.test(name) || wordCount < 2 || wordCount > 5) {
      throw new BadRequestException(
        'name deve ter de duas a cinco palavras e conter somente letras, espaços, hífen e ponto.',
      );
    }
    return { name, acronym: validateAcronym(object.acronym, name) };
  }
}
