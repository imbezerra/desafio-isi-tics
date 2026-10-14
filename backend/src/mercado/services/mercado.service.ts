import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { calcularValorMercado } from '../../common/calculations/player-value.calculator';
import { Condicao } from '../../common/domain.types';
import { RegraNegocioError } from '../../common/errors/regra-negocio.error';
import { calcularCompra, validarCompra, validarPrazoFidelidade } from '../domain/compra.rules';
import { EntradaCompra } from '../dto/compra.dto';
import { apresentarCompra } from '../presenters/compra.presenter';
import { MercadoRepository } from '../repositories/mercado.repository';

@Injectable()
export class MercadoService {
  constructor(private readonly repositorio: MercadoRepository) {}

  async comprar(jogadorId: number, entrada: EntradaCompra) {
    const momento = new Date();
    validarPrazoFidelidade(entrada.loyaltyUntil, momento);
    try {
      return await this.repositorio.emTransacao(async (repositorio) => {
        const jogador = await repositorio.buscarJogadorAtivo(jogadorId);
        if (!jogador) throw new NotFoundException('Jogador não encontrado.');
        const clube = await repositorio.buscarClube(entrada.clubId);
        if (!clube) throw new NotFoundException('Clube não encontrado.');
        const [vendidoAntes, tamanhoElenco] = await Promise.all([
          repositorio.clubeJaVendeuJogador(entrada.clubId, jogadorId),
          repositorio.contarElenco(entrada.clubId),
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
          entrada.loyaltyUntil,
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
