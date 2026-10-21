import { PrismaClient } from '@prisma/client';

import { CreateClubPipe } from '../clubs/pipes/clubs.input';
import { ClubsRepository } from '../clubs/repositories/clubs.repository';
import { ClubsService } from '../clubs/services/clubs.service';
import { PlayerCondition } from '../common/domain.types';
import { formatBrasiliaDateTime } from '../common/parsers/date.parser';
import { LineupInputPipe } from '../league/pipes/lineup.input';
import { MatchInputPipe } from '../league/pipes/matches.input';
import { LineupsRepository } from '../league/repositories/lineups.repository';
import { MatchesRepository } from '../league/repositories/matches.repository';
import { LineupsService } from '../league/services/lineups.service';
import { MatchesService } from '../league/services/matches.service';
import { PurchaseInputPipe } from '../market/pipes/purchase.input';
import { MarketRepository } from '../market/repositories/market.repository';
import { MarketService } from '../market/services/market.service';
import { CreatePlayerInput } from '../players/dto/player.dto';
import { CreatePlayerPipe, PlayerConditionPipe } from '../players/pipes/players.input';
import { PlayersRepository } from '../players/repositories/players.repository';
import { PlayersService } from '../players/services/players.service';
import {
  DEMO_AWAY_PLAYERS,
  DEMO_CLUBS,
  DEMO_FREE_PLAYERS,
  DEMO_HOME_PLAYERS,
  DEMO_SOLD_PLAYER,
} from './demo.data';
import { DemoRepository } from './demo.repository';

export function seedDemo(database: PrismaClient) {
  return new DemoRepository(database).withEmptyDatabase(async (transaction) => {
    const clubs = new ClubsService(new ClubsRepository(transaction));
    const players = new PlayersService(new PlayersRepository(transaction));
    const market = new MarketService(new MarketRepository(transaction));
    const lineups = new LineupsService(new LineupsRepository(transaction));
    const matches = new MatchesService(new MatchesRepository(transaction));
    const loyaltyUntil = formatBrasiliaDateTime(new Date(Date.now() + 90 * 86_400_000)).replace(
      /:\d{2}-03:00$/,
      '-03:00',
    );

    async function setCondition(id: number, condition: PlayerCondition) {
      await players.updateCondition(id, new PlayerConditionPipe().transform({ condition }));
    }

    async function createPlayer(demo: { input: CreatePlayerInput; condition: PlayerCondition }) {
      const player = await players.create(new CreatePlayerPipe().transform(demo.input));
      if (demo.condition !== 'APTO') await setCondition(player.id, demo.condition);
      return player.id;
    }

    async function buy(id: number, clubId: number) {
      await market.buy(
        id,
        new PurchaseInputPipe().transform({ club_id: clubId, loyalty_until: loyaltyUntil }),
      );
    }

    const home = await clubs.create(new CreateClubPipe().transform(DEMO_CLUBS[0]));
    const away = await clubs.create(new CreateClubPipe().transform(DEMO_CLUBS[1]));
    for (const [club, squad] of [
      [home, DEMO_HOME_PLAYERS],
      [away, DEMO_AWAY_PLAYERS],
    ] as const) {
      const playerIds: number[] = [];
      for (const demo of squad) {
        const id = await createPlayer(demo);
        await buy(id, club.id);
        playerIds.push(id);
      }
      await lineups.setLineup(
        club.id,
        new LineupInputPipe().transform({ formation: '2-1-1', player_ids: playerIds }),
      );
    }

    for (const demo of DEMO_FREE_PLAYERS) await createPlayer(demo);

    const soldPlayerId = await createPlayer(DEMO_SOLD_PLAYER);
    await buy(soldPlayerId, home.id);
    await setCondition(soldPlayerId, 'MAL_CONDICIONADO');
    await setCondition(soldPlayerId, 'APTO');
    await market.sell(soldPlayerId);

    const match = await matches.play(
      new MatchInputPipe().transform({ home_club_id: home.id, away_club_id: away.id }),
    );
    return {
      clubIds: [home.id, away.id],
      playerCount:
        DEMO_HOME_PLAYERS.length + DEMO_AWAY_PLAYERS.length + DEMO_FREE_PLAYERS.length + 1,
      matchId: match.id,
    };
  });
}
