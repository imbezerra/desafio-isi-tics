import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { PlayerAttributes, PLAYER_CONDITIONS, PLAYER_POSITIONS } from '../../common/domain.types';
import {
  parseInteger,
  parseObject,
  parseOption,
  parseText,
} from '../../common/parsers/input.parser';
import { CreatePlayerInput, UpdatePlayerInput } from '../dto/player.dto';

function parseUpdate(value: unknown): UpdatePlayerInput {
  const object = parseObject(value);
  const name = parseText(object.name, 'name', 3, 100);
  if (/\d/u.test(name) || name.split(' ').filter((word) => /\p{L}/u.test(word)).length < 2) {
    throw new BadRequestException(
      'Nome deve conter pelo menos duas palavras com letras e nenhum dígito.',
    );
  }
  const position = parseOption(object.position, 'position', PLAYER_POSITIONS);
  const age = parseInteger(object.age, 'age', 16, 45);
  const agility = parseInteger(object.agility, 'agility', 1, age >= 35 ? 85 : 100);
  return { name, position, age, agility };
}

@Injectable()
export class UpdatePlayerPipe implements PipeTransform<unknown, UpdatePlayerInput> {
  transform(value: unknown): UpdatePlayerInput {
    return parseUpdate(value);
  }
}

@Injectable()
export class CreatePlayerPipe implements PipeTransform<unknown, CreatePlayerInput> {
  transform(value: unknown): CreatePlayerInput {
    const object = parseObject(value);
    const updateInput = parseUpdate(value);
    const attributes: PlayerAttributes = {
      pace: parseInteger(object.pace, 'pace', 1, 99),
      shooting: parseInteger(object.shooting, 'shooting', 1, 99),
      passing: parseInteger(object.passing, 'passing', 1, 99),
      dribbling: parseInteger(object.dribbling, 'dribbling', 1, 99),
      defending: parseInteger(object.defending, 'defending', 1, 99),
      physical: parseInteger(object.physical, 'physical', 1, 99),
    };
    const values = Object.values(attributes);
    if (values.reduce((sum, attribute) => sum + attribute, 0) > 480) {
      throw new BadRequestException('A soma dos atributos não pode ultrapassar 480.');
    }
    const highest = Math.max(...values);
    const potential = parseInteger(
      object.potential,
      'potential',
      highest,
      updateInput.age >= 33 ? highest : 99,
    );
    return { ...updateInput, ...attributes, potential };
  }
}

@Injectable()
export class PlayerConditionPipe implements PipeTransform {
  transform(value: unknown) {
    return parseOption(parseObject(value).condition, 'condition', PLAYER_CONDITIONS);
  }
}
