import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { IdPipe } from '../../common/parsers/id.pipe';
import { EntradaEscalacao } from '../dto/escalacao.dto';
import { EscalacaoInputPipe } from '../pipes/escalacao.input';
import { EscalacoesService } from '../services/escalacoes.service';

@ApiTags('Liga')
@Controller('clubs/:id/lineup')
export class EscalacoesController {
  constructor(private readonly escalacoes: EscalacoesService) {}

  @Get()
  @ApiOperation({ summary: 'Consulta a formação e os titulares atuais do clube' })
  consultar(@Param('id', IdPipe) id: number) {
    return this.escalacoes.consultar(id);
  }

  @Put()
  @ApiOperation({ summary: 'Substitui a escalação do clube com cinco titulares e uma formação' })
  @ApiBody({
    schema: { type: 'object', example: { formation: '2-1-1', player_ids: [34, 31, 30, 33, 32] } },
  })
  escalar(@Param('id', IdPipe) id: number, @Body(EscalacaoInputPipe) entrada: EntradaEscalacao) {
    return this.escalacoes.escalar(id, entrada);
  }
}
