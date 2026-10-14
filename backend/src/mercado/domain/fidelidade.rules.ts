const DURACAO_DIA_MS = 24 * 60 * 60 * 1000;

export function calcularFidelidade(fim: Date, momento: Date) {
  const diasRestantes = Math.max(
    0,
    Math.ceil((fim.getTime() - momento.getTime()) / DURACAO_DIA_MS),
  );
  const percentualMulta =
    diasRestantes === 0 ? 0 : diasRestantes <= 30 ? 5 : diasRestantes <= 180 ? 10 : 20;
  return { diasRestantes, percentualMulta };
}
