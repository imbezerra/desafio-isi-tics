import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { calcularValorMercado } from '../../common/calculations/player-value.calculator';
import { Condicao } from '../../common/domain.types';
import { RegraNegocioError } from '../../common/errors/regra-negocio.error';
import { calcularCompra, validarCompra, validarPrazoFidelidade } from '../domain/compra.rules';
import { EntradaCompra } from '../dto/compra.dto';
import { apresentarCompra } from '../presenters/compra.presenter';
import { MercadoRepository } from '../repositories/mercado.repository';
import { calcularVenda, validarVenda } from '../domain/venda.rules';
import { apresentarVenda } from '../presenters/venda.presenter';

@Injectable()
export class MercadoService {
  constructor(private readonly repositorio: MercadoRepository) {}

  async vender(jogadorId: number) {
    try {
      return await this.repositorio.emTransacao(async (repositorio) => {
        const jogador = await repositorio.buscarJogadorAtivo(jogadorId);
        if (!jogador) throw new NotFoundException('Jogador não encontrado.');
        validarVenda(jogador.clubeId);
        const contrato = await repositorio.buscarContratoAtivo(jogador.id, jogador.clubeId);
        if (!contrato) throw new Error('Jogador do elenco sem contrato ativo.');
        const momento = new Date();
        const valorMercado = calcularValorMercado(
          jogador.valorBase.toString(),
          jogador.condicao as Condicao,
          jogador.agilidade,
          jogador.idade,
        );
        const venda = calcularVenda(
          valorMercado,
          contrato.valorCompra.toString(),
          contrato.fidelidadeAte,
          momento,
        );
        const clube = await repositorio.creditarCaixa(jogador.clubeId, venda.credito.toString());
        await repositorio.liberarJogador(jogador.id);
        await repositorio.removerDaEscalacao(jogador.id);
        const contratoEncerrado = await repositorio.encerrarContrato(
          contrato.id,
          venda.situacaoContrato,
          momento,
        );
        const transacao = await repositorio.criarTransacaoVenda(
          jogador.id,
          jogador.clubeId,
          jogador.nome,
          venda,
          momento,
        );
        return apresentarVenda(transacao, contratoEncerrado, clube, venda);
      });
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2034') {
        throw new RegraNegocioError('A venda concorreu com outra operação; tente novamente.');
      }
      throw erro;
    }
  }

  async comprar(jogadorId: number, entrada: EntradaCompra) {
    const momento = new Date();
    validarPrazoFidelidade(entrada.fidelidadeAte, momento);
    try {
      return await this.repositorio.emTransacao(async (repositorio) => {
        const jogador = await repositorio.buscarJogadorAtivo(jogadorId);
        if (!jogador) throw new NotFoundException('Jogador não encontrado.');
        const clube = await repositorio.buscarClube(entrada.clubeId);
        if (!clube) throw new NotFoundException('Clube não encontrado.');
        const [vendidoAntes, tamanhoElenco] = await Promise.all([
          repositorio.clubeJaVendeuJogador(entrada.clubeId, jogadorId),
          repositorio.contarElenco(entrada.clubeId),
        ]);
        validarCompra(jogador.clubeId !== null, vendidoAntes, tamanhoElenco);

        const valorMercado = calcularValorMercado(
          jogador.valorBase.toString(),
          jogador.condicao as Condicao,
          jogador.agilidade,
          jogador.idade,
        );
        const compra = calcularCompra(valorMercado, clube.caixa.toString());
        const clubeAtualizado = await repositorio.atualizarCaixa(clube.id, compra.custo.toString());
        await repositorio.colocarNoElenco(jogador.id, clube.id);
        const contrato = await repositorio.criarContrato(
          jogador.id,
          clube.id,
          compra.valor.toString(),
          entrada.fidelidadeAte,
          momento,
        );
        const transacao = await repositorio.criarTransacaoCompra(
          jogador.id,
          clube.id,
          jogador.nome,
          compra.valor.toString(),
          compra.taxa.toString(),
          compra.custo.toString(),
          momento,
        );
        return apresentarCompra(transacao, contrato, clubeAtualizado);
      });
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2034') {
        throw new RegraNegocioError('A compra concorreu com outra operação; tente novamente.');
      }
      throw erro;
    }
  }
}
