import { PlayerPosition, PLAYER_POSITIONS } from '../domain.types';
import { compareNames } from '../formatters/text.formatter';

type SortablePlayer = { id: number; name: string; position: PlayerPosition };

export function sortSquad<T extends SortablePlayer>(players: T[]): T[] {
  return [...players].sort(
    (a, b) =>
      PLAYER_POSITIONS.indexOf(a.position) - PLAYER_POSITIONS.indexOf(b.position) ||
      compareNames(a.name, b.name) ||
      a.id - b.id,
  );
}
