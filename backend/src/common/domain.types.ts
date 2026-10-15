export const PLAYER_POSITIONS = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const;
export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

export const PLAYER_CONDITIONS = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'] as const;
export type PlayerCondition = (typeof PLAYER_CONDITIONS)[number];

export type PlayerAttributes = {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
};
