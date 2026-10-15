import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { parseInteiro, parseObjeto } from '../../common/parsers/input.parser';
import { EntradaPartida } from '../dto/partida.dto';

@Injectable()
export class PartidaInputPipe implements PipeTransform<unknown, EntradaPartida> {
  transform(valor: unknown): EntradaPartida {
    const objeto = parseObjeto(valor);
    const mandanteId = parseInteiro(objeto.home_club_id, 'home_club_id', 1, 2_147_483_647);
    const visitanteId = parseInteiro(objeto.away_club_id, 'away_club_id', 1, 2_147_483_647);
    if (mandanteId === visitanteId) {
      throw new BadRequestException('Mandante e visitante devem ser clubes diferentes.');
    }
    return { mandanteId, visitanteId };
  }
}
