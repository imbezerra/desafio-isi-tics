import { apiGet, apiWrite } from '../../shared/api/client';
import type { Club } from '../../shared/api/contracts';

export const clubSortOptions = {
  name: 'Nome (A–Z)',
  net_worth_desc: 'Patrimônio (maior para o menor)',
  net_worth_asc: 'Patrimônio (menor para o maior)',
};

export type ClubSort = keyof typeof clubSortOptions;

export type CreateClubInput = Pick<Club, 'name' | 'acronym'>;

export function getClubs(sort: ClubSort = 'name', signal?: AbortSignal) {
  return apiGet<Club[]>(`/clubs?${new URLSearchParams({ sort })}`, signal);
}

export function createClub(input: CreateClubInput) {
  return apiWrite<Club>('POST', '/clubs', input);
}
