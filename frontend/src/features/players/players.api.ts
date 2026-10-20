import { apiGet, apiWrite } from '../../shared/api/client';
import type { Player, PlayerList, PlayerCondition } from '../../shared/api/contracts';
import { normalizeTextSpaces } from '../../shared/validation/text';

export type EditPlayerInput = Pick<Player, 'name' | 'position' | 'age' | 'agility'>;

export type CreatePlayerInput = EditPlayerInput &
  Pick<
    Player,
    'pace' | 'shooting' | 'passing' | 'dribbling' | 'defending' | 'physical' | 'potential'
  >;

export function getPlayer(id: number, signal: AbortSignal) {
  return apiGet<Player>(`/players/${id}`, signal);
}

export function createPlayer(input: CreatePlayerInput) {
  return apiWrite<Player>('POST', '/players', input);
}

export function editPlayer(id: number, input: EditPlayerInput) {
  return apiWrite<Player>('PUT', `/players/${id}`, input);
}

export function changePlayerCondition(id: number, condition: PlayerCondition) {
  return apiWrite<Player>('PATCH', `/players/${id}/condition`, { condition });
}

export function deletePlayer(id: number) {
  return apiWrite<void>('DELETE', `/players/${id}`);
}

export interface PlayerFilters {
  search: string;
  position: string;
  condition: string;
  free: string;
  clubId: string;
  minAge: string;
  maxAge: string;
  minValue: string;
  maxValue: string;
  sort: string;
}

export const initialFilters: PlayerFilters = {
  search: '',
  position: '',
  condition: '',
  free: '',
  clubId: '',
  minAge: '',
  maxAge: '',
  minValue: '',
  maxValue: '',
  sort: 'name',
};

export function buildPlayersQuery(filters: PlayerFilters, page: number) {
  const query = new URLSearchParams({ page: String(page), limit: '10', sort: filters.sort });
  const values = {
    search: normalizeTextSpaces(filters.search),
    position: filters.position,
    condition: filters.condition,
    free: filters.free,
    club_id: filters.clubId,
    min_age: filters.minAge,
    max_age: filters.maxAge,
    min_value: filters.minValue,
    max_value: filters.maxValue,
  };

  for (const [key, value] of Object.entries(values)) if (value !== '') query.set(key, value);

  return query.toString();
}

export function getPlayers(filters: PlayerFilters, page: number, signal: AbortSignal) {
  return apiGet<PlayerList>(`/players?${buildPlayersQuery(filters, page)}`, signal);
}
