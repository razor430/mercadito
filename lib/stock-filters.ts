import type { QuoteSnapshot } from "@/lib/types";

export function isMervalStock(stock: QuoteSnapshot) {
  const symbol = stock.symbol.trim().toUpperCase();
  const isLeadingPanelSource = stock.source === "BYMA" || stock.source === "Fallback";
  const isDollarSpecies = symbol.endsWith("D") && symbol !== "YPFD";

  return stock.type === "stock" && isLeadingPanelSource && stock.currency.toUpperCase() === "ARS" && !isDollarSpecies;
}

export function isGeneralPanelStock(stock: QuoteSnapshot) {
  return stock.type === "stock" && !isMervalStock(stock);
}
