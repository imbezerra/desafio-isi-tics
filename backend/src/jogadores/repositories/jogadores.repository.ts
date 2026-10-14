import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { Condicao } from '../../common/domain.types';
import { PrismaService } from '../../database/prisma.service';
import { CadastroJogador, ConsultaJogadores, EdicaoJogador } from '../dto/jogador.dto';

@Injectable()
export class JogadoresRepository {
  constructor(
    @Inject(PrismaService) private readonly banco: PrismaService | Prisma.TransactionClient,
  ) {}

  emTransacao<T>(operacao: (repositorio: JogadoresRepository) => Promise<T>): Promise<T> {
    // O repository entregue ao callback usa exclusivamente o cliente da transação.
    if (!('$transaction' in this.banco)) return operacao(this);
    return this.banco.$transaction((tx) => operacao(new JogadoresRepository(tx)), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  cadastrar(entrada: CadastroJogador, valorBase: string) {
    return this.banco.jogador.create({
      data: {
        nome: entrada.name,
        posicao: entrada.position,
        agilidade: entrada.agility,
        idade: entrada.age,
        velocidade: entrada.pace,
        finalizacao: entrada.shooting,
        passe: entrada.passing,
        drible: entrada.dribbling,
        defesa: entrada.defending,
        fisico: entrada.physical,
        potencial: entrada.potential,
        condicao: 'APTO',
        valorBase,
      },
    });
  }

  buscarAtivo(id: number) {
    return this.banco.jogador.findFirst({ where: { id, excluidoEm: null } });
  }

  async clubeExiste(id: number): Promise<boolean> {
    return (await this.banco.clube.findUnique({ where: { id }, select: { id: true } })) !== null;
  }

  listarCandidatos(consulta: ConsultaJogadores) {
    return this.banco.jogador.findMany({
      where: {
        excluidoEm: null,
        posicao: consulta.position,
        condicao: consulta.condition,
        idade: { gte: consulta.minAge, lte: consulta.maxAge },
        clubeId:
          consulta.clubId ??
          (consulta.free === true ? null : consulta.free === false ? { not: null } : undefined),
      },
    });
  }

  editar(id: number, entrada: EdicaoJogador) {
    return this.banco.jogador.update({
      where: { id },
      data: {
        nome: entrada.name,
        posicao: entrada.position,
        agilidade: entrada.agility,
        idade: entrada.age,
      },
    });
  }

  alterarCondicao(id: number, condicao: Condicao) {
    return this.banco.jogador.update({ where: { id }, data: { condicao } });
  }

  removerDaEscalacao(id: number) {
    return this.banco.escalacao.deleteMany({ where: { jogadorId: id } });
  }

  excluirLogicamente(id: number, momento: Date) {
    return this.banco.jogador.update({ where: { id }, data: { excluidoEm: momento } });
  }
}
