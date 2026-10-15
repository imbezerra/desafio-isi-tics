import { Injectable, NotFoundException } from '@nestjs/common';

import {
  calcularOverall,
  calcularValorBase,
} from '../../common/calculations/player-value.calculator';
import { Condicao } from '../../common/domain.types';
import {
  validarEdicaoJogador,
  validarExclusaoJogador,
  validarTransicaoCondicao,
} from '../domain/jogador.rules';
import { montarListaJogadores } from '../domain/jogadores-lista';
import { CadastroJogador, ConsultaJogadores, EdicaoJogador } from '../dto/jogador.dto';
import { apresentarJogador } from '../presenters/jogador.presenter';
import { JogadoresRepository } from '../repositories/jogadores.repository';

@Injectable()
export class JogadoresService {
  constructor(private readonly repositorio: JogadoresRepository) {}

  async cadastrar(entrada: CadastroJogador) {
    const overall = calcularOverall(entrada.position, entrada);
    const valorBase = calcularValorBase(overall, entrada.potential, entrada.age).toString();
    return apresentarJogador(await this.repositorio.cadastrar(entrada, valorBase));
  }

  async consultar(id: number) {
    return apresentarJogador(await this.obterJogador(this.repositorio, id));
  }

  async listar(consulta: ConsultaJogadores) {
    if (consulta.clubeId !== undefined && !(await this.repositorio.clubeExiste(consulta.clubeId))) {
      throw new NotFoundException('Clube não encontrado.');
    }
    const jogadores = await this.repositorio.listarCandidatos(consulta);
    return montarListaJogadores(jogadores.map(apresentarJogador), consulta);
  }

  editar(id: number, entrada: EdicaoJogador) {
    return this.repositorio.emTransacao(async (repositorio) => {
      const jogador = await this.obterJogador(repositorio, id);
      validarEdicaoJogador(jogador, entrada.position, entrada.age);
      return apresentarJogador(await repositorio.editar(id, entrada));
    });
  }

  alterarCondicao(id: number, condicao: Condicao) {
    return this.repositorio.emTransacao(async (repositorio) => {
      const jogador = await this.obterJogador(repositorio, id);
      if (jogador.condicao === condicao) return apresentarJogador(jogador);
      validarTransicaoCondicao(jogador.condicao, condicao);
      if (condicao === 'DOENTE') await repositorio.removerDaEscalacao(id);
      return apresentarJogador(await repositorio.alterarCondicao(id, condicao));
    });
  }

  async excluir(id: number): Promise<void> {
    await this.repositorio.emTransacao(async (repositorio) => {
      const jogador = await this.obterJogador(repositorio, id);
      validarExclusaoJogador(jogador);
      await repositorio.excluirLogicamente(id, new Date());
    });
  }

  private async obterJogador(repositorio: JogadoresRepository, id: number) {
    const jogador = await repositorio.buscarAtivo(id);
    if (!jogador) throw new NotFoundException('Jogador não encontrado.');
    return jogador;
  }
}
