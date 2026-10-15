import { Player } from '@prisma/client';

import { sortSquad } from '../../common/orderings/squad.ordering';
import { presentPlayer } from '../../players/presenters/player.presenter';

type ClubWithLineup = {
  id: number;
  formation: string | null;
  lineups: { player: Player }[];
};

export function presentLineup(club: ClubWithLineup) {
  const players = sortSquad(club.lineups.map((item) => presentPlayer(item.player)));
  return { club_id: club.id, formation: club.formation, complete: players.length === 5, players };
}
