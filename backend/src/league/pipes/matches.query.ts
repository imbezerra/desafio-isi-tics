import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { parseQueryId } from '../../common/parsers/id.parser';
import { MatchQuery } from '../dto/match.dto';

@Injectable()
export class MatchesQueryPipe implements PipeTransform<Record<string, unknown>, MatchQuery> {
  transform(query: Record<string, unknown>): MatchQuery {
    if (query.club_id === undefined) return {};
    if (typeof query.club_id !== 'string') {
      throw new BadRequestException('club_id deve ser um identificador válido.');
    }
    return { clubId: parseQueryId(query.club_id) };
  }
}
