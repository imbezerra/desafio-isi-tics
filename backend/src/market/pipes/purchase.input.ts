import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { parseBrasiliaDateTime } from '../../common/parsers/date.parser';
import { parseInteger, parseObject } from '../../common/parsers/input.parser';
import { PurchaseInput } from '../dto/purchase.dto';

@Injectable()
export class PurchaseInputPipe implements PipeTransform<unknown, PurchaseInput> {
  transform(value: unknown): PurchaseInput {
    const object = parseObject(value);
    const clubId = parseInteger(object.club_id, 'club_id', 1, 2_147_483_647);
    if (typeof object.loyalty_until !== 'string') {
      throw new BadRequestException('loyalty_until deve ser uma data e hora válida.');
    }
    return { clubId, loyaltyUntil: parseBrasiliaDateTime(object.loyalty_until) };
  }
}
