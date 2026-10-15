import { PlayerAttributes, PlayerCondition, PlayerPosition } from '../../common/domain.types';

export type UpdatePlayerInput = {
  name: string;
  position: PlayerPosition;
  agility: number;
  age: number;
};
export type CreatePlayerInput = UpdatePlayerInput & PlayerAttributes & { potential: number };

export const PLAYER_SORT_OPTIONS = [
  'name',
  'value_asc',
  'value_desc',
  'age_asc',
  'age_desc',
  'position',
] as const;
export type PlayerSort = (typeof PLAYER_SORT_OPTIONS)[number];

export type PlayerQuery = {
  search?: string;
  position?: PlayerPosition;
  condition?: PlayerCondition;
  free?: boolean;
  clubId?: number;
  minAge: number;
  maxAge: number;
  minValue: number;
  maxValue: number;
  sort: PlayerSort[];
  page: number;
  limit: number;
};
