import Decimal from 'decimal.js';

Decimal.set({ precision: 24, rounding: Decimal.ROUND_HALF_UP });

export function decimal(valor: Decimal.Value): Decimal {
  return new Decimal(valor);
}

export function arredondarMoeda(valor: Decimal.Value): Decimal {
  return decimal(valor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function limitarMinimo(valor: Decimal.Value, minimo: Decimal.Value): Decimal {
  return Decimal.max(decimal(valor), decimal(minimo));
}
