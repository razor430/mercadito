import { fallbackBonds, fallbackCurrencies, fallbackStocks } from "@/lib/fallback-data";
import type { BondMetric, CurrencyRate, QuoteSnapshot } from "@/lib/types";
import { fetchJson } from "./http";

type Data912Row = Record<string, string | number | null | undefined>;

const base = "https://data912.com";

function num(value: unknown) {
  const parsed = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function rowToQuote(row: Data912Row, type: QuoteSnapshot["type"], market = "BYMA"): QuoteSnapshot {
  const price = num(row.c ?? row.price ?? row.last ?? row.close ?? row.ultimo) ?? 0;
  const previous = num(row.pc ?? row.previousClose ?? row.previous_close ?? row.prev);
  const change = num(row.change ?? row.var_abs) ?? (previous ? price - previous : 0);
  const changePercent = num(row.pct_change ?? row.changePercent ?? row.var ?? row.dr) ?? (previous ? (change / previous) * 100 : 0);
  const symbol = String(row.symbol ?? row.ticker ?? row.s ?? "N/D");
  return {
    symbol,
    name: String(row.name ?? row.description ?? symbol),
    type,
    market,
    currency: String(row.currency ?? row.ccy ?? "ARS"),
    price,
    open: num(row.o ?? row.open),
    high: num(row.h ?? row.high),
    low: num(row.l ?? row.low),
    close: price,
    previousClose: previous,
    change,
    changePercent,
    volume: num(row.v ?? row.volume),
    sector: String(row.sector ?? ""),
    source: "Data912",
    updatedAt: new Date().toISOString()
  };
}

export async function getData912Stocks(): Promise<QuoteSnapshot[]> {
  try {
    const [stocks, cedears] = await Promise.all([
      fetchJson<Data912Row[]>(`${base}/live/arg_stocks`),
      fetchJson<Data912Row[]>(`${base}/live/arg_cedears`)
    ]);
    return [...stocks.map((row) => rowToQuote(row, "stock")), ...cedears.slice(0, 30).map((row) => rowToQuote(row, "cedear"))].filter(
      (item) => item.price > 0
    );
  } catch {
    return fallbackStocks;
  }
}

export async function getData912Bonds(): Promise<BondMetric[]> {
  try {
    const rows = await fetchJson<Data912Row[]>(`${base}/live/arg_bonds`);
    const mapped: BondMetric[] = rows.map((row) => ({
      ...rowToQuote(row, "bond"),
      type: "bond" as const,
      yield: num(row.tir ?? row.yield),
      duration: num(row.duration ?? row.md),
      maturityDate: typeof row.maturity === "string" ? row.maturity : undefined
    }));
    const variantParity = new Map<string, number>();
    for (const bond of mapped) {
      const isUsdVariant = /[CD]$/.test(bond.symbol) && bond.price > 0 && bond.price < 1000;
      if (isUsdVariant) variantParity.set(bond.symbol.replace(/[CD]$/, ""), bond.price);
    }
    return mapped.slice(0, 120).map((bond) => ({
      ...bond,
      parity: bond.price > 0 && bond.price < 1000 ? bond.price : variantParity.get(bond.symbol.replace(/[CDXYZ]$/, ""))
    }));
  } catch {
    return fallbackBonds;
  }
}

export async function getData912Currencies(): Promise<CurrencyRate[]> {
  try {
    const [mep, ccl] = await Promise.all([fetchJson<Data912Row[]>(`${base}/live/mep`), fetchJson<Data912Row[]>(`${base}/live/ccl`)]);
    const rows = [
      ...(Array.isArray(mep) ? mep.slice(0, 1) : []),
      ...(Array.isArray(ccl) ? ccl.slice(0, 1) : [])
    ];
    const mapped = rows.map((row, index) => {
      const price = num(row.c ?? row.price ?? row.last ?? row.value) ?? fallbackCurrencies[index].price;
      const previous = num(row.pc ?? row.prev);
      const change = previous ? price - previous : num(row.change) ?? 0;
      return {
        symbol: index === 0 ? "USDMEP" : "USDCCL",
        name: index === 0 ? "Dólar MEP" : "Dólar CCL",
        price,
        change,
        changePercent: previous ? (change / previous) * 100 : num(row.pct_change ?? row.var) ?? 0,
        source: "Data912" as const,
        updatedAt: new Date().toISOString()
      };
    });
    return mapped.length ? mapped : fallbackCurrencies.slice(0, 2);
  } catch {
    return fallbackCurrencies.slice(0, 2);
  }
}
