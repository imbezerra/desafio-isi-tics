export const FORMACOES = ['3-1', '2-2', '2-1-1', '1-2-1'] as const;
export type Formacao = (typeof FORMACOES)[number];

export const VAGAS_POR_FORMACAO: Record<
  Formacao,
  { defesa: number; meio: number; ataque: number }
> = {
  '3-1': { defesa: 3, meio: 0, ataque: 1 },
  '2-2': { defesa: 2, meio: 0, ataque: 2 },
  '2-1-1': { defesa: 2, meio: 1, ataque: 1 },
  '1-2-1': { defesa: 1, meio: 2, ataque: 1 },
};
