import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateClubInput } from '../dto/club.dto';

const clubWithSquad = {
  players: {
    where: { deletedAt: null },
    include: { contracts: { where: { status: 'ATIVO' }, orderBy: { id: 'desc' } } },
  },
} satisfies Prisma.ClubInclude;

export type ClubWithSquad = Prisma.ClubGetPayload<{ include: typeof clubWithSquad }>;

@Injectable()
export class ClubsRepository {
  constructor(
    @Inject(PrismaService) private readonly database: PrismaService | Prisma.TransactionClient,
  ) {}

  withTransaction<T>(operation: (repository: ClubsRepository) => Promise<T>): Promise<T> {
    if (!('$transaction' in this.database)) return operation(this);
    return this.database.$transaction((tx) => operation(new ClubsRepository(tx)), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  count(): Promise<number> {
    return this.database.club.count();
  }

  findByNormalizedName(normalizedName: string) {
    return this.database.club.findUnique({ where: { normalizedName }, select: { id: true } });
  }

  findByAcronym(acronym: string) {
    return this.database.club.findUnique({ where: { acronym }, select: { id: true } });
  }

  create(input: CreateClubInput, normalizedName: string): Promise<ClubWithSquad> {
    return this.database.club.create({
      data: { name: input.name, acronym: input.acronym, normalizedName },
      include: clubWithSquad,
    });
  }

  list(): Promise<ClubWithSquad[]> {
    return this.database.club.findMany({ include: clubWithSquad });
  }

  findById(id: number): Promise<ClubWithSquad | null> {
    return this.database.club.findUnique({ where: { id }, include: clubWithSquad });
  }
}
