import { Injectable, NotFoundException } from '@nestjs/common';

import { calculateHistorySummary } from '../domain/history-summary';
import { HistoryQuery } from '../dto/history.dto';
import { presentHistoryCsv } from '../presenters/history-csv.presenter';
import { presentTransaction } from '../presenters/transaction.presenter';
import { HistoryRepository } from '../repositories/history.repository';

@Injectable()
export class HistoryService {
  constructor(private readonly repository: HistoryRepository) {}

  async list(clubId: number, query: HistoryQuery) {
    const data = await this.getTransactions(clubId, query);
    return { data, summary: calculateHistorySummary(data) };
  }

  async exportCsv(clubId: number, query: HistoryQuery): Promise<string> {
    return presentHistoryCsv(await this.getTransactions(clubId, query));
  }

  private async getTransactions(clubId: number, query: HistoryQuery) {
    if (!(await this.repository.clubExists(clubId))) {
      throw new NotFoundException('Clube não encontrado.');
    }
    if (
      query.playerId !== undefined &&
      !(await this.repository.activePlayerExists(query.playerId))
    ) {
      throw new NotFoundException('Jogador não encontrado.');
    }
    return (await this.repository.list(clubId, query)).map(presentTransaction);
  }
}
