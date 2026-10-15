import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { normalizeClubName } from '../../common/formatters/text.formatter';
import { BusinessRuleError } from '../../common/errors/business-rule.error';
import { sortClubs } from '../domain/clubs-list';
import { CreateClubInput, ClubSort } from '../dto/club.dto';
import { presentClub } from '../presenters/club.presenter';
import { ClubsRepository } from '../repositories/clubs.repository';

@Injectable()
export class ClubsService {
  constructor(private readonly repository: ClubsRepository) {}

  async create(input: CreateClubInput) {
    try {
      return await this.repository.withTransaction(async (repository) => {
        const normalizedName = normalizeClubName(input.name);
        if (await repository.findByNormalizedName(normalizedName)) {
          throw new BusinessRuleError('Nome de clube já cadastrado.');
        }
        if (await repository.findByAcronym(input.acronym)) {
          throw new BusinessRuleError('Sigla de clube já cadastrada.');
        }
        if ((await repository.count()) >= 20) {
          throw new BusinessRuleError('A liga já atingiu o limite de 20 clubes.');
        }
        return presentClub(await repository.create(input, normalizedName));
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BusinessRuleError('Nome ou sigla de clube já cadastrado.');
      }
      throw error;
    }
  }

  async list(sort: ClubSort) {
    return sortClubs(
      (await this.repository.list()).map((club) => presentClub(club)),
      sort,
    );
  }

  async get(id: number) {
    const club = await this.repository.findById(id);
    if (!club) throw new NotFoundException('Clube não encontrado.');
    return presentClub(club, true);
  }
}
