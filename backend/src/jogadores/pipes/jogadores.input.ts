import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { AtributosJogador, CONDICOES, POSICOES } from '../../common/domain.types';
import {
  parseInteiro,
  parseObjeto,
  parseOpcao,
  parseTexto,
} from '../../common/parsers/input.parser';
import { CadastroJogador, EdicaoJogador } from '../dto/jogador.dto';

function parseEdicao(valor: unknown): EdicaoJogador {
  const objeto = parseObjeto(valor);
  const name = parseTexto(objeto.name, 'name', 3, 100);
  if (/\d/u.test(name) || name.split(' ').filter((palavra) => /\p{L}/u.test(palavra)).length < 2) {
    throw new BadRequestException(
      'Nome deve conter pelo menos duas palavras com letras e nenhum dígito.',
    );
  }
  const position = parseOpcao(objeto.position, 'position', POSICOES);
  const age = parseInteiro(objeto.age, 'age', 16, 45);
  const agility = parseInteiro(objeto.agility, 'agility', 1, age >= 35 ? 85 : 100);
  return { name, position, age, agility };
}

@Injectable()
export class EdicaoJogadorPipe implements PipeTransform<unknown, EdicaoJogador> {
  transform(valor: unknown): EdicaoJogador {
    return parseEdicao(valor);
  }
}

@Injectable()
export class CadastroJogadorPipe implements PipeTransform<unknown, CadastroJogador> {
  transform(valor: unknown): CadastroJogador {
    const objeto = parseObjeto(valor);
    const edicao = parseEdicao(valor);
    const atributos: AtributosJogador = {
      pace: parseInteiro(objeto.pace, 'pace', 1, 99),
      shooting: parseInteiro(objeto.shooting, 'shooting', 1, 99),
      passing: parseInteiro(objeto.passing, 'passing', 1, 99),
      dribbling: parseInteiro(objeto.dribbling, 'dribbling', 1, 99),
      defending: parseInteiro(objeto.defending, 'defending', 1, 99),
      physical: parseInteiro(objeto.physical, 'physical', 1, 99),
    };
    const valores = Object.values(atributos);
    if (valores.reduce((soma, atributo) => soma + atributo, 0) > 480) {
      throw new BadRequestException('A soma dos atributos não pode ultrapassar 480.');
    }
    const maior = Math.max(...valores);
    const potential = parseInteiro(
      objeto.potential,
      'potential',
      maior,
      edicao.age >= 33 ? maior : 99,
    );
    return { ...edicao, ...atributos, potential };
  }
}

@Injectable()
export class CondicaoJogadorPipe implements PipeTransform {
  transform(valor: unknown) {
    return parseOpcao(parseObjeto(valor).condition, 'condition', CONDICOES);
  }
}
