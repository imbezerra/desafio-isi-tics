import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { IdPipe } from '../../common/parsers/id.pipe';
import { PurchaseInput } from '../dto/purchase.dto';
import { PurchaseInputPipe } from '../pipes/purchase.input';
import { MarketService } from '../services/market.service';

@ApiTags('Mercado')
@Controller('players')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Post(':id/sell')
  @HttpCode(200)
  @ApiOperation({ summary: 'Vende um jogador do elenco e encerra seu contrato' })
  sell(@Param('id', IdPipe) id: number) {
    return this.market.sell(id);
  }

  @Post(':id/buy')
  @HttpCode(200)
  @ApiOperation({ summary: 'Compra um jogador livre para um clube' })
  @ApiBody({
    schema: {
      type: 'object',
      example: { club_id: 1, loyalty_until: '2027-03-02T10:15-03:00' },
    },
  })
  buy(@Param('id', IdPipe) id: number, @Body(PurchaseInputPipe) input: PurchaseInput) {
    return this.market.buy(id, input);
  }
}
