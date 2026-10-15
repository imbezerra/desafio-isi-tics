import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { HistoryQuery } from '../dto/history.dto';

@Injectable()
export class HistoryRepository {
  constructor(private readonly database: PrismaService) {}

  async clubExists(id: number): Promise<boolean> {
    return (await this.database.club.findUnique({ where: { id }, select: { id: true } })) !== null;
  }

  async activePlayerExists(id: number): Promise<boolean> {
    return (
      (await this.database.player.findFirst({
        where: { id, deletedAt: null },
        select: { id: true },
      })) !== null
    );
  }

  list(clubId: number, query: HistoryQuery) {
    return this.database.transaction.findMany({
      where: {
        clubId,
        type: query.types === undefined ? undefined : { in: query.types },
        playerId: query.playerId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }
}
