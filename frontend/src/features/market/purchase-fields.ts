import type { PurchaseInput } from './purchases.api';

export interface PurchaseFormValues {
  clubId: string;
  date: string;
  time: string;
}

export type PurchaseFormErrors = Partial<Record<keyof PurchaseFormValues, string>>;

export function validatePurchaseForm(values: PurchaseFormValues): PurchaseFormErrors {
  const errors: PurchaseFormErrors = {};

  if (!values.clubId) errors.clubId = 'Selecione o clube comprador.';
  else if (!/^[1-9]\d*$/.test(values.clubId) || Number(values.clubId) > 2_147_483_647)
    errors.clubId = 'Informe um identificador inteiro positivo.';

  if (!values.date) errors.date = 'Informe a data da fidelidade.';
  else if (!isCalendarDate(values.date)) errors.date = 'Use uma data válida no formato DD/MM/AAAA.';

  if (!values.time) errors.time = 'Informe a hora da fidelidade.';
  else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.time))
    errors.time = 'Use uma hora válida no formato HH:MM.';

  return errors;
}

function isCalendarDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

  if (!match) return false;

  const [, day, month, year] = match.map(Number);
  const moment = new Date(0);

  moment.setUTCFullYear(year, month - 1, day);

  return (
    year > 0 &&
    moment.getUTCFullYear() === year &&
    moment.getUTCMonth() === month - 1 &&
    moment.getUTCDate() === day
  );
}

export function toPurchaseInput(values: PurchaseFormValues): PurchaseInput {
  const [day, month, year] = values.date.split('/');

  return {
    club_id: Number(values.clubId),
    loyalty_until: `${year}-${month}-${day}T${values.time}-03:00`,
  };
}
