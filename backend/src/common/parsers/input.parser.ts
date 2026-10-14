import { BadRequestException } from '@nestjs/common';

import { normalizarTexto, possuiCaractereDeControle } from '../formatters/text.formatter';

export function parseObjeto(valor: unknown): Record<string, unknown> {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) {
    throw new BadRequestException('O corpo deve ser um objeto JSON.');
  }
  return valor as Record<string, unknown>;
}

export function parseTexto(valor: unknown, campo: string, minimo: number, maximo: number): string {
  if (typeof valor !== 'string' || possuiCaractereDeControle(valor)) {
    throw new BadRequestException(`${campo} deve ser texto sem caracteres de controle.`);
  }
  const texto = normalizarTexto(valor);
  if ([...texto].length < minimo || [...texto].length > maximo) {
    throw new BadRequestException(`${campo} deve ter entre ${minimo} e ${maximo} caracteres.`);
  }
  return texto;
}

export function parseInteiro(
  valor: unknown,
  campo: string,
  minimo: number,
  maximo: number,
): number {
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < minimo || valor > maximo) {
    throw new BadRequestException(`${campo} deve ser inteiro entre ${minimo} e ${maximo}.`);
  }
  return valor;
}

export function parseOpcao<T extends string>(
  valor: unknown,
  campo: string,
  opcoes: readonly T[],
): T {
  if (typeof valor !== 'string' || !opcoes.includes(valor as T)) {
    throw new BadRequestException(`${campo} deve ser um de: ${opcoes.join(', ')}.`);
  }
  return valor as T;
}
