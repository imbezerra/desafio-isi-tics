import { Module } from '@nestjs/common';

import { LineupsController } from './controllers/lineups.controller';
import { LineupsRepository } from './repositories/lineups.repository';
import { LineupsService } from './services/lineups.service';
import { MatchesController } from './controllers/matches.controller';
import { StandingsController } from './controllers/standings.controller';
import { MatchesRepository } from './repositories/matches.repository';
import { MatchesService } from './services/matches.service';
import { StandingsService } from './services/standings.service';

@Module({
  controllers: [LineupsController, MatchesController, StandingsController],
  providers: [
    LineupsService,
    LineupsRepository,
    MatchesService,
    MatchesRepository,
    StandingsService,
  ],
})
export class LeagueModule {}
