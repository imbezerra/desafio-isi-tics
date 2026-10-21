import { CreateClubPipe } from '../../../src/clubs/pipes/clubs.input';
import {
  DEMO_AWAY_PLAYERS,
  DEMO_CLUBS,
  DEMO_FREE_PLAYERS,
  DEMO_HOME_PLAYERS,
  DEMO_SOLD_PLAYER,
} from '../../../src/demo/demo.data';
import { CreatePlayerPipe, PlayerConditionPipe } from '../../../src/players/pipes/players.input';

describe('dados demonstrativos', () => {
  it('mantém os dois clubes válidos pelas mesmas regras de entrada da API', () => {
    expect(DEMO_CLUBS).toHaveLength(2);
    for (const club of DEMO_CLUBS) {
      expect(new CreateClubPipe().transform(club)).toEqual(club);
    }
  });

  it('mantém os quatorze jogadores e suas condições válidos pelos pipes da API', () => {
    const players = [
      ...DEMO_HOME_PLAYERS,
      ...DEMO_AWAY_PLAYERS,
      ...DEMO_FREE_PLAYERS,
      DEMO_SOLD_PLAYER,
    ];

    expect(players).toHaveLength(14);
    for (const player of players) {
      expect(new CreatePlayerPipe().transform(player.input)).toEqual(player.input);
      expect(new PlayerConditionPipe().transform({ condition: player.condition })).toBe(
        player.condition,
      );
    }
    expect(new Set(DEMO_FREE_PLAYERS.map((player) => player.condition))).toEqual(
      new Set(['APTO', 'MAL_CONDICIONADO', 'DOENTE']),
    );
  });
});
