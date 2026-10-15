import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { CONDICOES, POSICOES } from '../../common/domain.types';
import { parseIdDaConsulta } from '../../common/parsers/id.parser';
import { parseOpcao, parseTexto } from '../../common/parsers/input.parser';
import { ConsultaJogadores, ORDENACOES_JOGADOR } from '../dto/jogador.dto';

function textoConsulta(valor: unknown): string {
  if (typeof valor !== 'string' || valor === '') {
    throw new BadRequestException('Parâmetro de consulta inválido.');
  }
  return valor;
}

function inteiroConsulta(valor: unknown, padrao: number, minimo: number, maximo: number): number {
  if (valor === undefined) return padrao;
  const numero = parseIdDaConsulta(textoConsulta(valor));
  if (numero < minimo || numero > maximo) throw new BadRequestException('Inteiro fora da faixa.');
  return numero;
}

function valorConsulta(valor: unknown, padrao: number): number {
  if (valor === undefined) return padrao;
  const texto = textoConsulta(valor);
  if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(texto) || Number(texto) > 550) {
    throw new BadRequestException('Valor deve estar entre 0 e 550, com até duas casas decimais.');
  }
  return Number(texto);
}

@Injectable()
export class ConsultaJogadoresPipe implements PipeTransform<
  Record<string, unknown>,
  ConsultaJogadores
> {
  transform(query: Record<string, unknown>): ConsultaJogadores {
    const sort = query.sort === undefined ? ['name'] : textoConsulta(query.sort).split(',');
    const campos = sort.map((valor) => valor.split('_')[0]);
    if (sort.length > 2 || new Set(campos).size !== sort.length) {
      throw new BadRequestException('Use até dois critérios sem repetir o campo de ordenação.');
    }
    const consulta: ConsultaJogadores = {
      search: query.search === undefined ? undefined : parseTexto(query.search, 'search', 2, 100),
      position:
        query.position === undefined ? undefined : parseOpcao(query.position, 'position', POSICOES),
      condition:
        query.condition === undefined
          ? undefined
          : parseOpcao(query.condition, 'condition', CONDICOES),
      free:
        query.free === undefined
          ? undefined
          : parseOpcao(query.free, 'free', ['true', 'false']) === 'true',
      clubeId:
        query.club_id === undefined ? undefined : parseIdDaConsulta(textoConsulta(query.club_id)),
      idadeMinima: inteiroConsulta(query.min_age, 16, 16, 45),
      idadeMaxima: inteiroConsulta(query.max_age, 45, 16, 45),
      valorMinimo: valorConsulta(query.min_value, 0),
      valorMaximo: valorConsulta(query.max_value, 550),
      sort: sort.map((valor) => parseOpcao(valor, 'sort', ORDENACOES_JOGADOR)),
      page: inteiroConsulta(query.page, 1, 1, 2_147_483_647),
      limit: inteiroConsulta(query.limit, 10, 1, 50),
    };
    if (
      consulta.idadeMinima > consulta.idadeMaxima ||
      consulta.valorMinimo > consulta.valorMaximo ||
      (consulta.free === true && consulta.clubeId !== undefined)
    ) {
      throw new BadRequestException('Combinação contraditória de filtros.');
    }
    return consulta;
  }
}
