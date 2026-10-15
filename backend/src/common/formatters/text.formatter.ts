export function normalizeText(value: string): string {
  return value.replace(/^ +| +$/g, '').replace(/ {2,}/g, ' ');
}

export function removeAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{Mn}/gu, '');
}

export function normalizeClubName(value: string): string {
  return normalizeText(value).toLocaleLowerCase('pt-BR');
}

export function normalizeForSorting(value: string): string {
  return removeAccents(normalizeText(value).toLocaleLowerCase('pt-BR'));
}

export function compareNames(firstName: string, secondName: string): number {
  const first = [...normalizeForSorting(firstName)];
  const second = [...normalizeForSorting(secondName)];
  for (let index = 0; index < Math.min(first.length, second.length); index++) {
    const difference = first[index].codePointAt(0)! - second[index].codePointAt(0)!;
    if (difference !== 0) return difference;
  }
  return first.length - second.length;
}

export function hasControlCharacter(value: string): boolean {
  return /\p{Cc}/u.test(value);
}
