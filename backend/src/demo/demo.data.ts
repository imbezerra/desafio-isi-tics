import { PlayerCondition, PlayerPosition } from '../common/domain.types';
import { CreatePlayerInput } from '../players/dto/player.dto';

type DemoPlayer = { input: CreatePlayerInput; condition: PlayerCondition };

function player(
  name: string,
  position: PlayerPosition,
  overrides: Partial<CreatePlayerInput> = {},
  condition: PlayerCondition = 'APTO',
): DemoPlayer {
  return {
    input: {
      name,
      position,
      age: 25,
      agility: 70,
      pace: 55,
      shooting: 55,
      passing: 55,
      dribbling: 55,
      defending: 55,
      physical: 55,
      potential: 90,
      ...overrides,
    },
    condition,
  };
}

export const DEMO_CLUBS = [
  { name: 'Águias FC', acronym: 'AGU' },
  { name: 'Delta FC', acronym: 'DFC' },
] as const;

export const DEMO_HOME_PLAYERS = [
  player('Rui Prado', 'GOL', { defending: 77, physical: 65, passing: 58 }),
  player('Téo Brandão', 'ZAG', { defending: 84 }),
  player('Davi Lins', 'LAT', { dribbling: 74, defending: 66 }, 'MAL_CONDICIONADO'),
  player('Lauro Neves', 'MEI', {
    passing: 82,
    dribbling: 75,
    shooting: 70,
    pace: 70,
    physical: 65,
  }),
  player('Otto Rangel', 'ATA', { shooting: 75, pace: 72, dribbling: 76, physical: 70 }),
];

export const DEMO_AWAY_PLAYERS = [
  player('Ivo Teles', 'GOL', { defending: 72, physical: 60 }),
  player('Hugo Vaz', 'ZAG', { defending: 84 }),
  player('Lino Matos', 'LAT', {
    dribbling: 79,
    defending: 63,
    passing: 65,
    pace: 70,
    physical: 60,
  }),
  player('Nei Soares', 'MEI', {
    passing: 70,
    dribbling: 73,
    shooting: 64,
    pace: 66,
    physical: 62,
  }),
  player('Ugo Falcão', 'ATA', { shooting: 81, pace: 72, dribbling: 70, physical: 70 }),
];

export const DEMO_FREE_PLAYERS = [
  player('Breno Silva', 'ATA', { age: 20, shooting: 78, pace: 80 }),
  player('Célia Torres', 'MEI', { passing: 76 }, 'MAL_CONDICIONADO'),
  player('Nilo Campos', 'GOL', { age: 36, defending: 90 }, 'DOENTE'),
];

export const DEMO_SOLD_PLAYER = player(
  'Caio Monteiro',
  'MEI',
  { pace: 70, shooting: 68, passing: 82, dribbling: 79, defending: 55, physical: 64 },
  'DOENTE',
);
