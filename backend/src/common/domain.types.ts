export const POSICOES = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const;
export type Posicao = (typeof POSICOES)[number];

export const CONDICOES = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'] as const;
export type Condicao = (typeof CONDICOES)[number];

export type AtributosJogador = {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
};
