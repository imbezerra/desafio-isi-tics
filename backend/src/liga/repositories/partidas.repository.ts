import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { PartidaCalculada } from '../domain/partida.rules';
import { ConsultaPartidas } from '../dto/partida.dto';

const clubesDaPartida = {
  mandante: { select: { id: true, nome: true } },
  visitante: { select: { id: true, nome: true } },
} satisfies Prisma.PartidaInclude;
const detalhePartida = {
  ...clubesDaPartida,
  duelos: { orderBy: { ordem: 'asc' } },
} satisfies Prisma.PartidaInclude;
export type PartidaComClubes = Prisma.PartidaGetPayload<{ include: typeof clubesDaPartida }>;
export type PartidaComDuelos = Prisma.PartidaGetPayload<{ include: typeof detalhePartida }>;

@Injectable()
export class PartidasRepository {
  constructor(
    @Inject(PrismaService) private readonly banco: PrismaService | Prisma.TransactionClient,
  ) {}

  emTransacao<T>(operacao: (repositorio: PartidasRepository) => Promise<T>): Promise<T> {
    if (!('$transaction' in this.banco)) return operacao(this);
    return this.banco.$transaction((tx) => operacao(new PartidasRepository(tx)), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  buscarClubeComTitulares(id: number) {
    return this.banco.clube.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        formacao: true,
        escalacoes: { where: { jogador: { excluidoEm: null } }, include: { jogador: true } },
      },
    });
  }

  async clubeExiste(id: number): Promise<boolean> {
    return (await this.banco.clube.findUnique({ where: { id }, select: { id: true } })) !== null;
  }

  salvar(partida: PartidaCalculada, momento: Date): Promise<PartidaComDuelos> {
    return this.banco.partida.create({
      data: {
        mandanteId: partida.homeId,
        visitanteId: partida.awayId,
        golsMandante: partida.homeGoals,
        golsVisitante: partida.awayGoals,
        formacaoMandante: partida.homeFormation,
        formacaoVisitante: partida.awayFormation,
        jogadaEm: momento,
        duelos: {
          create: partida.duels.map((duelo) => ({
            ordem: duelo.order,
            clubeAtacanteId: duelo.attacking_club_id,
            atacanteId: duelo.attacker.player_id,
            defensorId: duelo.defender.player_id,
            nomeAtacante: duelo.attacker.player_name,
            nomeDefensor: duelo.defender.player_name,
            posicaoAtacante: duelo.attacker.position,
            posicaoDefensor: duelo.defender.position,
            condicaoAtacante: duelo.attacker.condition,
            condicaoDefensor: duelo.defender.condition,
            atributoAtaque: duelo.attacker.attribute,
            atributoDefesa: duelo.defender.attribute,
            valorAtaque: duelo.attacker.value,
            valorDefesa: duelo.defender.value,
            gol: duelo.goal,
          })),
        },
      },
      include: detalhePartida,
    });
  }

  buscar(id: number): Promise<PartidaComDuelos | null> {
    return this.banco.partida.findUnique({ where: { id }, include: detalhePartida });
  }

  listar(consulta: ConsultaPartidas): Promise<PartidaComClubes[]> {
    return this.banco.partida.findMany({
      where:
        consulta.clubeId === undefined
          ? {}
          : { OR: [{ mandanteId: consulta.clubeId }, { visitanteId: consulta.clubeId }] },
      orderBy: [{ jogadaEm: 'desc' }, { id: 'desc' }],
      include: clubesDaPartida,
    });
  }

  listarClubesClassificacao() {
    return this.banco.clube.findMany({ select: { id: true, nome: true } });
  }

  listarPlacaresClassificacao() {
    return this.banco.partida.findMany({
      select: { mandanteId: true, visitanteId: true, golsMandante: true, golsVisitante: true },
    });
  }
}
