import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { calculateMarketValue } from '../../common/calculations/player-value.calculator';
import { PlayerCondition } from '../../common/domain.types';
import { BusinessRuleError } from '../../common/errors/business-rule.error';
import {
  calculatePurchase,
  validatePurchase,
  validateLoyaltyPeriod,
} from '../domain/purchase.rules';
import { PurchaseInput } from '../dto/purchase.dto';
import { presentPurchase } from '../presenters/purchase.presenter';
import { MarketRepository } from '../repositories/market.repository';
import { calculateSale, validateSale } from '../domain/sale.rules';
import { presentSale } from '../presenters/sale.presenter';

@Injectable()
export class MarketService {
  constructor(private readonly repository: MarketRepository) {}

  async sell(playerId: number) {
    try {
      return await this.repository.withTransaction(async (repository) => {
        const player = await repository.findActivePlayer(playerId);
        if (!player) throw new NotFoundException('Jogador não encontrado.');
        validateSale(player.clubId);
        const contract = await repository.findActiveContract(player.id, player.clubId);
        if (!contract) throw new Error('Jogador do elenco sem contrato ativo.');
        const moment = new Date();
        const marketValue = calculateMarketValue(
          player.baseValue.toString(),
          player.condition as PlayerCondition,
          player.agility,
          player.age,
        );
        const sale = calculateSale(
          marketValue,
          contract.purchaseValue.toString(),
          contract.loyaltyUntil,
          moment,
        );
        const club = await repository.creditCash(player.clubId, sale.credit.toString());
        await repository.releasePlayer(player.id);
        await repository.removeFromLineup(player.id);
        const closedContract = await repository.closeContract(
          contract.id,
          sale.contractStatus,
          moment,
        );
        const transaction = await repository.createSaleTransaction(
          player.id,
          player.clubId,
          player.name,
          sale,
          moment,
        );
        return presentSale(transaction, closedContract, club, sale);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new BusinessRuleError('A venda concorreu com outra operação; tente novamente.');
      }
      throw error;
    }
  }

  async buy(playerId: number, input: PurchaseInput) {
    const moment = new Date();
    validateLoyaltyPeriod(input.loyaltyUntil, moment);
    try {
      return await this.repository.withTransaction(async (repository) => {
        const player = await repository.findActivePlayer(playerId);
        if (!player) throw new NotFoundException('Jogador não encontrado.');
        const club = await repository.findClub(input.clubId);
        if (!club) throw new NotFoundException('Clube não encontrado.');
        const [soldBefore, squadSize] = await Promise.all([
          repository.clubHasSoldPlayer(input.clubId, playerId),
          repository.countSquad(input.clubId),
        ]);
        validatePurchase(player.clubId !== null, soldBefore, squadSize);

        const marketValue = calculateMarketValue(
          player.baseValue.toString(),
          player.condition as PlayerCondition,
          player.agility,
          player.age,
        );
        const purchase = calculatePurchase(marketValue, club.cash.toString());
        const updatedClub = await repository.debitCash(club.id, purchase.totalCost.toString());
        await repository.addToSquad(player.id, club.id);
        const contract = await repository.createContract(
          player.id,
          club.id,
          purchase.value.toString(),
          input.loyaltyUntil,
          moment,
        );
        const transaction = await repository.createPurchaseTransaction(
          player.id,
          club.id,
          player.name,
          purchase.value.toString(),
          purchase.fee.toString(),
          purchase.totalCost.toString(),
          moment,
        );
        return presentPurchase(transaction, contract, updatedClub);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new BusinessRuleError('A compra concorreu com outra operação; tente novamente.');
      }
      throw error;
    }
  }
}
