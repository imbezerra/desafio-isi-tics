import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { IdPipe } from '../../common/parsers/id.pipe';
import { CadastroClube } from '../dto/clube.dto';
import { CadastroClubePipe } from '../pipes/clubes.input';
import { ConsultaClubesPipe } from '../pipes/clubes.query';
import { ClubesService } from '../services/clubes.service';

@ApiTags('Clubes')
@Controller('clubs')
export class ClubesController {
  constructor(private readonly clubes: ClubesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista clubes ordenados por nome ou patrimônio' })
  @ApiQuery({ name: 'sort', required: false, enum: ['name', 'net_worth_asc', 'net_worth_desc'] })
  listar(@Query(ConsultaClubesPipe) ordenacao: 'name' | 'net_worth_asc' | 'net_worth_desc') {
    return this.clubes.listar(ordenacao);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta clube, elenco, contratos e patrimônio atual' })
  consultar(@Param('id', IdPipe) id: number) {
    return this.clubes.consultar(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria um clube com caixa inicial de 300,00' })
  @ApiBody({ schema: { type: 'object', example: { name: 'Águias FC', acronym: 'AGU' } } })
  async cadastrar(
    @Body(CadastroClubePipe) entrada: CadastroClube,
    @Res({ passthrough: true }) resposta: Response,
  ) {
    const clube = await this.clubes.cadastrar(entrada);
    resposta.location(`/api/v1/clubs/${clube.id}`);
    return clube;
  }
}
