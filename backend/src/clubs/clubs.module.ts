import { Module } from '@nestjs/common';

import { ClubsController } from './controllers/clubs.controller';
import { ClubsRepository } from './repositories/clubs.repository';
import { ClubsService } from './services/clubs.service';

@Module({ controllers: [ClubsController], providers: [ClubsService, ClubsRepository] })
export class ClubsModule {}
