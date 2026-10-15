import Decimal from 'decimal.js';

Decimal.set({ precision: 24, rounding: Decimal.ROUND_HALF_UP });

export function decimal(value: Decimal.Value): Decimal {
  return new Decimal(value);
}

export function roundMoney(value: Decimal.Value): Decimal {
  return decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function clampMinimum(value: Decimal.Value, minimum: Decimal.Value): Decimal {
  return Decimal.max(decimal(value), decimal(minimum));
}
