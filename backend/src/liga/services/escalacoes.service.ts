import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { RegraNegocioError } from '../../common/errors/regra-negocio.error';
import { validarEscalacao } from '../domain/escalacao.rules';
import { EntradaEscalacao } from '../dto/escalacao.dto';
import { apresentarEscalacao } from '../presenters/escalacao.presenter';
import { EscalacoesRepository } from '../repositories/escalacoes.repository';

@Injectable()
export class EscalacoesService {
  constructor(private readonly repositorio: EscalacoesRepository) {}

  async consultar(id: number) {
    return apresentarEscalacao(await this.obterClube(this.repositorio, id));
  }

  async escalar(id: number, entrada: EntradaEscalacao) {
    try {
      return await this.repositorio.emTransacao(async (repositorio) => {
        await this.obterClube(repositorio, id);
        const jogadores = await repositorio.buscarJogadoresAtivos(entrada.playerIds);
        if (jogadores.length !== entrada.playerIds.length) {
          throw new NotFoundException('Um dos jogadores não foi encontrado.');
        }
        validarEscalacao(id, entrada.formation, jogadores);
        await repositorio.substituir(id, entrada);
        return apresentarEscalacao(await this.obterClube(repositorio, id));
      });
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2034', 'P2002'].includes(erro.code)
      ) {
        throw new RegraNegocioError('A escalação conflitou com outra operação; tente novamente.');
      }
      throw erro;
    }
  }

  private async obterClube(repositorio: EscalacoesRepository, id: number) {
    const clube = await repositorio.buscarClube(id);
    if (!clube) throw new NotFoundException('Clube não encontrado.');
    return clube;
  }
}
