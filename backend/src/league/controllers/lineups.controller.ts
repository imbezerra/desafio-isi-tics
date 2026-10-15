import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { IdPipe } from '../../common/parsers/id.pipe';
import { LineupInput } from '../dto/lineup.dto';
import { LineupInputPipe } from '../pipes/lineup.input';
import { LineupsService } from '../services/lineups.service';

@ApiTags('Liga')
@Controller('clubs/:id/lineup')
export class LineupsController {
  constructor(private readonly lineups: LineupsService) {}

  @Get()
  @ApiOperation({ summary: 'Consulta a formação e os titulares atuais do clube' })
  get(@Param('id', IdPipe) id: number) {
    return this.lineups.get(id);
  }

  @Put()
  @ApiOperation({ summary: 'Substitui a escalação do clube com cinco titulares e uma formação' })
  @ApiBody({
    schema: { type: 'object', example: { formation: '2-1-1', player_ids: [34, 31, 30, 33, 32] } },
  })
  setLineup(@Param('id', IdPipe) id: number, @Body(LineupInputPipe) input: LineupInput) {
    return this.lineups.setLineup(id, input);
  }
}
