import { Module } from '@nestjs/common';

import { PlayersController } from './controllers/players.controller';
import { PlayersService } from './services/players.service';
import { PlayersRepository } from './repositories/players.repository';

@Module({ controllers: [PlayersController], providers: [PlayersService, PlayersRepository] })
export class PlayersModule {}
