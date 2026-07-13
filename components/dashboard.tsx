"use client";

import { BarChart3, CircleDollarSign, Newspaper, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AssetShareChart, PriceChart, VolumeChart } from "@/components/charts";
import { CurrencyStrip } from "@/components/currency-strip";
import { MarketTable } from "@/components/market-table";
import { MetricCard } from "@/components/metric-card";
import { NewsFeed } from "@/components/news-feed";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMarketData } from "@/components/use-market-data";
import { isPesoBond } from "@/lib/bond-filters";
import { formatDateTime } from "@/lib/format";
import type { BondMetric, CurrencyRate, MarketOverview, NewsItem, QuoteSnapshot, SearchResult } from "@/lib/types";

type Props = {
  initialOverview: MarketOverview;
  initialStocks: QuoteSnapshot[];
  initialBonds: BondMetric[];
  initialCurrencies: CurrencyRate[];
  initialCommodities: QuoteSnapshot[];
  initialNews: NewsItem[];
};

const nav = ["Mercado", "Acciones", "CEDEARs", "Bonos", "Dólares", "Commodities", "Global", "Noticias"];

export function Dashboard(props: Props) {
  const overview = useMarketData("/api/market/overview", props.initialOverview);
  const stocks = useMarketData("/api/market/stocks", props.initialStocks);
  const bonds = useMarketData("/api/market/bonds", props.initialBonds);
  const currencies = useMarketData("/api/market/currencies", props.initialCurrencies);
  const commodities = useMarketData("/api/market/commodities", props.initialCommodities, 120_000);
  const news = useMarketData("/api/market/news", props.initialNews, 300_000);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  const allRows = useMemo(() => [...stocks.data, ...bonds.data, ...commodities.data], [stocks.data, bonds.data, commodities.data]);
  const argStocks = useMemo(() => stocks.data.filter((row) => row.type === "stock"), [stocks.data]);
  const cedears = useMemo(() => stocks.data.filter((row) => row.type === "cedear"), [stocks.data]);
  const pesoBonds = useMemo(() => bonds.data.filter(isPesoBond), [bonds.data]);
  const selectedSymbol = bonds.data[0]?.symbol ?? stocks.data[0]?.symbol ?? "AL30";

  async function runSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    const response = await fetch(`/api/market/search?q=${encodeURIComponent(value)}`, { cache: "no-store" });
    if (response.ok) setResults(await response.json());
  }

  return (
    <main>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-950/92">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-line bg-panel dark:border-slate-700 dark:bg-slate-900">
              <CircleDollarSign className="h-5 w-5 text-gain" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-black uppercase tracking-normal text-ink dark:text-slate-100">Mercado AR</h1>
              <p className="text-xs text-ink/55">Dashboard dinámico · Argentina primero</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <nav className="table-scroll flex gap-1 overflow-x-auto text-sm">
            {nav.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace("ó", "o")}`}
                className="whitespace-nowrap rounded border border-transparent px-2 py-1.5 text-ink/75 hover:border-line hover:bg-panel dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900"
              >
                {item}
              </a>
            ))}
            </nav>
            <Link
              href="/fondos"
              className="inline-flex h-9 items-center justify-center rounded border border-line bg-panel px-2 text-xs font-semibold uppercase text-ink transition hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Fondos
            </Link>
            <Link
              href="/crypto"
              className="inline-flex h-9 items-center justify-center rounded border border-line bg-panel px-2 text-xs font-semibold uppercase text-ink transition hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Crypto
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-4">
        <section id="mercado" className="grid gap-3 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {overview.data.cards.map((card) => (
                <MetricCard key={card.label} {...card} />
              ))}
            </div>
            <MarketTable title="Bonos soberanos especie D" rows={overview.data.featuredBonds} compact variant="bonds" />
          </div>
          <aside className="space-y-3">
            <div className="rounded border border-line bg-white px-3 py-3 shadow-table dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase text-ink/60 dark:text-slate-400">Estado</span>
                <RefreshCw className={`h-4 w-4 ${overview.status === "refreshing" ? "animate-spin text-gain" : "text-ink/45"}`} />
              </div>
              <p className="mt-2 text-sm text-ink dark:text-slate-100">
                Actualizado {formatDateTime(overview.data.updatedAt)}
              </p>
              <p className="mt-1 text-xs text-ink/55 dark:text-slate-400">
                Fuentes: {overview.data.sources.join(", ")} · {overview.refreshLabel}
              </p>
            </div>
            <div className="relative rounded border border-line bg-white p-3 shadow-table dark:border-slate-700 dark:bg-slate-900">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => runSearch(event.target.value)}
                  placeholder="Buscar ticker global o local"
                  className="h-9 w-full rounded border border-line bg-panel pl-8 pr-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </label>
              {results.length ? (
                <div className="absolute left-3 right-3 top-14 z-20 max-h-72 overflow-auto rounded border border-line bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {results.map((item) => (
                    <Link
                      key={`${item.source}-${item.symbol}`}
                      href={`/instrumento/${encodeURIComponent(item.symbol)}`}
                      className="block border-b border-line px-3 py-2 last:border-0 hover:bg-panel dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <strong className="text-sm text-ink dark:text-slate-100">{item.symbol}</strong>
                      <span className="ml-2 text-xs text-ink/55 dark:text-slate-400">{item.market}</span>
                      <p className="truncate text-xs text-ink/65 dark:text-slate-300">{item.name}</p>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            <CurrencyStrip rows={currencies.data} />
          </aside>
        </section>

        <section className="mt-3 grid gap-3 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <PriceChart symbol={selectedSymbol} />
          <VolumeChart rows={allRows} />
          <AssetShareChart rows={allRows} />
        </section>

        <section id="acciones" className="mt-3">
          <MarketTable title="Acciones argentinas" rows={argStocks} />
        </section>

        <section id="cedears" className="mt-3">
          <MarketTable title="CEDEARs" rows={cedears} />
        </section>

        <section id="bonos" className="mt-3">
          <MarketTable title="Bonos en pesos, soberanos, letras y ONs" rows={pesoBonds} variant="bonds" />
        </section>

        <section id="commodities" className="mt-3">
          <MarketTable title="Commodities globales" rows={commodities.data} compact />
        </section>

        <section id="global" className="mt-3 grid gap-3 lg:grid-cols-[1fr_420px]">
          <div className="rounded border border-line bg-white p-3 shadow-table dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gain" aria-hidden="true" />
              <h2 className="text-sm font-bold uppercase tracking-normal text-ink dark:text-slate-100">Lectura global</h2>
            </div>
            <p className="text-sm leading-6 text-ink/70 dark:text-slate-300">
              Cobertura secundaria con Yahoo Finance y TradingView para commodities, búsqueda global, noticias y futuros filtros por mercado.
              El diseño prioriza datos argentinos y mantiene fuentes globales como complemento operativo.
            </p>
          </div>
          <div className="rounded border border-line bg-white p-3 shadow-table dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-gain" aria-hidden="true" />
              <h2 className="text-sm font-bold uppercase tracking-normal text-ink dark:text-slate-100">Fallbacks activos</h2>
            </div>
            <p className="text-sm leading-6 text-ink/70 dark:text-slate-300">
              Si BYMA, Data912, BCRA, MAE, TradingView o Yahoo no responden, las rutas devuelven datos normalizados de respaldo para conservar tablas,
              gráficos y estados visibles.
            </p>
          </div>
        </section>

        <div className="mt-3">
          <NewsFeed items={news.data} />
        </div>
      </div>
    </main>
  );
}
