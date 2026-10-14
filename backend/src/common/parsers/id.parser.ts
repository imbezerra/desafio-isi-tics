import { BadRequestException, NotFoundException } from '@nestjs/common';

const ID_POSITIVO_REGEX = /^[1-9]\d*$/;
const LIMITE_ID = 2_147_483_647;

export function parseIdDaRota(valor: string): number {
  if (!ID_POSITIVO_REGEX.test(valor) || Number(valor) > LIMITE_ID) {
    throw new NotFoundException('Recurso não encontrado.');
  }

  return Number(valor);
}

export function parseIdDaConsulta(valor: string): number {
  if (!ID_POSITIVO_REGEX.test(valor) || Number(valor) > LIMITE_ID) {
    throw new BadRequestException('Identificador inválido.');
  }

  return Number(valor);
}
