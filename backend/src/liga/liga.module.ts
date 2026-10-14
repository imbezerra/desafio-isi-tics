import { Module } from '@nestjs/common';

import { EscalacoesController } from './controllers/escalacoes.controller';
import { EscalacoesRepository } from './repositories/escalacoes.repository';
import { EscalacoesService } from './services/escalacoes.service';

@Module({
  controllers: [EscalacoesController],
  providers: [EscalacoesService, EscalacoesRepository],
})
export class LigaModule {}
