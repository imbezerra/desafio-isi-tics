import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { IdPipe } from '../../common/parsers/id.pipe';
import { HistoryQuery } from '../dto/history.dto';
import { HistoryQueryPipe } from '../pipes/history.query';
import { HistoryService } from '../services/history.service';
import { documentHistoryQuery } from '../swagger/history.swagger';

@ApiTags('Mercado')
@Controller('clubs/:id/transactions')
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Consulta as transações do clube com filtros e totais' })
  @documentHistoryQuery()
  list(@Param('id', IdPipe) id: number, @Query(HistoryQueryPipe) query: HistoryQuery) {
    return this.history.list(id, query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Exporta o histórico filtrado do clube em CSV' })
  @ApiProduces('text/csv')
  @documentHistoryQuery()
  async exportCsv(
    @Param('id', IdPipe) id: number,
    @Query(HistoryQueryPipe) query: HistoryQuery,
    @Res({ passthrough: true }) response: Response,
  ) {
    const csv = await this.history.exportCsv(id, query);
    // Define CSV só depois da consulta: recusas continuam com corpo e Content-Type JSON.
    response.type('text/csv');
    return csv;
  }
}
