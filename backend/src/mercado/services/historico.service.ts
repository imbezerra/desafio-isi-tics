import { Injectable, NotFoundException } from '@nestjs/common';

import { calcularResumoHistorico } from '../domain/historico-resumo';
import { ConsultaHistorico } from '../dto/historico.dto';
import { apresentarHistoricoCsv } from '../presenters/historico-csv.presenter';
import { apresentarTransacao } from '../presenters/transacao.presenter';
import { HistoricoRepository } from '../repositories/historico.repository';

@Injectable()
export class HistoricoService {
  constructor(private readonly repositorio: HistoricoRepository) {}

  async listar(clubeId: number, consulta: ConsultaHistorico) {
    const data = await this.obterTransacoes(clubeId, consulta);
    return { data, summary: calcularResumoHistorico(data) };
  }

  async exportar(clubeId: number, consulta: ConsultaHistorico): Promise<string> {
    return apresentarHistoricoCsv(await this.obterTransacoes(clubeId, consulta));
  }

  private async obterTransacoes(clubeId: number, consulta: ConsultaHistorico) {
    if (!(await this.repositorio.clubeExiste(clubeId))) {
      throw new NotFoundException('Clube não encontrado.');
    }
    if (
      consulta.jogadorId !== undefined &&
      !(await this.repositorio.jogadorAtivoExiste(consulta.jogadorId))
    ) {
      throw new NotFoundException('Jogador não encontrado.');
    }
    return (await this.repositorio.listar(clubeId, consulta)).map(apresentarTransacao);
  }
}
