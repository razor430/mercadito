import { fallbackCurrencies } from "@/lib/fallback-data";
import type { CurrencyRate } from "@/lib/types";
import { fetchJson } from "./http";

type BcraCatalogItem = {
  idVariable: number;
  descripcion: string;
  ultValorInformado?: number;
  ultFechaInformado?: string;
};

type BcraCatalog = {
  results: BcraCatalogItem[];
};

function pickSeries(items: BcraCatalogItem[], match: RegExp, min: number, max: number) {
  return items.find((item) => match.test(item.descripcion) && Number(item.ultValorInformado) >= min && Number(item.ultValorInformado) <= max);
}

export async function getBcraMacroCards() {
  try {
    const data = await fetchJson<BcraCatalog>("https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias?Limit=3000");
    const byId = new Map(data.results.map((item) => [item.idVariable, item]));
    const oficial =
      pickSeries(data.results, /tipo de cambio|d[oó]lar/i, 100, 10000) ??
      byId.get(4) ??
      byId.get(5);
    const tasa =
      pickSeries(data.results, /pol[ií]tica monetaria|pases pasivos|badlar|plazo fijo/i, 0, 200) ??
      { ultValorInformado: 40, ultFechaInformado: new Date().toISOString() };
    const reservas = pickSeries(data.results, /reservas internacionales/i, 1000, 500000) ?? byId.get(1);
    return {
      oficial: oficial?.ultValorInformado,
      tasaPolitica: tasa?.ultValorInformado,
      reservas: reservas?.ultValorInformado,
      updatedAt: oficial?.ultFechaInformado ?? new Date().toISOString()
    };
  } catch {
    return {
      oficial: fallbackCurrencies.find((item) => item.symbol === "USDARS")?.price,
      tasaPolitica: 40,
      reservas: 29_400,
      updatedAt: new Date().toISOString()
    };
  }
}

export async function getBcraCurrency(): Promise<CurrencyRate> {
  const macro = await getBcraMacroCards();
  return {
    symbol: "USDARS",
    name: "Dólar oficial",
    price: macro.oficial ?? 0,
    change: 0,
    changePercent: 0,
    source: "BCRA",
    updatedAt: macro.updatedAt
  };
}
