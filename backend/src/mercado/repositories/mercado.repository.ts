import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CalculoVenda } from '../domain/venda.rules';

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

  buscarContratoAtivo(jogadorId: number, clubeId: number) {
    return this.banco.contrato.findFirst({
      where: { jogadorId, clubeId, situacao: 'ATIVO' },
      orderBy: { id: 'desc' },
    });
  }

  creditarCaixa(clubeId: number, credito: string) {
    return this.banco.clube.update({
      where: { id: clubeId },
      data: { caixa: { increment: credito } },
    });
  }

  liberarJogador(jogadorId: number) {
    return this.banco.jogador.update({ where: { id: jogadorId }, data: { clubeId: null } });
  }

  removerDaEscalacao(jogadorId: number) {
    return this.banco.escalacao.deleteMany({ where: { jogadorId } });
  }

  encerrarContrato(id: number, situacao: string, momento: Date) {
    return this.banco.contrato.update({
      where: { id },
      data: { situacao, encerradoEm: momento },
    });
  }

  criarTransacaoVenda(
    jogadorId: number,
    clubeId: number,
    nomeJogador: string,
    venda: CalculoVenda,
    momento: Date,
  ) {
    return this.banco.transacao.create({
      data: {
        jogadorId,
        clubeId,
        nomeJogador,
        tipo: 'VENDA',
        valor: venda.valor.toString(),
        taxa: venda.comissao.toString(),
        multa: venda.multa.toString(),
        lucro: venda.lucro.toString(),
        variacaoCaixa: venda.credito.toString(),
        criadoEm: momento,
      },
    });
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
