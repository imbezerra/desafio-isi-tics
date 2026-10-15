import { BadRequestException, NotFoundException } from '@nestjs/common';

const POSITIVE_ID_REGEX = /^[1-9]\d*$/;
const MAX_ID = 2_147_483_647;

export function parseRouteId(value: string): number {
  if (!POSITIVE_ID_REGEX.test(value) || Number(value) > MAX_ID) {
    throw new NotFoundException('Recurso não encontrado.');
  }

  return Number(value);
}

export function parseQueryId(value: string): number {
  if (!POSITIVE_ID_REGEX.test(value) || Number(value) > MAX_ID) {
    throw new BadRequestException('Identificador inválido.');
  }

  return Number(value);
}
