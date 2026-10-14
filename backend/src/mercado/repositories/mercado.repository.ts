import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MercadoRepository {
  constructor(
    @Inject(PrismaService) private readonly banco: PrismaService | Prisma.TransactionClient,
  ) {}

  emTransacao<T>(operacao: (repositorio: MercadoRepository) => Promise<T>): Promise<T> {
    if (!('$transaction' in this.banco)) return operacao(this);
    return this.banco.$transaction((tx) => operacao(new MercadoRepository(tx)), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  buscarJogadorAtivo(id: number) {
    return this.banco.jogador.findFirst({ where: { id, excluidoEm: null } });
  }

  buscarClube(id: number) {
    return this.banco.clube.findUnique({ where: { id } });
  }

  contarElenco(clubeId: number) {
    return this.banco.jogador.count({ where: { clubeId, excluidoEm: null } });
  }

  async clubeJaVendeuJogador(clubeId: number, jogadorId: number): Promise<boolean> {
    return (
      (await this.banco.transacao.findFirst({
        where: { clubeId, jogadorId, tipo: 'VENDA' },
        select: { id: true },
      })) !== null
    );
  }

  atualizarCaixa(clubeId: number, custo: string) {
    return this.banco.clube.update({
      where: { id: clubeId },
      data: { caixa: { decrement: custo } },
    });
  }

  colocarNoElenco(jogadorId: number, clubeId: number) {
    return this.banco.jogador.update({ where: { id: jogadorId }, data: { clubeId } });
  }

  criarContrato(jogadorId: number, clubeId: number, valor: string, fim: Date, momento: Date) {
    return this.banco.contrato.create({
      data: {
        jogadorId,
        clubeId,
        valorCompra: valor,
        fidelidadeAte: fim,
        situacao: 'ATIVO',
        iniciadoEm: momento,
      },
    });
  }

  criarTransacaoCompra(
    jogadorId: number,
    clubeId: number,
    nomeJogador: string,
    valor: string,
    taxa: string,
    custo: string,
    momento: Date,
  ) {
    return this.banco.transacao.create({
      data: {
        jogadorId,
        clubeId,
        nomeJogador,
        tipo: 'COMPRA',
        valor,
        taxa,
        multa: '0',
        lucro: null,
        variacaoCaixa: `-${custo}`,
        criadoEm: momento,
      },
    });
  }
}
