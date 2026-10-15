import { PLAYER_POSITIONS } from '../../common/domain.types';
import { compareNames, normalizeForSorting } from '../../common/formatters/text.formatter';
import { PlayerQuery, PlayerSort } from '../dto/player.dto';

type ListedPlayer = {
  id: number;
  name: string;
  age: number;
  position: (typeof PLAYER_POSITIONS)[number];
  market_value: number;
};

function compare(a: ListedPlayer, b: ListedPlayer, criterion: PlayerSort): number {
  switch (criterion) {
    case 'value_asc':
      return a.market_value - b.market_value;
    case 'value_desc':
      return b.market_value - a.market_value;
    case 'age_asc':
      return a.age - b.age;
    case 'age_desc':
      return b.age - a.age;
    case 'position':
      return PLAYER_POSITIONS.indexOf(a.position) - PLAYER_POSITIONS.indexOf(b.position);
    case 'name':
      return compareNames(a.name, b.name);
  }
}

export function buildPlayerList<T extends ListedPlayer>(players: T[], query: PlayerQuery) {
  const searchText = query.search === undefined ? undefined : normalizeForSorting(query.search);
  const filteredPlayers = players.filter(
    (player) =>
      (searchText === undefined || normalizeForSorting(player.name).includes(searchText)) &&
      player.market_value >= query.minValue &&
      player.market_value <= query.maxValue,
  );
  filteredPlayers.sort((a, b) => {
    for (const criterion of query.sort) {
      const result = compare(a, b, criterion);
      if (result !== 0) return result;
    }
    return compare(a, b, 'name') || a.id - b.id;
  });
  const start = (query.page - 1) * query.limit;
  return {
    data: filteredPlayers.slice(start, start + query.limit),
    meta: {
      page: query.page,
      limit: query.limit,
      total_items: filteredPlayers.length,
      total_pages: Math.ceil(filteredPlayers.length / query.limit),
    },
  };
}
