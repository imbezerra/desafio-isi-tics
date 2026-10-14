import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { normalizarParaOrdenacao } from '../../common/formatters/text.formatter';
import { parseObjeto, parseTexto } from '../../common/parsers/input.parser';
import { CadastroClube } from '../dto/clube.dto';

function validarSigla(sigla: unknown, nome: string): string {
  if (typeof sigla !== 'string' || !/^[A-Z]{3}$/.test(sigla) || new Set(sigla).size === 1) {
    throw new BadRequestException('acronym deve ter três letras maiúsculas diferentes entre si.');
  }

  const letrasNome = [...normalizarParaOrdenacao(nome).toUpperCase()].filter((letra) =>
    /[A-Z]/.test(letra),
  );
  let indice = 0;
  for (const letra of sigla) {
    indice = letrasNome.indexOf(letra, indice);
    if (indice === -1) {
      throw new BadRequestException('acronym deve aparecer no nome do clube, na mesma ordem.');
    }
    indice += 1;
  }
  if (letrasNome[0] !== sigla[0]) {
    throw new BadRequestException('A primeira letra de acronym deve ser a primeira letra do nome.');
  }
  return sigla;
}

@Injectable()
export class CadastroClubePipe implements PipeTransform<unknown, CadastroClube> {
  transform(valor: unknown): CadastroClube {
    const objeto = parseObjeto(valor);
    const name = parseTexto(objeto.name, 'name', 3, 60);
    if (!/^[\p{L} .-]+$/u.test(name) || name.split(' ').length < 2 || name.split(' ').length > 5) {
      throw new BadRequestException(
        'name deve ter de duas a cinco palavras e conter somente letras, espaços, hífen e ponto.',
      );
    }
    return { name, acronym: validarSigla(objeto.acronym, name) };
  }
}
