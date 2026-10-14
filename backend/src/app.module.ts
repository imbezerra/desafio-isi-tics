import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { JogadoresModule } from './jogadores/jogadores.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, HealthModule, JogadoresModule],
})
export class AppModule {}
