import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { normalizarNomeClube } from '../../common/formatters/text.formatter';
import { RegraNegocioError } from '../../common/errors/regra-negocio.error';
import { ordenarClubes } from '../domain/clubes-lista';
import { CadastroClube, OrdenacaoClube } from '../dto/clube.dto';
import { apresentarClube } from '../presenters/clube.presenter';
import { ClubesRepository } from '../repositories/clubes.repository';

@Injectable()
export class ClubesService {
  constructor(private readonly repositorio: ClubesRepository) {}

  async cadastrar(entrada: CadastroClube) {
    try {
      return await this.repositorio.emTransacao(async (repositorio) => {
        const nomeNormalizado = normalizarNomeClube(entrada.name);
        if (await repositorio.buscarPorNomeNormalizado(nomeNormalizado)) {
          throw new RegraNegocioError('Nome de clube já cadastrado.');
        }
        if (await repositorio.buscarPorSigla(entrada.acronym)) {
          throw new RegraNegocioError('Sigla de clube já cadastrada.');
        }
        if ((await repositorio.contar()) >= 20) {
          throw new RegraNegocioError('A liga já atingiu o limite de 20 clubes.');
        }
        return apresentarClube(await repositorio.criar(entrada, nomeNormalizado));
      });
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        throw new RegraNegocioError('Nome ou sigla de clube já cadastrado.');
      }
      throw erro;
    }
  }

  async listar(ordenacao: OrdenacaoClube) {
    return ordenarClubes(
      (await this.repositorio.listar()).map((clube) => apresentarClube(clube)),
      ordenacao,
    );
  }

  async consultar(id: number) {
    const clube = await this.repositorio.buscar(id);
    if (!clube) throw new NotFoundException('Clube não encontrado.');
    return apresentarClube(clube, true);
  }
}
