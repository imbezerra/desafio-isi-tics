import { Module } from '@nestjs/common';

import { MarketController } from './controllers/market.controller';
import { MarketRepository } from './repositories/market.repository';
import { MarketService } from './services/market.service';
import { HistoryController } from './controllers/history.controller';
import { HistoryService } from './services/history.service';
import { HistoryRepository } from './repositories/history.repository';

@Module({
  controllers: [MarketController, HistoryController],
  providers: [MarketService, MarketRepository, HistoryService, HistoryRepository],
})
export class MarketModule {}
