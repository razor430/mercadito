import { fallbackNews } from "@/lib/fallback-data";
import type { NewsItem, SearchResult } from "@/lib/types";
import { fetchJson } from "./http";

type TvNews = {
  items?: Array<{
    id?: string;
    title?: string;
    source?: string;
    storyPath?: string;
    published?: number;
    symbols?: string[];
  }>;
};

type TvSearch = {
  symbols?: Array<{
    symbol?: string;
    description?: string;
    type?: string;
    exchange?: string;
  }>;
};

export async function getTradingViewNews(symbol = "BCBA:GGAL"): Promise<NewsItem[]> {
  try {
    const data = await fetchJson<TvNews>(
      `https://news-headlines.tradingview.com/v2/headlines?lang=en&symbol=${encodeURIComponent(symbol)}&limit=12`
    );
    const items = data.items ?? [];
    return items.slice(0, 8).map((item, index) => ({
      id: item.id ?? `tv-${index}`,
      title: item.title ?? "Market headline",
      source: item.source ?? "TradingView",
      url: item.storyPath ? `https://www.tradingview.com${item.storyPath}` : "https://www.tradingview.com/news/",
      publishedAt: item.published ? new Date(item.published * 1000).toISOString() : new Date().toISOString(),
      relatedSymbols: item.symbols
    }));
  } catch {
    return fallbackNews;
  }
}

export async function searchTradingView(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  try {
    const data = await fetchJson<TvSearch>(
      `https://symbol-search.tradingview.com/symbol_search/v3/?text=${encodeURIComponent(query)}&hl=1&exchange=&lang=es&search_type=undefined`
    );
    return (data.symbols ?? []).slice(0, 12).map((item) => ({
      symbol: item.symbol ?? query.toUpperCase(),
      name: item.description ?? item.symbol ?? query,
      type: item.type === "bond" ? "bond" : item.type === "index" ? "index" : item.type === "forex" ? "currency" : "stock",
      market: item.exchange ?? "GLOBAL",
      source: "TradingView"
    }));
  } catch {
    return [];
  }
}
