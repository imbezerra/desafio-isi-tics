export type CreateClubInput = { name: string; acronym: string };

export const CLUB_SORT_OPTIONS = ['name', 'net_worth_asc', 'net_worth_desc'] as const;
export type ClubSort = (typeof CLUB_SORT_OPTIONS)[number];
