import { Module } from '@nestjs/common';

import { MercadoController } from './controllers/mercado.controller';
import { MercadoRepository } from './repositories/mercado.repository';
import { MercadoService } from './services/mercado.service';

@Module({ controllers: [MercadoController], providers: [MercadoService, MercadoRepository] })
export class MercadoModule {}
