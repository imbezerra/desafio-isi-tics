import { Player } from '@prisma/client';

import { PlayerCondition, PlayerPosition } from '../../common/domain.types';
import {
  calculateOverall,
  calculateMarketValue,
} from '../../common/calculations/player-value.calculator';

export function presentPlayer(player: Player) {
  const attributes = {
    pace: player.pace,
    shooting: player.shooting,
    passing: player.passing,
    dribbling: player.dribbling,
    defending: player.defending,
    physical: player.physical,
  };
  return {
    id: player.id,
    name: player.name,
    position: player.position as PlayerPosition,
    agility: player.agility,
    age: player.age,
    condition: player.condition as PlayerCondition,
    base_value: player.baseValue.toNumber(),
    market_value: calculateMarketValue(
      player.baseValue.toString(),
      player.condition as PlayerCondition,
      player.agility,
      player.age,
    ).toNumber(),
    ...attributes,
    potential: player.potential,
    overall: calculateOverall(player.position as PlayerPosition, attributes),
    club_id: player.clubId,
  };
}

export type PlayerResponse = ReturnType<typeof presentPlayer>;
