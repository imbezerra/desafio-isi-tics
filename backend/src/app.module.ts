import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ClubesModule } from './clubes/clubes.module';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { JogadoresModule } from './jogadores/jogadores.module';
import { MercadoModule } from './mercado/mercado.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    JogadoresModule,
    ClubesModule,
    MercadoModule,
  ],
})
export class AppModule {}
