import type { BondMetric } from "@/lib/types";

function normalizedSymbol(bond: BondMetric) {
  return bond.symbol.trim().toUpperCase();
}

function normalizedCurrency(bond: BondMetric) {
  return bond.currency.trim().toUpperCase();
}

export function isFeaturedDollarBond(bond: BondMetric) {
  const symbol = normalizedSymbol(bond);
  return /^(AL|GD).+D$/.test(symbol) || symbol === "AE38D";
}

export function isPesoBond(bond: BondMetric) {
  const symbol = normalizedSymbol(bond);
  const currency = normalizedCurrency(bond);
  const looksLikeDollarSpecies = /[CDYZ]$/.test(symbol) && bond.price > 0 && bond.price < 1_000;

  return currency === "ARS" && !looksLikeDollarSpecies;
}
