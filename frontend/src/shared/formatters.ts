const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const brasiliaDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'Etc/GMT+3',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const brasiliaTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'Etc/GMT+3',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

export function formatBrasiliaDateTime(value: string) {
  const moment = new Date(value);

  return {
    date: brasiliaDateFormatter.format(moment),
    time: brasiliaTimeFormatter.format(moment),
  };
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => Array.from(part)[0])
    .slice(0, 2)
    .join('');
}
