import { Injectable } from '@nestjs/common';

import { calcularClassificacao } from '../domain/classificacao.rules';
import { PartidasRepository } from '../repositories/partidas.repository';

@Injectable()
export class ClassificacaoService {
  constructor(private readonly repositorio: PartidasRepository) {}

  consultar() {
    return this.repositorio.emTransacao(async (repositorio) => {
      const clubes = await repositorio.listarClubesClassificacao();
      const partidas = await repositorio.listarPlacaresClassificacao();
      return calcularClassificacao(clubes, partidas);
    });
  }
}
