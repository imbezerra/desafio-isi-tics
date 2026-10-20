export interface MatchFormValues {
  homeId: string;
  awayId: string;
}

export function validateMatchForm(values: MatchFormValues) {
  const errors: Partial<Record<keyof MatchFormValues, string>> = {};

  if (!values.homeId) errors.homeId = 'Selecione o mandante.';

  if (!values.awayId) errors.awayId = 'Selecione o visitante.';

  return errors;
}

export function matchDetailPath(id: number, clubId = '') {
  const query = clubId ? `?${new URLSearchParams({ club_id: clubId })}` : '';

  return `/matches/${id}${query}`;
}
