import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { BusinessRuleError } from '../../common/errors/business-rule.error';
import { playMatch } from '../domain/match.rules';
import { MatchQuery, MatchInput } from '../dto/match.dto';
import { presentMatch, presentMatchSummary, prepareMatchTeam } from '../presenters/match.presenter';
import { MatchesRepository } from '../repositories/matches.repository';

@Injectable()
export class MatchesService {
  constructor(private readonly repository: MatchesRepository) {}

  async play(input: MatchInput) {
    try {
      return await this.repository.withTransaction(async (repository) => {
        const home = await repository.findClubWithStarters(input.homeClubId);
        const away = await repository.findClubWithStarters(input.awayClubId);
        if (!home || !away) throw new NotFoundException('Clube não encontrado.');
        const calculation = playMatch(prepareMatchTeam(home), prepareMatchTeam(away));
        return presentMatch(await repository.save(calculation, new Date()));
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
        throw new BusinessRuleError('A partida concorreu com outra operação; tente novamente.');
      }
      throw error;
    }
  }

  async get(id: number) {
    const match = await this.repository.findById(id);
    if (!match) throw new NotFoundException('Partida não encontrada.');
    return presentMatch(match);
  }

  async list(query: MatchQuery) {
    if (query.clubId !== undefined && !(await this.repository.clubExists(query.clubId))) {
      throw new NotFoundException('Clube não encontrado.');
    }
    return (await this.repository.list(query)).map(presentMatchSummary);
  }
}
