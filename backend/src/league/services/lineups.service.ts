import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { BusinessRuleError } from '../../common/errors/business-rule.error';
import { validateLineup } from '../domain/lineup.rules';
import { LineupInput } from '../dto/lineup.dto';
import { presentLineup } from '../presenters/lineup.presenter';
import { LineupsRepository } from '../repositories/lineups.repository';

@Injectable()
export class LineupsService {
  constructor(private readonly repository: LineupsRepository) {}

  async get(id: number) {
    return presentLineup(await this.getClub(this.repository, id));
  }

  async setLineup(id: number, input: LineupInput) {
    try {
      return await this.repository.withTransaction(async (repository) => {
        await this.getClub(repository, id);
        const players = await repository.findActivePlayers(input.playerIds);
        if (players.length !== input.playerIds.length) {
          throw new NotFoundException('Um dos jogadores não foi encontrado.');
        }
        validateLineup(id, input.formation, players);
        await repository.replace(id, input);
        return presentLineup(await this.getClub(repository, id));
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2034', 'P2002'].includes(error.code)
      ) {
        throw new BusinessRuleError('A escalação conflitou com outra operação; tente novamente.');
      }
      throw error;
    }
  }

  private async getClub(repository: LineupsRepository, id: number) {
    const club = await repository.findClub(id);
    if (!club) throw new NotFoundException('Clube não encontrado.');
    return club;
  }
}
