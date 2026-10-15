import { presentPlayer } from '../../players/presenters/player.presenter';
import { decimal } from '../../common/calculations/money.calculator';
import { sortSquad } from '../../common/orderings/squad.ordering';
import { formatBrasiliaDateTime } from '../../common/parsers/date.parser';
import { ClubWithSquad } from '../repositories/clubs.repository';
import { calculateLoyalty } from '../../market/domain/loyalty.rules';

export function presentClub(club: ClubWithSquad, includeSquad = false, moment = new Date()) {
  const players = club.players.map(presentPlayer);
  const squadValue = players.reduce((sum, player) => sum.plus(player.market_value), decimal(0));
  const netWorth = decimal(club.cash.toString()).plus(squadValue);
  const response = {
    id: club.id,
    name: club.name,
    acronym: club.acronym,
    cash: club.cash.toNumber(),
    squad_value: squadValue.toNumber(),
    net_worth: netWorth.toNumber(),
  };
  if (!includeSquad) return response;

  return {
    ...response,
    players: sortSquad(
      players.map((player) => ({
        ...player,
        contract: presentContract(club, player.id, moment),
      })),
    ),
  };
}

function presentContract(club: ClubWithSquad, playerId: number, moment: Date) {
  const contract = club.players.find((player) => player.id === playerId)?.contracts[0];
  if (!contract) return null;
  const loyalty = calculateLoyalty(contract.loyaltyUntil, moment);
  return {
    purchase_value: contract.purchaseValue.toNumber(),
    loyalty_until: formatBrasiliaDateTime(contract.loyaltyUntil),
    remaining_days: loyalty.remainingDays,
    penalty_rate: loyalty.penaltyRate,
  };
}

export type ClubResponse = ReturnType<typeof presentClub>;
