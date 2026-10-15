import Decimal from 'decimal.js';

import { PlayerAttributes, PlayerCondition, PlayerPosition } from '../domain.types';

import { roundMoney, decimal, clampMinimum } from './money.calculator';

const POSITION_WEIGHTS: Record<PlayerPosition, PlayerAttributes> = {
  GOL: { pace: 10, shooting: 0, passing: 20, dribbling: 0, defending: 40, physical: 30 },
  ZAG: { pace: 10, shooting: 0, passing: 15, dribbling: 0, defending: 45, physical: 30 },
  LAT: { pace: 25, shooting: 0, passing: 20, dribbling: 15, defending: 25, physical: 15 },
  MEI: { pace: 10, shooting: 15, passing: 35, dribbling: 25, defending: 5, physical: 10 },
  ATA: { pace: 20, shooting: 40, passing: 10, dribbling: 20, defending: 0, physical: 10 },
};

export function calculateOverall(position: PlayerPosition, attributes: PlayerAttributes): number {
  const weights = POSITION_WEIGHTS[position];
  const sum = (Object.keys(weights) as (keyof PlayerAttributes)[]).reduce(
    (accumulator, attribute) => accumulator.plus(attributes[attribute] * weights[attribute]),
    new Decimal(0),
  );

  return sum.dividedBy(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber();
}

export function calculateBaseValue(
  overall: number,
  potential: number,
  registrationAge: number,
): Decimal {
  const firstBracket = Math.max(0, Math.min(overall, 60) - 40);
  const secondBracket = Math.max(0, Math.min(overall, 75) - 60);
  const thirdBracket = Math.max(0, Math.min(overall, 99) - 75);
  let value = decimal(firstBracket)
    .times(0.5)
    .plus(secondBracket * 2)
    .plus(thirdBracket * 6);

  if (registrationAge <= 21) {
    value = value.times(
      decimal(100)
        .plus(potential - overall)
        .dividedBy(100),
    );
  }

  return clampMinimum(roundMoney(value), 1);
}

export function calculateMarketValue(
  baseValue: Decimal.Value,
  condition: PlayerCondition,
  agility: number,
  currentAge: number,
): Decimal {
  const conditionDiscount = calculateConditionDiscount(condition, agility);
  const ageAdjustment = currentAge <= 21 ? 10 : currentAge >= 32 ? -10 : 0;
  const totalRate = Math.max(-40, ageAdjustment - conditionDiscount);
  const value = decimal(baseValue).times(decimal(100).plus(totalRate)).dividedBy(100);

  return clampMinimum(roundMoney(value), 1);
}

function calculateConditionDiscount(condition: PlayerCondition, agility: number): number {
  const baseDiscount = condition === 'MAL_CONDICIONADO' ? 15 : condition === 'DOENTE' ? 30 : 0;

  if (baseDiscount === 0) {
    return 0;
  }

  if (agility >= 80) {
    return baseDiscount / 2;
  }

  return agility <= 30 ? baseDiscount + 10 : baseDiscount;
}
