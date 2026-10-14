import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { RegraNegocioError } from '../../common/errors/regra-negocio.error';
import { jogarPartida } from '../domain/partida.rules';
import { ConsultaPartidas, EntradaPartida } from '../dto/partida.dto';
import {
  apresentarPartida,
  apresentarResumoPartida,
  prepararTimePartida,
} from '../presenters/partida.presenter';
import { PartidasRepository } from '../repositories/partidas.repository';

@Injectable()
export class PartidasService {
  constructor(private readonly repositorio: PartidasRepository) {}

  async jogar(entrada: EntradaPartida) {
    try {
      return await this.repositorio.emTransacao(async (repositorio) => {
        const mandante = await repositorio.buscarClubeComTitulares(entrada.homeClubId);
        const visitante = await repositorio.buscarClubeComTitulares(entrada.awayClubId);
        if (!mandante || !visitante) throw new NotFoundException('Clube não encontrado.');
        const calculo = jogarPartida(prepararTimePartida(mandante), prepararTimePartida(visitante));
        return apresentarPartida(await repositorio.salvar(calculo, new Date()));
      });
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2034') {
        throw new RegraNegocioError('A partida concorreu com outra operação; tente novamente.');
      }
      throw erro;
    }
  }

  async consultar(id: number) {
    const partida = await this.repositorio.buscar(id);
    if (!partida) throw new NotFoundException('Partida não encontrada.');
    return apresentarPartida(partida);
  }

  async listar(consulta: ConsultaPartidas) {
    if (consulta.clubeId !== undefined && !(await this.repositorio.clubeExiste(consulta.clubeId))) {
      throw new NotFoundException('Clube não encontrado.');
    }
    return (await this.repositorio.listar(consulta)).map(apresentarResumoPartida);
  }
}
