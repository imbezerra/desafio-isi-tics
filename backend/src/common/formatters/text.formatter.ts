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

export function compararNomes(primeiroNome: string, segundoNome: string): number {
  const primeiro = [...normalizarParaOrdenacao(primeiroNome)];
  const segundo = [...normalizarParaOrdenacao(segundoNome)];
  for (let indice = 0; indice < Math.min(primeiro.length, segundo.length); indice++) {
    const diferenca = primeiro[indice].codePointAt(0)! - segundo[indice].codePointAt(0)!;
    if (diferenca !== 0) return diferenca;
  }
  return primeiro.length - segundo.length;
}

export function possuiCaractereDeControle(valor: string): boolean {
  return /\p{Cc}/u.test(valor);
}
