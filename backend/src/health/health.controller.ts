import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { HealthService } from './health.service';

@ApiTags('Saúde')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Verifica se a API e o banco de dados estão disponíveis' })
  check(): Promise<{ status: 'ok' }> {
    return this.health.check();
  }
}
