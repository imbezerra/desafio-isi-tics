import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { parseInteiro, parseObjeto, parseOpcao } from '../../common/parsers/input.parser';
import { FORMACOES } from '../domain/formacoes';
import { EntradaEscalacao } from '../dto/escalacao.dto';

@Injectable()
export class EscalacaoInputPipe implements PipeTransform<unknown, EntradaEscalacao> {
  transform(valor: unknown): EntradaEscalacao {
    const objeto = parseObjeto(valor);
    const formacao = parseOpcao(objeto.formation, 'formation', FORMACOES);
    if (!Array.isArray(objeto.player_ids) || objeto.player_ids.length !== 5) {
      throw new BadRequestException('player_ids deve conter exatamente cinco identificadores.');
    }
    const jogadoresIds = objeto.player_ids.map((id) =>
      parseInteiro(id, 'player_ids', 1, 2_147_483_647),
    );
    if (new Set(jogadoresIds).size !== 5) {
      throw new BadRequestException('player_ids não pode conter identificadores repetidos.');
    }
    return { formacao, jogadoresIds };
  }
}
