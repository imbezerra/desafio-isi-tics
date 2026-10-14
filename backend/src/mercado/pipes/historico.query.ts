import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { parseIdDaConsulta } from '../../common/parsers/id.parser';
import { parseOpcao } from '../../common/parsers/input.parser';
import { ConsultaHistorico, TIPOS_TRANSACAO } from '../dto/historico.dto';

@Injectable()
export class ConsultaHistoricoPipe implements PipeTransform<
  Record<string, unknown>,
  ConsultaHistorico
> {
  transform(query: Record<string, unknown>): ConsultaHistorico {
    let tipos: ConsultaHistorico['tipos'];
    if (query.type !== undefined) {
      if (typeof query.type !== 'string') {
        throw new BadRequestException('type deve conter COMPRA e/ou VENDA separados por vírgula.');
      }
      const valores = query.type.split(',');
      if (new Set(valores).size !== valores.length) {
        throw new BadRequestException('type não pode repetir tipos de transação.');
      }
      tipos = valores.map((valor) => parseOpcao(valor, 'type', TIPOS_TRANSACAO));
    }
    let jogadorId: number | undefined;
    if (query.player_id !== undefined) {
      if (typeof query.player_id !== 'string') {
        throw new BadRequestException('player_id deve ser um identificador válido.');
      }
      jogadorId = parseIdDaConsulta(query.player_id);
    }
    return { tipos, jogadorId };
  }
}
