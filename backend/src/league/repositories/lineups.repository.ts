import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { LineupInput } from '../dto/lineup.dto';

@Injectable()
export class LineupsRepository {
  constructor(
    @Inject(PrismaService) private readonly database: PrismaService | Prisma.TransactionClient,
  ) {}

  withTransaction<T>(operation: (repository: LineupsRepository) => Promise<T>): Promise<T> {
    if (!('$transaction' in this.database)) return operation(this);
    return this.database.$transaction((tx) => operation(new LineupsRepository(tx)), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  findClub(id: number) {
    return this.database.club.findUnique({
      where: { id },
      select: {
        id: true,
        formation: true,
        lineups: { where: { player: { deletedAt: null } }, include: { player: true } },
      },
    });
  }

  findActivePlayers(ids: number[]) {
    return this.database.player.findMany({ where: { id: { in: ids }, deletedAt: null } });
  }

  async replace(clubId: number, input: LineupInput): Promise<void> {
    await this.database.lineupEntry.deleteMany({ where: { clubId } });
    await this.database.club.update({
      where: { id: clubId },
      data: { formation: input.formation },
    });
    await this.database.lineupEntry.createMany({
      data: input.playerIds.map((playerId) => ({ clubId, playerId })),
    });
  }
}
