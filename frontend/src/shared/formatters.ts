const moneyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => Array.from(part)[0])
    .slice(0, 2)
    .join('');
}
