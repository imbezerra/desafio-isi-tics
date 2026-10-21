import { Prisma, PrismaClient } from '@prisma/client';

import { BusinessRuleError } from '../common/errors/business-rule.error';

export class DemoRepository {
  constructor(private readonly database: PrismaClient) {}

  withEmptyDatabase<T>(operation: (transaction: Prisma.TransactionClient) => Promise<T>) {
    return this.database.$transaction(
      async (transaction) => {
        const records = await Promise.all([
          transaction.club.findFirst({ select: { id: true } }),
          transaction.player.findFirst({ select: { id: true } }),
          transaction.contract.findFirst({ select: { id: true } }),
          transaction.transaction.findFirst({ select: { id: true } }),
          transaction.lineupEntry.findFirst({ select: { playerId: true } }),
          transaction.match.findFirst({ select: { id: true } }),
          transaction.matchDuel.findFirst({ select: { id: true } }),
        ]);

        if (records.some((record) => record !== null)) {
          throw new BusinessRuleError(
            'A carga demonstrativa exige um banco vazio. Nenhum dado existente foi alterado.',
          );
        }

        return operation(transaction);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 },
    );
  }
}
