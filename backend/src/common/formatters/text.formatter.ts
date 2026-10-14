export function normalizarTexto(valor: string): string {
  return valor.replace(/^ +| +$/g, '').replace(/ {2,}/g, ' ');
}

export function removerAcentos(valor: string): string {
  return valor.normalize('NFD').replace(/\p{Mn}/gu, '');
}

export function normalizarNomeClube(valor: string): string {
  return normalizarTexto(valor).toLocaleLowerCase('pt-BR');
}

export function normalizarParaOrdenacao(valor: string): string {
  return removerAcentos(normalizarTexto(valor).toLocaleLowerCase('pt-BR'));
}

export function possuiCaractereDeControle(valor: string): boolean {
  return /\p{Cc}/u.test(valor);
}
