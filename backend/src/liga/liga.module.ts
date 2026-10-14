import { Module } from '@nestjs/common';

import { EscalacoesController } from './controllers/escalacoes.controller';
import { EscalacoesRepository } from './repositories/escalacoes.repository';
import { EscalacoesService } from './services/escalacoes.service';
import { PartidasController } from './controllers/partidas.controller';
import { ClassificacaoController } from './controllers/classificacao.controller';
import { PartidasRepository } from './repositories/partidas.repository';
import { PartidasService } from './services/partidas.service';
import { ClassificacaoService } from './services/classificacao.service';

@Module({
  controllers: [EscalacoesController, PartidasController, ClassificacaoController],
  providers: [
    EscalacoesService,
    EscalacoesRepository,
    PartidasService,
    PartidasRepository,
    ClassificacaoService,
  ],
})
export class LigaModule {}
