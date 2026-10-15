import { calculateStandings } from '../../../../src/league/domain/standings.rules';

describe('classificação conforme RN21', () => {
  it('reproduz o exemplo com seis clubes e desempates por saldo, gols e nome', () => {
    const clubs = [
      { id: 1, name: 'Águias FC' },
      { id: 2, name: 'Delta FC' },
      { id: 3, name: 'Gama SC' },
      { id: 4, name: 'Épsilon EC' },
      { id: 5, name: 'Mangue FC' },
      { id: 6, name: 'Tubarões EC' },
    ];
    const matches = [
      { homeClubId: 1, awayClubId: 2, homeGoals: 1, awayGoals: 2 },
      { homeClubId: 3, awayClubId: 4, homeGoals: 2, awayGoals: 1 },
      { homeClubId: 4, awayClubId: 1, homeGoals: 3, awayGoals: 2 },
      { homeClubId: 2, awayClubId: 3, homeGoals: 0, awayGoals: 1 },
    ];
    const table = calculateStandings(clubs, matches);
    expect(
      table.map((c) => [c.position, c.club_id, c.points, c.goal_difference, c.goals_for]),
    ).toEqual([
      [1, 3, 6, 2, 3],
      [2, 4, 3, 0, 4],
      [3, 2, 3, 0, 2],
      [4, 5, 0, 0, 0],
      [5, 6, 0, 0, 0],
      [6, 1, 0, -2, 3],
    ]);
    expect(table[0]).toMatchObject({ played: 2, wins: 2, draws: 0, losses: 0, goals_against: 1 });
    expect(table[5]).toMatchObject({ played: 2, wins: 0, draws: 0, losses: 2, goals_against: 5 });
    expect(matches).toHaveLength(4);
  });

  it('pontua empates e desempata nomes equivalentes pelo id', () => {
    const clubs = [
      { id: 2, name: 'Águias FC' },
      { id: 1, name: 'Aguias FC' },
    ];
    const table = calculateStandings(clubs, [
      { homeClubId: 1, awayClubId: 2, homeGoals: 2, awayGoals: 2 },
    ]);
    expect(table.map((c) => c.club_id)).toEqual([1, 2]);
    expect(table[0]).toMatchObject({
      points: 1,
      draws: 1,
      played: 1,
      goals_for: 2,
      goals_against: 2,
    });
    expect(calculateStandings([], [])).toEqual([]);
  });
});
