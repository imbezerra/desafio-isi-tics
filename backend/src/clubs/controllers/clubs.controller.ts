import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { IdPipe } from '../../common/parsers/id.pipe';
import { CreateClubInput } from '../dto/club.dto';
import { CreateClubPipe } from '../pipes/clubs.input';
import { ClubsQueryPipe } from '../pipes/clubs.query';
import { ClubsService } from '../services/clubs.service';

@ApiTags('Clubes')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista clubes ordenados por nome ou patrimônio' })
  @ApiQuery({ name: 'sort', required: false, enum: ['name', 'net_worth_asc', 'net_worth_desc'] })
  list(@Query(ClubsQueryPipe) sort: 'name' | 'net_worth_asc' | 'net_worth_desc') {
    return this.clubs.list(sort);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta clube, elenco, contratos e patrimônio atual' })
  get(@Param('id', IdPipe) id: number) {
    return this.clubs.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria um clube com caixa inicial de 300,00' })
  @ApiBody({ schema: { type: 'object', example: { name: 'Águias FC', acronym: 'AGU' } } })
  async create(
    @Body(CreateClubPipe) input: CreateClubInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const club = await this.clubs.create(input);
    response.location(`/api/v1/clubs/${club.id}`);
    return club;
  }
}
