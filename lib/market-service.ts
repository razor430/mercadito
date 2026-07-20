import { cached, ttl } from "@/lib/cache";
import { isFeaturedDollarBond } from "@/lib/bond-filters";
import {
  fallbackArgentinaIndicators,
  fallbackCommodities,
  fallbackFunds,
  fallbackHistory,
  fallbackOverview,
  fallbackSearch
} from "@/lib/fallback-data";
import type { ArgentinaIndicator, BondMetric, FundHolding, HistoricalBar, InstrumentDetail, MarketOverview, QuoteSnapshot } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { getBcraCurrency, getBcraMacroCards } from "./providers/bcra";
import { getBymaBondInfo, getBymaBonds, getBymaCedears, getBymaHistory, getBymaIndexHistory, getBymaStocks } from "./providers/byma";
import { getCountryRisk } from "./providers/argentina-datos";
import { getData912Bonds, getData912StockHistory, getData912Stocks } from "./providers/data912";
import { getDolarApiFinancialCurrencies } from "./providers/dolarapi";
import { getMaeBondCashFlow, getMaeBondMetrics } from "./providers/mae";
import { getTradingViewNews, searchTradingView } from "./providers/tradingview";
import { getYahooCommodities, getYahooHistory } from "./providers/yahoo";
import { getBinanceCryptoBasis } from "./providers/binance";
import { getCafciFundHoldings, getCafciFunds } from "./providers/cafci";

function bySymbol<T extends { symbol: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.symbol, item])).values());
}

export function getStocks() {
  return cached("stocks", ttl.live, async () => {
    const quotes = bySymbol([...(await getData912Stocks()), ...(await getBymaStocks()), ...(await getBymaCedears())]);
    const performances = await Promise.all(
      quotes.map(async (quote) => {
        if (quote.type !== "stock") return quote;
        const history = await cached(`stock-history:${quote.symbol}`, ttl.history, () => getData912StockHistory(quote.symbol)).catch(() => [] as HistoricalBar[]);
        return { ...quote, ...calculatePeriodPerformance(history) };
      })
    );
    return performances;
  });
}

function calculatePeriodPerformance(history: HistoricalBar[]): Pick<QuoteSnapshot, "monthChangePercent" | "ytdChangePercent"> {
  const latest = history.at(-1);
  if (!latest?.close) return {};

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const yearStart = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const changeSince = (start: string) => {
    const base = [...history].reverse().find((bar) => bar.time < start)?.close;
    return base ? ((latest.close / base) - 1) * 100 : undefined;
  };

  return {
    monthChangePercent: changeSince(monthStart),
    ytdChangePercent: changeSince(yearStart)
  };
}

export function getBonds() {
  return cached("bonds:v2", ttl.live, async () => {
    const [data912, byma, mae] = await Promise.all([getData912Bonds(), getBymaBonds(), getMaeBondMetrics()]);
    const merged = bySymbol<BondMetric>([...data912, ...byma]);
    return merged.map((bond) => {
      const maeMetric = mae.get(bond.symbol) ?? mae.get(bond.symbol.replace(/[CDXYZ]$/, ""));
      return maeMetric
        ? {
            ...bond,
            yield: maeMetric.yield ?? bond.yield,
            duration: maeMetric.duration ?? bond.duration,
            parity: maeMetric.parity ?? bond.parity
          }
        : bond;
    });
  });
}

export function getCurrencies() {
  return cached("currencies", ttl.live, async () => {
    const [financial, official] = await Promise.all([getDolarApiFinancialCurrencies(), getBcraCurrency()]);
    return bySymbol([...financial, official]);
  });
}

export function getArgentinaIndicators() {
  return cached("argentina-indicators", ttl.live, async (): Promise<ArgentinaIndicator[]> => {
    try {
      const [currencies, countryRisk, merval] = await Promise.all([getCurrencies(), getCountryRisk(), getBymaIndexHistory()]);
      const mep = currencies.find((item) => item.symbol === "USDMEP")?.price;
      const ccl = currencies.find((item) => item.symbol === "USDCCL")?.price;
      const latestMerval = merval.at(-1);
      const previousMerval = merval.at(-2);
      if (!mep || !ccl || !latestMerval?.close) throw new Error("Indicadores argentinos incompletos");

      return [
        { label: "Riesgo país", value: countryRisk.valor, source: "ArgentinaDatos", format: "points" },
        { label: "Brecha CCL / MEP", value: ((ccl / mep) - 1) * 100, source: "DolarAPI", format: "percent" },
        {
          label: "S&P Merval en USD",
          value: latestMerval.close / ccl,
          delta: previousMerval?.close ? ((latestMerval.close / previousMerval.close) - 1) * 100 : undefined,
          source: "BYMA + DolarAPI",
          format: "usd"
        }
      ];
    } catch {
      return fallbackArgentinaIndicators;
    }
  });
}

export function getCommodities() {
  return cached("commodities", ttl.live, () => getYahooCommodities());
}

export function getCryptoBasis() {
  return cached("crypto-basis", ttl.live, () => getBinanceCryptoBasis());
}

export function getFunds() {
  return cached("funds:cafci:v3", ttl.live, async () => {
    try {
      const funds = await getCafciFunds();
      return funds.length ? funds : fallbackFunds;
    } catch {
      return fallbackFunds;
    }
  });
}

export function getFundHoldings(fundId: number, classId: number): Promise<FundHolding[]> {
  return cached(`fund-holdings:${fundId}:${classId}`, ttl.macro, () => getCafciFundHoldings(fundId, classId));
}

export function getHistory(symbol: string, source?: string, range?: string) {
  return cached(`history:v2:${source ?? "auto"}:${symbol}:${range ?? "6mo"}`, ttl.history, async () => {
    try {
      if (source === "BYMA" || /^[A-Z]{2,5}\d*[A-Z]?$/.test(symbol)) {
        const byma = await getBymaHistory(symbol);
        if (byma.length) return byma;
      }
      return await getYahooHistory(symbol, range ?? "6mo");
    } catch {
      return fallbackHistory(symbol);
    }
  });
}

export function getNews() {
  return cached("news", ttl.news, () => getTradingViewNews("BCBA:GGAL"));
}

export function getOverview() {
  return cached("overview", ttl.live, async (): Promise<MarketOverview> => {
    try {
      const [currencies, bonds, stocks, macro] = await Promise.all([getCurrencies(), getBonds(), getStocks(), getBcraMacroCards()]);
      const mervalProxy = stocks.reduce((sum, item) => sum + item.changePercent, 0) / Math.max(stocks.length, 1);
      return {
        updatedAt: new Date().toISOString(),
        sources: ["DolarAPI", "Data912", "BYMA", "BCRA", "MAE"],
        cards: [
          {
            label: "Dólar MEP",
            value: `$${formatNumber(currencies.find((item) => item.symbol === "USDMEP")?.price, 2)}`,
            delta: currencies.find((item) => item.symbol === "USDMEP")?.changePercent,
            source: currencies.find((item) => item.symbol === "USDMEP")?.source ?? "DolarAPI"
          },
          {
            label: "Dólar CCL",
            value: `$${formatNumber(currencies.find((item) => item.symbol === "USDCCL")?.price, 2)}`,
            delta: currencies.find((item) => item.symbol === "USDCCL")?.changePercent,
            source: currencies.find((item) => item.symbol === "USDCCL")?.source ?? "DolarAPI"
          },
          {
            label: "Dólar oficial",
            value: `$${formatNumber(macro.oficial, 2)}`,
            delta: 0,
            source: "BCRA"
          },
          {
            label: "Tasa política",
            value: `${formatNumber(macro.tasaPolitica, 2)}%`,
            delta: 0,
            source: "BCRA"
          },
          {
            label: "Reservas",
            value: `US$ ${formatNumber(macro.reservas, 0)}M`,
            delta: 0,
            source: "BCRA"
          },
          {
            label: "Panel líder",
            value: `${formatNumber(mervalProxy, 2)}%`,
            delta: mervalProxy,
            source: "BYMA"
          }
        ],
        featuredBonds: bonds.filter(isFeaturedDollarBond),
        currencies
      };
    } catch {
      return fallbackOverview();
    }
  });
}

export async function getSearch(query: string) {
  const [stocks, bonds, commodities, tv] = await Promise.all([
    getStocks().catch(() => [] as QuoteSnapshot[]),
    getBonds().catch(() => [] as BondMetric[]),
    getCommodities().catch(() => fallbackCommodities),
    searchTradingView(query)
  ]);
  const local = [...stocks, ...bonds, ...commodities]
    .filter((item) => `${item.symbol} ${item.name} ${item.type} ${item.market}`.toLowerCase().includes(query.toLowerCase()))
    .map((item) => ({ symbol: item.symbol, name: item.name, type: item.type, market: item.market, source: item.source }));
  return query.trim() ? bySymbol([...local, ...tv]) : fallbackSearch();
}

export async function getInstrumentDetail(symbol: string): Promise<InstrumentDetail | undefined> {
  const normalized = symbol.toUpperCase();
  const [stocks, bonds, commodities] = await Promise.all([
    getStocks().catch(() => [] as QuoteSnapshot[]),
    getBonds().catch(() => [] as BondMetric[]),
    getCommodities().catch(() => fallbackCommodities)
  ]);
  const quote = [...stocks, ...bonds, ...commodities].find((item) => item.symbol.toUpperCase() === normalized);
  if (!quote) return undefined;

  const [history, bondInfo, bondCashFlow, benchmarkHistory] = await Promise.all([
    getHistory(quote.symbol, quote.source === "BYMA" || quote.market === "BYMA" ? "BYMA" : undefined).catch(() => fallbackHistory(quote.symbol)),
    quote.type === "bond" ? getBymaBondInfo(quote.symbol).catch(() => undefined) : Promise.resolve(undefined),
    quote.type === "bond" ? getMaeBondCashFlow(quote.symbol).catch(() => undefined) : Promise.resolve(undefined),
    quote.type === "stock" ? getBymaIndexHistory("M", 365).catch(() => [] as HistoricalBar[]) : Promise.resolve([] as HistoricalBar[])
  ]);

  const bondQuote = quote as BondMetric;
  const enrichedQuote =
    quote.type === "bond" && bondCashFlow
      ? {
          ...bondQuote,
          name: bondQuote.name || bondCashFlow.description || bondQuote.symbol,
          price: bondQuote.price || bondCashFlow.price || 0,
          yield: bondQuote.yield ?? bondCashFlow.yield,
          duration: bondQuote.duration ?? bondCashFlow.duration,
          parity: bondQuote.parity ?? (bondCashFlow.price === undefined ? undefined : bondCashFlow.price * 100)
        }
      : quote;

  return { quote: enrichedQuote, history, benchmarkHistory, bondInfo, bondCashFlow };
}
