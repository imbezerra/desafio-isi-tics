import { Injectable, NotFoundException } from '@nestjs/common';

import {
  calculateOverall,
  calculateBaseValue,
} from '../../common/calculations/player-value.calculator';
import { PlayerCondition } from '../../common/domain.types';
import {
  validatePlayerUpdate,
  validatePlayerDeletion,
  validateConditionTransition,
} from '../domain/player.rules';
import { buildPlayerList } from '../domain/players-list';
import { CreatePlayerInput, PlayerQuery, UpdatePlayerInput } from '../dto/player.dto';
import { presentPlayer } from '../presenters/player.presenter';
import { PlayersRepository } from '../repositories/players.repository';

@Injectable()
export class PlayersService {
  constructor(private readonly repository: PlayersRepository) {}

  async create(input: CreatePlayerInput) {
    const overall = calculateOverall(input.position, input);
    const baseValue = calculateBaseValue(overall, input.potential, input.age).toString();
    return presentPlayer(await this.repository.create(input, baseValue));
  }

  async get(id: number) {
    return presentPlayer(await this.getPlayer(this.repository, id));
  }

  async list(query: PlayerQuery) {
    if (query.clubId !== undefined && !(await this.repository.clubExists(query.clubId))) {
      throw new NotFoundException('Clube não encontrado.');
    }
    const players = await this.repository.listCandidates(query);
    return buildPlayerList(players.map(presentPlayer), query);
  }

  update(id: number, input: UpdatePlayerInput) {
    return this.repository.withTransaction(async (repository) => {
      const player = await this.getPlayer(repository, id);
      validatePlayerUpdate(player, input.position, input.age);
      return presentPlayer(await repository.update(id, input));
    });
  }

  updateCondition(id: number, condition: PlayerCondition) {
    return this.repository.withTransaction(async (repository) => {
      const player = await this.getPlayer(repository, id);
      if (player.condition === condition) return presentPlayer(player);
      validateConditionTransition(player.condition, condition);
      if (condition === 'DOENTE') await repository.removeFromLineup(id);
      return presentPlayer(await repository.updateCondition(id, condition));
    });
  }

  async delete(id: number): Promise<void> {
    await this.repository.withTransaction(async (repository) => {
      const player = await this.getPlayer(repository, id);
      validatePlayerDeletion(player);
      await repository.softDelete(id, new Date());
    });
  }

  private async getPlayer(repository: PlayersRepository, id: number) {
    const player = await repository.findActive(id);
    if (!player) throw new NotFoundException('Jogador não encontrado.');
    return player;
  }
}
