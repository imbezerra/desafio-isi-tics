import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { parseOpcao } from '../../common/parsers/input.parser';
import { OrdenacaoClube, ORDENACOES_CLUBE } from '../dto/clube.dto';

@Injectable()
export class ConsultaClubesPipe implements PipeTransform<Record<string, unknown>, OrdenacaoClube> {
  transform(query: Record<string, unknown>): OrdenacaoClube {
    if (query.sort === undefined) return 'name';
    if (typeof query.sort !== 'string' || query.sort.includes(',')) {
      throw new BadRequestException('sort deve conter apenas um critério de ordenação.');
    }
    return parseOpcao(query.sort, 'sort', ORDENACOES_CLUBE);
  }
}
