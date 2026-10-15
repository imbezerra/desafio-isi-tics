import { compareNames } from '../../common/formatters/text.formatter';

type StandingsClub = { id: number; name: string };
type StandingsScore = {
  homeClubId: number;
  awayClubId: number;
  homeGoals: number;
  awayGoals: number;
};
type StandingRow = {
  club_id: number;
  club_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
};

function recordScore(row: StandingRow, goalsScored: number, goalsConceded: number) {
  row.played += 1;
  row.goals_for += goalsScored;
  row.goals_against += goalsConceded;
  row.goal_difference = row.goals_for - row.goals_against;
  if (goalsScored > goalsConceded) {
    row.wins += 1;
    row.points += 3;
  } else if (goalsScored === goalsConceded) {
    row.draws += 1;
    row.points += 1;
  } else {
    row.losses += 1;
  }
}

export function calculateStandings(clubs: StandingsClub[], matches: StandingsScore[]) {
  const rows = new Map<number, StandingRow>(
    clubs.map((club) => [
      club.id,
      {
        club_id: club.id,
        club_name: club.name,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
      },
    ]),
  );
  for (const match of matches) {
    recordScore(rows.get(match.homeClubId)!, match.homeGoals, match.awayGoals);
    recordScore(rows.get(match.awayClubId)!, match.awayGoals, match.homeGoals);
  }
  return [...rows.values()]
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goal_difference - a.goal_difference ||
        b.goals_for - a.goals_for ||
        compareNames(a.club_name, b.club_name) ||
        a.club_id - b.club_id,
    )
    .map((row, index) => ({ position: index + 1, ...row }));
}
