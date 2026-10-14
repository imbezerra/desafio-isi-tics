import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CadastroClube } from '../dto/clube.dto';

const clubeComElenco = {
  jogadores: {
    where: { excluidoEm: null },
    include: { contratos: { where: { situacao: 'ATIVO' } } },
  },
} satisfies Prisma.ClubeInclude;

export type ClubeComElenco = Prisma.ClubeGetPayload<{ include: typeof clubeComElenco }>;

@Injectable()
export class ClubesRepository {
  constructor(
    @Inject(PrismaService) private readonly banco: PrismaService | Prisma.TransactionClient,
  ) {}

  emTransacao<T>(operacao: (repositorio: ClubesRepository) => Promise<T>): Promise<T> {
    if (!('$transaction' in this.banco)) return operacao(this);
    return this.banco.$transaction((tx) => operacao(new ClubesRepository(tx)), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  contar(): Promise<number> {
    return this.banco.clube.count();
  }

  buscarPorNomeNormalizado(nomeNormalizado: string) {
    return this.banco.clube.findUnique({ where: { nomeNormalizado }, select: { id: true } });
  }

  buscarPorSigla(sigla: string) {
    return this.banco.clube.findUnique({ where: { sigla }, select: { id: true } });
  }

  criar(entrada: CadastroClube, nomeNormalizado: string): Promise<ClubeComElenco> {
    return this.banco.clube.create({
      data: { nome: entrada.name, sigla: entrada.acronym, nomeNormalizado },
      include: clubeComElenco,
    });
  }

  listar(): Promise<ClubeComElenco[]> {
    return this.banco.clube.findMany({ include: clubeComElenco });
  }

  buscar(id: number): Promise<ClubeComElenco | null> {
    return this.banco.clube.findUnique({ where: { id }, include: clubeComElenco });
  }
}
