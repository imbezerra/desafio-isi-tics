import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { parseDataHoraBrasilia } from '../../common/parsers/date.parser';
import { parseInteiro, parseObjeto } from '../../common/parsers/input.parser';
import { EntradaCompra } from '../dto/compra.dto';

@Injectable()
export class CompraInputPipe implements PipeTransform<unknown, EntradaCompra> {
  transform(valor: unknown): EntradaCompra {
    const objeto = parseObjeto(valor);
    const clubId = parseInteiro(objeto.club_id, 'club_id', 1, 2_147_483_647);
    if (typeof objeto.loyalty_until !== 'string') {
      throw new BadRequestException('loyalty_until deve ser uma data e hora válida.');
    }
    return { clubId, loyaltyUntil: parseDataHoraBrasilia(objeto.loyalty_until) };
  }
}
