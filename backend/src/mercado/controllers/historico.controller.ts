import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { IdPipe } from '../../common/parsers/id.pipe';
import { ConsultaHistorico } from '../dto/historico.dto';
import { ConsultaHistoricoPipe } from '../pipes/historico.query';
import { HistoricoService } from '../services/historico.service';
import { DocumentarConsultaHistorico } from '../swagger/historico.swagger';

@ApiTags('Mercado')
@Controller('clubs/:id/transactions')
export class HistoricoController {
  constructor(private readonly historico: HistoricoService) {}

  @Get()
  @ApiOperation({ summary: 'Consulta as transações do clube com filtros e totais' })
  @DocumentarConsultaHistorico()
  listar(
    @Param('id', IdPipe) id: number,
    @Query(ConsultaHistoricoPipe) consulta: ConsultaHistorico,
  ) {
    return this.historico.listar(id, consulta);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exporta o histórico filtrado do clube em CSV' })
  @ApiProduces('text/csv')
  @DocumentarConsultaHistorico()
  async exportar(
    @Param('id', IdPipe) id: number,
    @Query(ConsultaHistoricoPipe) consulta: ConsultaHistorico,
    @Res({ passthrough: true }) resposta: Response,
  ) {
    const csv = await this.historico.exportar(id, consulta);
    // Define CSV só depois da consulta: recusas continuam com corpo e Content-Type JSON.
    resposta.type('text/csv');
    return csv;
  }
}
