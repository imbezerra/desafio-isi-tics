import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../database/prisma.service';

@ApiTags('Saúde')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    await this.prisma.$queryRaw`SELECT 1`;

    return { status: 'ok' };
  }
}
