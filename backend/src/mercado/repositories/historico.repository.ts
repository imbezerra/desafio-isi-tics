import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { ConsultaHistorico } from '../dto/historico.dto';

@Injectable()
export class HistoricoRepository {
  constructor(private readonly banco: PrismaService) {}

  async clubeExiste(id: number): Promise<boolean> {
    return (await this.banco.clube.findUnique({ where: { id }, select: { id: true } })) !== null;
  }

  async jogadorAtivoExiste(id: number): Promise<boolean> {
    return (
      (await this.banco.jogador.findFirst({
        where: { id, excluidoEm: null },
        select: { id: true },
      })) !== null
    );
  }

  listar(clubeId: number, consulta: ConsultaHistorico) {
    return this.banco.transacao.findMany({
      where: {
        clubeId,
        tipo: consulta.tipos === undefined ? undefined : { in: consulta.tipos },
        jogadorId: consulta.jogadorId,
      },
      orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
    });
  }
}
