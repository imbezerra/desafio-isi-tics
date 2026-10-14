import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { IdPipe } from '../../common/parsers/id.pipe';
import { ConsultaPartidas, EntradaPartida } from '../dto/partida.dto';
import { PartidaInputPipe } from '../pipes/partidas.input';
import { ConsultaPartidasPipe } from '../pipes/partidas.query';
import { PartidasService } from '../services/partidas.service';

@ApiTags('Liga')
@Controller('matches')
export class PartidasController {
  constructor(private readonly partidas: PartidasService) {}

  @Post()
  @ApiOperation({ summary: 'Joga uma partida e registra o placar e os seis duelos' })
  @ApiBody({ schema: { type: 'object', example: { home_club_id: 1, away_club_id: 2 } } })
  async jogar(
    @Body(PartidaInputPipe) entrada: EntradaPartida,
    @Res({ passthrough: true }) resposta: Response,
  ) {
    const partida = await this.partidas.jogar(entrada);
    resposta.location(`/api/v1/matches/${partida.id}`);
    return partida;
  }

  @Get()
  @ApiOperation({ summary: 'Lista partidas da mais recente para a mais antiga' })
  @ApiQuery({
    name: 'club_id',
    required: false,
    type: Number,
    description: 'Filtra partidas em que o clube foi mandante ou visitante.',
  })
  listar(@Query(ConsultaPartidasPipe) consulta: ConsultaPartidas) {
    return this.partidas.listar(consulta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta o placar e os seis duelos históricos de uma partida' })
  consultar(@Param('id', IdPipe) id: number) {
    return this.partidas.consultar(id);
  }
}
