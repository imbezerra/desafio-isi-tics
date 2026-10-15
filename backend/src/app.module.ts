import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ClubsModule } from './clubs/clubs.module';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { PlayersModule } from './players/players.module';
import { MarketModule } from './market/market.module';
import { LeagueModule } from './league/league.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    PlayersModule,
    ClubsModule,
    MarketModule,
    LeagueModule,
  ],
})
export class AppModule {}
