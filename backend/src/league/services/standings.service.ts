import { Injectable } from '@nestjs/common';

import { calculateStandings } from '../domain/standings.rules';
import { MatchesRepository } from '../repositories/matches.repository';

@Injectable()
export class StandingsService {
  constructor(private readonly repository: MatchesRepository) {}

  get() {
    return this.repository.withTransaction(async (repository) => {
      const clubs = await repository.listStandingsClubs();
      const matches = await repository.listStandingsScores();
      return calculateStandings(clubs, matches);
    });
  }
}
