import { describe, expect, it } from 'vitest';
import { getHistoryPlayers } from '../../../../src/features/market/history/history-options';
import { history } from '../../../fixtures/history.fixture';

describe('Opções de jogadores do histórico', () => {
  it('inclui vendidos e mantém um registro por id com o nome da transação mais recente', () => {
    expect(getHistoryPlayers(history.data)).toEqual([
      { id: 2, name: 'Meia Lua' },
      { id: 3, name: 'Renan Castro' },
      { id: 4, name: 'Lucas Ferraz' },
    ]);
  });

  it('não mistura jogadores diferentes com o mesmo nome', () => {
    expect(
      getHistoryPlayers(
        history.data
          .slice(0, 2)
          .map((transaction) => ({ ...transaction, player_name: 'Mesmo Nome' })),
      ),
    ).toHaveLength(2);
  });
});
