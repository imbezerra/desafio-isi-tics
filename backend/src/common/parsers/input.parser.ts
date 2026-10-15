import { BadRequestException } from '@nestjs/common';

import { normalizeText, hasControlCharacter } from '../formatters/text.formatter';

export function parseObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BadRequestException('O corpo deve ser um objeto JSON.');
  }
  return value as Record<string, unknown>;
}

export function parseText(value: unknown, field: string, minimum: number, maximum: number): string {
  if (typeof value !== 'string' || hasControlCharacter(value)) {
    throw new BadRequestException(`${field} deve ser texto sem caracteres de controle.`);
  }
  const text = normalizeText(value);
  if ([...text].length < minimum || [...text].length > maximum) {
    throw new BadRequestException(`${field} deve ter entre ${minimum} e ${maximum} caracteres.`);
  }
  return text;
}

export function parseInteger(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < minimum || value > maximum) {
    throw new BadRequestException(`${field} deve ser inteiro entre ${minimum} e ${maximum}.`);
  }
  return value;
}

export function parseOption<T extends string>(
  value: unknown,
  field: string,
  options: readonly T[],
): T {
  if (typeof value !== 'string' || !options.includes(value as T)) {
    throw new BadRequestException(`${field} deve ser um de: ${options.join(', ')}.`);
  }
  return value as T;
}
