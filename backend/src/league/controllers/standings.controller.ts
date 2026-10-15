import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { StandingsService } from '../services/standings.service';

@ApiTags('Liga')
@Controller('standings')
export class StandingsController {
  constructor(private readonly standings: StandingsService) {}

  @Get()
  @ApiOperation({ summary: 'Calcula a classificação de todos os clubes da liga' })
  get() {
    return this.standings.get();
  }
}
