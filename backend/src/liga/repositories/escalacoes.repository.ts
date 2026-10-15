import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { EntradaEscalacao } from '../dto/escalacao.dto';

@Injectable()
export class EscalacoesRepository {
  constructor(
    @Inject(PrismaService) private readonly banco: PrismaService | Prisma.TransactionClient,
  ) {}

  emTransacao<T>(operacao: (repositorio: EscalacoesRepository) => Promise<T>): Promise<T> {
    if (!('$transaction' in this.banco)) return operacao(this);
    return this.banco.$transaction((tx) => operacao(new EscalacoesRepository(tx)), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  buscarClube(id: number) {
    return this.banco.clube.findUnique({
      where: { id },
      select: {
        id: true,
        formacao: true,
        escalacoes: { where: { jogador: { excluidoEm: null } }, include: { jogador: true } },
      },
    });
  }

  buscarJogadoresAtivos(ids: number[]) {
    return this.banco.jogador.findMany({ where: { id: { in: ids }, excluidoEm: null } });
  }

  async substituir(clubeId: number, entrada: EntradaEscalacao): Promise<void> {
    await this.banco.escalacao.deleteMany({ where: { clubeId } });
    await this.banco.clube.update({
      where: { id: clubeId },
      data: { formacao: entrada.formacao },
    });
    await this.banco.escalacao.createMany({
      data: entrada.jogadoresIds.map((jogadorId) => ({ clubeId, jogadorId })),
    });
  }
}
