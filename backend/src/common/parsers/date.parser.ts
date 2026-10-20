import { BadRequestException } from '@nestjs/common';

const BRASILIA_DATETIME_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})-03:00$/;

export function parseBrasiliaDateTime(value: string): Date {
  const match = BRASILIA_DATETIME_REGEX.exec(value);

  if (!match) {
    throw new BadRequestException('Data e hora devem usar o formato AAAA-MM-DDTHH:MM-03:00.');
  }

  const [, year, month, day, hour, minute] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00-03:00`);

  const expectedFormat = `${year}-${month}-${day}T${hour}:${minute}:00-03:00`;
  if (Number.isNaN(date.getTime()) || formatBrasiliaDateTime(date) !== expectedFormat) {
    throw new BadRequestException('Data ou hora inexistente.');
  }

  return date;
}

export function formatBrasiliaDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Etc/GMT+3',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}-03:00`;
}
