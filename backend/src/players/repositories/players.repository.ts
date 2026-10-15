import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PlayerCondition } from '../../common/domain.types';
import { PrismaService } from '../../database/prisma.service';
import { CreatePlayerInput, PlayerQuery, UpdatePlayerInput } from '../dto/player.dto';

@Injectable()
export class PlayersRepository {
  constructor(
    @Inject(PrismaService) private readonly database: PrismaService | Prisma.TransactionClient,
  ) {}

  withTransaction<T>(operation: (repository: PlayersRepository) => Promise<T>): Promise<T> {
    // O repository entregue ao callback usa exclusivamente o cliente da transação.
    if (!('$transaction' in this.database)) return operation(this);
    return this.database.$transaction((tx) => operation(new PlayersRepository(tx)), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  create(input: CreatePlayerInput, baseValue: string) {
    return this.database.player.create({
      data: {
        name: input.name,
        position: input.position,
        agility: input.agility,
        age: input.age,
        pace: input.pace,
        shooting: input.shooting,
        passing: input.passing,
        dribbling: input.dribbling,
        defending: input.defending,
        physical: input.physical,
        potential: input.potential,
        condition: 'APTO',
        baseValue,
      },
    });
  }

  findActive(id: number) {
    return this.database.player.findFirst({ where: { id, deletedAt: null } });
  }

  async clubExists(id: number): Promise<boolean> {
    return (await this.database.club.findUnique({ where: { id }, select: { id: true } })) !== null;
  }

  listCandidates(query: PlayerQuery) {
    return this.database.player.findMany({
      where: {
        deletedAt: null,
        position: query.position,
        condition: query.condition,
        age: { gte: query.minAge, lte: query.maxAge },
        clubId:
          query.clubId ??
          (query.free === true ? null : query.free === false ? { not: null } : undefined),
      },
    });
  }

  update(id: number, input: UpdatePlayerInput) {
    return this.database.player.update({
      where: { id },
      data: {
        name: input.name,
        position: input.position,
        agility: input.agility,
        age: input.age,
      },
    });
  }

  updateCondition(id: number, condition: PlayerCondition) {
    return this.database.player.update({ where: { id }, data: { condition } });
  }

  removeFromLineup(id: number) {
    return this.database.lineupEntry.deleteMany({ where: { playerId: id } });
  }

  softDelete(id: number, moment: Date) {
    return this.database.player.update({ where: { id }, data: { deletedAt: moment } });
  }
}
