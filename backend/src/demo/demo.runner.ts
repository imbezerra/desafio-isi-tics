import 'reflect-metadata';

import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { BusinessRuleError } from '../common/errors/business-rule.error';
import { seedDemo } from './demo.seed';

async function main(): Promise<void> {
  const logger = new Logger('DemoSeed');
  let database: PrismaClient | undefined;
  try {
    if (existsSync('.env')) loadEnvFile('.env');
    database = new PrismaClient();
    const result = await seedDemo(database);
    logger.log(
      `Carga demonstrativa concluída: 2 clubes, ${result.playerCount} jogadores e 1 partida.`,
    );
    logger.log(`Clubes: ${result.clubIds.join(', ')}. Partida: ${result.matchId}.`);
  } catch (error) {
    logger.error(
      error instanceof BusinessRuleError
        ? error.message
        : 'Falha na carga demonstrativa. Confira DATABASE_URL, migrations e conexão. As gravações da carga foram desfeitas.',
    );
    process.exitCode = 1;
  } finally {
    await database?.$disconnect();
  }
}

void main();
