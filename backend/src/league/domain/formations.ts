export const FORMATIONS = ['3-1', '2-2', '2-1-1', '1-2-1'] as const;
export type Formation = (typeof FORMATIONS)[number];

export const FORMATION_SLOTS: Record<
  Formation,
  { defending: number; midfield: number; attack: number }
> = {
  '3-1': { defending: 3, midfield: 0, attack: 1 },
  '2-2': { defending: 2, midfield: 0, attack: 2 },
  '2-1-1': { defending: 2, midfield: 1, attack: 1 },
  '1-2-1': { defending: 1, midfield: 2, attack: 1 },
};
