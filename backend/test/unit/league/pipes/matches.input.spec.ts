import { BadRequestException } from '@nestjs/common';
import { MatchInputPipe } from '../../../../src/league/pipes/matches.input';
import { MatchesQueryPipe } from '../../../../src/league/pipes/matches.query';

describe('validação de partidas', () => {
  const input = new MatchInputPipe();
  const query = new MatchesQueryPipe();

  it('aceita clubes distintos e ignora campos controlados', () => {
    expect(input.transform({ home_club_id: 1, away_club_id: 2, goals: 10 })).toEqual({
      homeClubId: 1,
      awayClubId: 2,
    });
    expect(query.transform({ extra: 'x' })).toEqual({});
    expect(query.transform({ club_id: '2' })).toEqual({ clubId: 2 });
  });

  it.each([
    null,
    [],
    {},
    { home_club_id: 1, away_club_id: 1 },
    { home_club_id: '1', away_club_id: 2 },
    { home_club_id: 0, away_club_id: 2 },
    { home_club_id: 1, away_club_id: 1.5 },
  ])('recusa corpo inválido: %j', (value) => {
    expect(() => input.transform(value)).toThrow(BadRequestException);
  });

  it.each(['', '01', '-1', '1.0', '1e2', ['1']])('recusa filtro inválido: %j', (club_id) => {
    expect(() => query.transform({ club_id })).toThrow(BadRequestException);
  });
});
