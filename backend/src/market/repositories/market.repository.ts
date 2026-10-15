import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { SaleCalculation } from '../domain/sale.rules';

@Injectable()
export class MarketRepository {
  constructor(
    @Inject(PrismaService) private readonly database: PrismaService | Prisma.TransactionClient,
  ) {}

  withTransaction<T>(operation: (repository: MarketRepository) => Promise<T>): Promise<T> {
    if (!('$transaction' in this.database)) return operation(this);
    return this.database.$transaction((tx) => operation(new MarketRepository(tx)), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  findActivePlayer(id: number) {
    return this.database.player.findFirst({ where: { id, deletedAt: null } });
  }

  findClub(id: number) {
    return this.database.club.findUnique({ where: { id } });
  }

  countSquad(clubId: number) {
    return this.database.player.count({ where: { clubId, deletedAt: null } });
  }

  async clubHasSoldPlayer(clubId: number, playerId: number): Promise<boolean> {
    return (
      (await this.database.transaction.findFirst({
        where: { clubId, playerId, type: 'VENDA' },
        select: { id: true },
      })) !== null
    );
  }

  debitCash(clubId: number, totalCost: string) {
    return this.database.club.update({
      where: { id: clubId },
      data: { cash: { decrement: totalCost } },
    });
  }

  addToSquad(playerId: number, clubId: number) {
    return this.database.player.update({ where: { id: playerId }, data: { clubId } });
  }

  findActiveContract(playerId: number, clubId: number) {
    return this.database.contract.findFirst({
      where: { playerId, clubId, status: 'ATIVO' },
      orderBy: { id: 'desc' },
    });
  }

  creditCash(clubId: number, credit: string) {
    return this.database.club.update({
      where: { id: clubId },
      data: { cash: { increment: credit } },
    });
  }

  releasePlayer(playerId: number) {
    return this.database.player.update({ where: { id: playerId }, data: { clubId: null } });
  }

  removeFromLineup(playerId: number) {
    return this.database.lineupEntry.deleteMany({ where: { playerId } });
  }

  closeContract(id: number, status: string, moment: Date) {
    return this.database.contract.update({
      where: { id },
      data: { status, closedAt: moment },
    });
  }

  createSaleTransaction(
    playerId: number,
    clubId: number,
    playerName: string,
    sale: SaleCalculation,
    moment: Date,
  ) {
    return this.database.transaction.create({
      data: {
        playerId,
        clubId,
        playerName,
        type: 'VENDA',
        value: sale.value.toString(),
        fee: sale.commission.toString(),
        penalty: sale.penalty.toString(),
        profit: sale.profit.toString(),
        cashChange: sale.credit.toString(),
        createdAt: moment,
      },
    });
  }

  createContract(playerId: number, clubId: number, value: string, end: Date, moment: Date) {
    return this.database.contract.create({
      data: {
        playerId,
        clubId,
        purchaseValue: value,
        loyaltyUntil: end,
        status: 'ATIVO',
        startedAt: moment,
      },
    });
  }

  createPurchaseTransaction(
    playerId: number,
    clubId: number,
    playerName: string,
    value: string,
    fee: string,
    totalCost: string,
    moment: Date,
  ) {
    return this.database.transaction.create({
      data: {
        playerId,
        clubId,
        playerName,
        type: 'COMPRA',
        value,
        fee,
        penalty: '0',
        profit: null,
        cashChange: `-${totalCost}`,
        createdAt: moment,
      },
    });
  }
}
