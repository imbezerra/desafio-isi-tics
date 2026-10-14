import { BadRequestException } from '@nestjs/common';

const DATA_BRASIL_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})-03:00$/;

export function parseDataHoraBrasilia(valor: string): Date {
  const correspondencia = DATA_BRASIL_REGEX.exec(valor);

  if (!correspondencia) {
    throw new BadRequestException('Data e hora devem usar o formato AAAA-MM-DDTHH:MM-03:00.');
  }

  const [, ano, mes, dia, hora, minuto] = correspondencia;
  const data = new Date(`${ano}-${mes}-${dia}T${hora}:${minuto}:00-03:00`);

  const formatoEsperado = `${ano}-${mes}-${dia}T${hora}:${minuto}:00-03:00`;
  if (Number.isNaN(data.getTime()) || formatarDataHoraBrasilia(data) !== formatoEsperado) {
    throw new BadRequestException('Data ou hora inexistente.');
  }

  return data;
}

export function formatarDataHoraBrasilia(data: Date): string {
  const partes = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data);
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));

  return `${valores.year}-${valores.month}-${valores.day}T${valores.hour}:${valores.minute}:${valores.second}-03:00`;
}
