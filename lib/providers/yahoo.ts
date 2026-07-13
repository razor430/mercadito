import { fallbackCommodities, fallbackHistory } from "@/lib/fallback-data";
import type { HistoricalBar, QuoteSnapshot } from "@/lib/types";
import { fetchJson } from "./http";

type YahooChart = {
  chart: {
    result?: Array<{
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }>;
      };
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        currency?: string;
        exchangeName?: string;
        shortName?: string;
      };
    }>;
  };
};

export async function getYahooHistory(symbol: string, range = "6mo", interval = "1d"): Promise<HistoricalBar[]> {
  try {
    const data = await fetchJson<YahooChart>(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
    );
    const result = data.chart.result?.[0];
    const quote = result?.indicators.quote[0];
    if (!result || !quote) return fallbackHistory(symbol);
    return result.timestamp.map((time, index) => ({
      time: new Date(time * 1000).toISOString().slice(0, 10),
      open: quote.open[index],
      high: quote.high[index],
      low: quote.low[index],
      close: quote.close[index],
      volume: quote.volume[index] ?? 0
    }));
  } catch {
    return fallbackHistory(symbol);
  }
}

export async function getYahooCommodities(): Promise<QuoteSnapshot[]> {
  try {
    const symbols = ["GC=F", "CL=F", "ZS=F"];
    const results = await Promise.all(symbols.map((symbol) => getYahooHistory(symbol, "5d", "1d")));
    return symbols.map((symbol, index) => {
      const bars = results[index];
      const last = bars.at(-1);
      const prev = bars.at(-2);
      const price = last?.close ?? fallbackCommodities[index].price;
      const change = prev ? price - prev.close : 0;
      return {
        ...fallbackCommodities[index],
        price,
        change,
        changePercent: prev ? (change / prev.close) * 100 : 0,
        volume: last?.volume,
        source: "Yahoo",
        updatedAt: new Date().toISOString()
      };
    });
  } catch {
    return fallbackCommodities;
  }
}
