import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { parseQueryId } from '../../common/parsers/id.parser';
import { parseOption } from '../../common/parsers/input.parser';
import { HistoryQuery, TRANSACTION_TYPES } from '../dto/history.dto';

@Injectable()
export class HistoryQueryPipe implements PipeTransform<Record<string, unknown>, HistoryQuery> {
  transform(query: Record<string, unknown>): HistoryQuery {
    let types: HistoryQuery['types'];
    if (query.type !== undefined) {
      if (typeof query.type !== 'string') {
        throw new BadRequestException('type deve conter COMPRA e/ou VENDA separados por vírgula.');
      }
      const values = query.type.split(',');
      if (new Set(values).size !== values.length) {
        throw new BadRequestException('type não pode repetir tipos de transação.');
      }
      types = values.map((value) => parseOption(value, 'type', TRANSACTION_TYPES));
    }
    let playerId: number | undefined;
    if (query.player_id !== undefined) {
      if (typeof query.player_id !== 'string') {
        throw new BadRequestException('player_id deve ser um identificador válido.');
      }
      playerId = parseQueryId(query.player_id);
    }
    return { types, playerId };
  }
}
