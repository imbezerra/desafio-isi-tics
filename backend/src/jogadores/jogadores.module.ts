import { Module } from '@nestjs/common';

import { JogadoresController } from './controllers/jogadores.controller';
import { JogadoresService } from './services/jogadores.service';
import { JogadoresRepository } from './repositories/jogadores.repository';

@Module({ controllers: [JogadoresController], providers: [JogadoresService, JogadoresRepository] })
export class JogadoresModule {}
