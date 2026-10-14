import { Module } from '@nestjs/common';

import { ClubesController } from './controllers/clubes.controller';
import { ClubesRepository } from './repositories/clubes.repository';
import { ClubesService } from './services/clubes.service';

@Module({ controllers: [ClubesController], providers: [ClubesService, ClubesRepository] })
export class ClubesModule {}
