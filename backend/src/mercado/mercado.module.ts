import { Module } from '@nestjs/common';

import { MercadoController } from './controllers/mercado.controller';
import { MercadoRepository } from './repositories/mercado.repository';
import { MercadoService } from './services/mercado.service';
import { HistoricoController } from './controllers/historico.controller';
import { HistoricoService } from './services/historico.service';
import { HistoricoRepository } from './repositories/historico.repository';

@Module({
  controllers: [MercadoController, HistoricoController],
  providers: [MercadoService, MercadoRepository, HistoricoService, HistoricoRepository],
})
export class MercadoModule {}
