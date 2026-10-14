import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

import { IdPipe } from '../../common/parsers/id.pipe';
import { EntradaCompra } from '../dto/compra.dto';
import { CompraInputPipe } from '../pipes/compra.input';
import { MercadoService } from '../services/mercado.service';

@ApiTags('Mercado')
@Controller('players')
export class MercadoController {
  constructor(private readonly mercado: MercadoService) {}

  @Post(':id/buy')
  @HttpCode(200)
  @ApiOperation({ summary: 'Compra um jogador livre para um clube' })
  @ApiBody({
    schema: {
      type: 'object',
      example: { club_id: 1, loyalty_until: '2027-03-02T10:15-03:00' },
    },
  })
  comprar(@Param('id', IdPipe) id: number, @Body(CompraInputPipe) entrada: EntradaCompra) {
    return this.mercado.comprar(id, entrada);
  }
}
