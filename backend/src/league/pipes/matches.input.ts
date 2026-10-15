import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { parseInteger, parseObject } from '../../common/parsers/input.parser';
import { MatchInput } from '../dto/match.dto';

@Injectable()
export class MatchInputPipe implements PipeTransform<unknown, MatchInput> {
  transform(value: unknown): MatchInput {
    const object = parseObject(value);
    const homeClubId = parseInteger(object.home_club_id, 'home_club_id', 1, 2_147_483_647);
    const awayClubId = parseInteger(object.away_club_id, 'away_club_id', 1, 2_147_483_647);
    if (homeClubId === awayClubId) {
      throw new BadRequestException('Mandante e visitante devem ser clubes diferentes.');
    }
    return { homeClubId, awayClubId };
  }
}
