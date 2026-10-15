import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { parseInteger, parseObject, parseOption } from '../../common/parsers/input.parser';
import { FORMATIONS } from '../domain/formations';
import { LineupInput } from '../dto/lineup.dto';

@Injectable()
export class LineupInputPipe implements PipeTransform<unknown, LineupInput> {
  transform(value: unknown): LineupInput {
    const object = parseObject(value);
    const formation = parseOption(object.formation, 'formation', FORMATIONS);
    if (!Array.isArray(object.player_ids) || object.player_ids.length !== 5) {
      throw new BadRequestException('player_ids deve conter exatamente cinco identificadores.');
    }
    const playerIds = object.player_ids.map((id) =>
      parseInteger(id, 'player_ids', 1, 2_147_483_647),
    );
    if (new Set(playerIds).size !== 5) {
      throw new BadRequestException('player_ids não pode conter identificadores repetidos.');
    }
    return { formation, playerIds };
  }
}
