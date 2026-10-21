import { Prisma, PrismaClient } from '@prisma/client';

import { BusinessRuleError } from '../../../src/common/errors/business-rule.error';
import { DemoRepository } from '../../../src/demo/demo.repository';

const tables = ['club', 'player', 'contract', 'transaction', 'lineupEntry', 'match', 'matchDuel'];

function prepare() {
  const transaction = Object.fromEntries(
    tables.map((table) => [table, { findFirst: jest.fn().mockResolvedValue(null) }]),
  );
  const database = {
    $transaction: jest.fn(async (operation: (client: typeof transaction) => Promise<unknown>) =>
      operation(transaction),
    ),
  };
  return {
    transaction,
    database,
    repository: new DemoRepository(database as unknown as PrismaClient),
  };
}

describe('proteção da carga demonstrativa', () => {
  it('só inicia a carga após conferir as sete tabelas na mesma transação serializável', async () => {
    const { transaction, database, repository } = prepare();
    const populate = jest.fn().mockResolvedValue('concluído');

    await expect(repository.withEmptyDatabase(populate)).resolves.toBe('concluído');
    expect(populate).toHaveBeenCalledWith(transaction);
    for (const table of tables) expect(transaction[table].findFirst).toHaveBeenCalledTimes(1);
    expect(database.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30_000,
    });
  });

  it.each(tables)(
    'recusa dados existentes em %s antes de iniciar qualquer gravação',
    async (table) => {
      const { transaction, repository } = prepare();
      transaction[table].findFirst.mockResolvedValue({ id: 1 });
      const populate = jest.fn();

      await expect(repository.withEmptyDatabase(populate)).rejects.toThrow(BusinessRuleError);
      expect(populate).not.toHaveBeenCalled();
    },
  );
});
