import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { parseOption } from '../../common/parsers/input.parser';
import { ClubSort, CLUB_SORT_OPTIONS } from '../dto/club.dto';

@Injectable()
export class ClubsQueryPipe implements PipeTransform<Record<string, unknown>, ClubSort> {
  transform(query: Record<string, unknown>): ClubSort {
    if (query.sort === undefined) return 'name';
    if (typeof query.sort !== 'string' || query.sort.includes(',')) {
      throw new BadRequestException('sort deve conter apenas um critério de ordenação.');
    }
    return parseOption(query.sort, 'sort', CLUB_SORT_OPTIONS);
  }
}
