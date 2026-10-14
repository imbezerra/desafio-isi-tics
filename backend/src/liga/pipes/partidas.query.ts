import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { parseIdDaConsulta } from '../../common/parsers/id.parser';
import { ConsultaPartidas } from '../dto/partida.dto';

@Injectable()
export class ConsultaPartidasPipe implements PipeTransform<
  Record<string, unknown>,
  ConsultaPartidas
> {
  transform(query: Record<string, unknown>): ConsultaPartidas {
    if (query.club_id === undefined) return {};
    if (typeof query.club_id !== 'string') {
      throw new BadRequestException('club_id deve ser um identificador válido.');
    }
    return { clubeId: parseIdDaConsulta(query.club_id) };
  }
}
