import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { IdPipe } from '../../common/parsers/id.pipe';
import { MatchQuery, MatchInput } from '../dto/match.dto';
import { MatchInputPipe } from '../pipes/matches.input';
import { MatchesQueryPipe } from '../pipes/matches.query';
import { MatchesService } from '../services/matches.service';

@ApiTags('Liga')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Post()
  @ApiOperation({ summary: 'Joga uma partida e registra o placar e os seis duelos' })
  @ApiBody({ schema: { type: 'object', example: { home_club_id: 1, away_club_id: 2 } } })
  async play(
    @Body(MatchInputPipe) input: MatchInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const match = await this.matches.play(input);
    response.location(`/api/v1/matches/${match.id}`);
    return match;
  }

  @Get()
  @ApiOperation({ summary: 'Lista partidas da mais recente para a mais antiga' })
  @ApiQuery({
    name: 'club_id',
    required: false,
    type: Number,
    description: 'Filtra partidas em que o clube foi mandante ou visitante.',
  })
  list(@Query(MatchesQueryPipe) query: MatchQuery) {
    return this.matches.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta o placar e os seis duelos históricos de uma partida' })
  get(@Param('id', IdPipe) id: number) {
    return this.matches.get(id);
  }
}
