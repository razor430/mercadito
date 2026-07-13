import type {
  BondMetric,
  CurrencyRate,
  HistoricalBar,
  MarketOverview,
  NewsItem,
  QuoteSnapshot,
  SearchResult,
  FundSnapshot
} from "@/lib/types";

const now = () => new Date().toISOString();

export const fallbackStocks: QuoteSnapshot[] = [
  {
    symbol: "GGAL",
    name: "Grupo Financiero Galicia",
    type: "stock",
    market: "BYMA",
    currency: "ARS",
    price: 5220,
    open: 5140,
    high: 5290,
    low: 5085,
    close: 5220,
    previousClose: 5125,
    change: 95,
    changePercent: 1.85,
    volume: 1640000,
    marketCap: 7700000000000,
    peRatio: 8.4,
    sector: "Finanzas",
    source: "Fallback",
    updatedAt: now()
  },
  {
    symbol: "YPFD",
    name: "YPF Sociedad Anónima",
    type: "stock",
    market: "BYMA",
    currency: "ARS",
    price: 43250,
    open: 42600,
    high: 43800,
    low: 42150,
    close: 43250,
    previousClose: 42720,
    change: 530,
    changePercent: 1.24,
    volume: 312000,
    marketCap: 16900000000000,
    peRatio: 7.1,
    sector: "Energía",
    source: "Fallback",
    updatedAt: now()
  },
  {
    symbol: "PAMP",
    name: "Pampa Energía",
    type: "stock",
    market: "BYMA",
    currency: "ARS",
    price: 3860,
    open: 3910,
    high: 3965,
    low: 3810,
    close: 3860,
    previousClose: 3928,
    change: -68,
    changePercent: -1.73,
    volume: 980000,
    marketCap: 4800000000000,
    peRatio: 9.2,
    sector: "Energía",
    source: "Fallback",
    updatedAt: now()
  },
  {
    symbol: "AAPL",
    name: "Apple CEDEAR",
    type: "cedear",
    market: "BYMA",
    currency: "ARS",
    price: 18540,
    open: 18400,
    high: 18710,
    low: 18290,
    close: 18540,
    previousClose: 18330,
    change: 210,
    changePercent: 1.15,
    volume: 226000,
    marketCap: 2940000000000,
    peRatio: 30.2,
    sector: "Tecnología",
    source: "Fallback",
    updatedAt: now()
  },
  {
    symbol: "MSFT",
    name: "Microsoft CEDEAR",
    type: "cedear",
    market: "BYMA",
    currency: "ARS",
    price: 24580,
    open: 24720,
    high: 24810,
    low: 24340,
    close: 24580,
    previousClose: 24760,
    change: -180,
    changePercent: -0.73,
    volume: 179000,
    marketCap: 3540000000000,
    peRatio: 35.7,
    sector: "Tecnología",
    source: "Fallback",
    updatedAt: now()
  }
];

export const fallbackBonds: BondMetric[] = [
  {
    symbol: "AL30",
    name: "Bono Rep. Argentina USD 2030 Ley Local",
    type: "bond",
    market: "BYMA",
    currency: "ARS",
    price: 86600,
    open: 85850,
    high: 87200,
    low: 85100,
    close: 86600,
    previousClose: 85920,
    change: 680,
    changePercent: 0.79,
    volume: 2260000000,
    yield: 12.4,
    duration: 2.8,
    maturityDate: "2030-07-09",
    law: "Local",
    source: "Fallback",
    updatedAt: now()
  },
  {
    symbol: "GD30",
    name: "Bono Global USD 2030 Ley NY",
    type: "bond",
    market: "BYMA",
    currency: "ARS",
    price: 88940,
    open: 88400,
    high: 89750,
    low: 88020,
    close: 88940,
    previousClose: 88210,
    change: 730,
    changePercent: 0.83,
    volume: 3110000000,
    yield: 11.9,
    duration: 2.9,
    maturityDate: "2030-07-09",
    law: "Nueva York",
    source: "Fallback",
    updatedAt: now()
  },
  {
    symbol: "AE38",
    name: "Bono Rep. Argentina USD 2038",
    type: "bond",
    market: "BYMA",
    currency: "ARS",
    price: 110130,
    open: 111000,
    high: 112200,
    low: 109700,
    close: 110130,
    previousClose: 111080,
    change: -950,
    changePercent: -0.86,
    volume: 920000000,
    yield: 12.8,
    duration: 5.7,
    maturityDate: "2038-01-09",
    law: "Local",
    source: "Fallback",
    updatedAt: now()
  },
  {
    symbol: "AE38D",
    name: "Bono Rep. Argentina USD 2038 especie D",
    type: "bond",
    market: "BYMA",
    currency: "USD",
    price: 74.2,
    open: 73.8,
    high: 74.6,
    low: 73.5,
    close: 74.2,
    previousClose: 73.7,
    change: 0.5,
    changePercent: 0.68,
    volume: 410000,
    yield: 12.8,
    duration: 5.7,
    maturityDate: "2038-01-09",
    law: "Local",
    source: "Fallback",
    updatedAt: now()
  },
  {
    symbol: "TZX26",
    name: "BONCAP CER 2026",
    type: "bond",
    market: "BYMA",
    currency: "ARS",
    price: 1520,
    open: 1511,
    high: 1528,
    low: 1507,
    close: 1520,
    previousClose: 1510,
    change: 10,
    changePercent: 0.66,
    volume: 640000000,
    yield: 7.1,
    duration: 0.9,
    maturityDate: "2026-06-30",
    law: "Local",
    source: "Fallback",
    updatedAt: now()
  }
];

export const fallbackCurrencies: CurrencyRate[] = [
  { symbol: "USDMEP", name: "Dólar MEP", price: 1424.34, change: 6.1, changePercent: 0.43, source: "Fallback", updatedAt: now() },
  { symbol: "USDCCL", name: "Dólar CCL", price: 1471.54, change: -4.8, changePercent: -0.33, source: "Fallback", updatedAt: now() },
  { symbol: "USDARS", name: "Dólar oficial", price: 905.5, change: 1.5, changePercent: 0.17, source: "Fallback", updatedAt: now() },
  { symbol: "EURUSD", name: "Euro / Dólar", price: 1.083, change: 0.002, changePercent: 0.18, source: "Fallback", updatedAt: now() }
];

export const fallbackCommodities: QuoteSnapshot[] = [
  {
    symbol: "GC=F",
    name: "Oro",
    type: "commodity",
    market: "COMEX",
    currency: "USD",
    price: 2356.2,
    change: 12.4,
    changePercent: 0.53,
    volume: 120430,
    sector: "Metales",
    source: "Fallback",
    updatedAt: now()
  },
  {
    symbol: "CL=F",
    name: "Petróleo WTI",
    type: "commodity",
    market: "NYMEX",
    currency: "USD",
    price: 78.41,
    change: -0.62,
    changePercent: -0.78,
    volume: 342110,
    sector: "Energía",
    source: "Fallback",
    updatedAt: now()
  },
  {
    symbol: "ZS=F",
    name: "Soja",
    type: "commodity",
    market: "CBOT",
    currency: "USD",
    price: 1176.5,
    change: 4.75,
    changePercent: 0.41,
    volume: 92800,
    sector: "Agro",
    source: "Fallback",
    updatedAt: now()
  }
];

export const fallbackFunds: FundSnapshot[] = [
  {
    id: 304,
    name: "1810 Ahorro",
    cnvCode: "291",
    status: "Activo",
    manager: "Industrial Asset Management S.G.F.C.I.S.A.",
    depositary: "Banco Industrial S.A.",
    currency: "Peso",
    incomeType: "Mercado de Dinero",
    region: "Argentina",
    horizon: "Corto",
    settlementDays: "0",
    objective: "Administracion de liquidez de corto plazo en pesos.",
    classes: [
      {
        id: 308,
        name: "1810 Ahorro - Clase A",
        currency: "ARS",
        minimumInvestment: "1000",
        liquidity: "Inmediata",
        managementFee: "2.00",
        depositoryFee: "0.15"
      }
    ],
    source: "CAFCI",
    updatedAt: now()
  },
  {
    id: 1717,
    name: "Delta Pesos",
    status: "Activo",
    manager: "Delta Asset Management S.A.",
    currency: "Peso",
    incomeType: "Renta Fija",
    region: "Argentina",
    horizon: "Corto",
    settlementDays: "1",
    objective: "Cartera de instrumentos de renta fija en pesos.",
    classes: [
      {
        id: 5772,
        name: "Delta Pesos - Clase A",
        currency: "ARS",
        minimumInvestment: "1000",
        managementFee: "2.50"
      }
    ],
    source: "CAFCI",
    updatedAt: now()
  }
];

export function fallbackHistory(symbol = "AL30"): HistoricalBar[] {
  const base = symbol.includes("USD") ? 1400 : symbol.includes("=") ? 80 : 86000;
  return Array.from({ length: 72 }, (_, index) => {
    const wave = Math.sin(index / 6) * 0.035;
    const drift = index * 0.0015;
    const close = base * (1 + wave + drift);
    const open = close * (1 - Math.sin(index / 4) * 0.006);
    const high = Math.max(open, close) * 1.012;
    const low = Math.min(open, close) * 0.988;
    const date = new Date();
    date.setDate(date.getDate() - (71 - index));
    return {
      time: date.toISOString().slice(0, 10),
      open,
      high,
      low,
      close,
      volume: Math.round(500_000 + Math.abs(Math.sin(index / 3)) * 2_500_000)
    };
  });
}

export const fallbackNews: NewsItem[] = [
  {
    id: "fallback-1",
    title: "El mercado local sigue atento a tasas, dólares financieros y curva soberana",
    source: "Fallback",
    url: "https://www.tradingview.com/markets/",
    publishedAt: now(),
    relatedSymbols: ["AL30", "GD30", "USDMEP"]
  },
  {
    id: "fallback-2",
    title: "Acciones argentinas operan mixtas con selectividad en bancos y energía",
    source: "Fallback",
    url: "https://finance.yahoo.com/",
    publishedAt: now(),
    relatedSymbols: ["GGAL", "YPFD", "PAMP"]
  },
  {
    id: "fallback-3",
    title: "Commodities muestran variaciones moderadas en una rueda de bajo volumen",
    source: "Fallback",
    url: "https://www.tradingview.com/markets/futures/",
    publishedAt: now(),
    relatedSymbols: ["GC=F", "CL=F"]
  }
];

export function fallbackOverview(): MarketOverview {
  return {
    updatedAt: now(),
    sources: ["Fallback"],
    cards: [
      { label: "Dólar MEP", value: "$1.424,34", delta: 0.43, source: "Fallback" },
      { label: "Dólar CCL", value: "$1.471,54", delta: -0.33, source: "Fallback" },
      { label: "Dólar oficial", value: "$905,50", delta: 0.17, source: "Fallback" },
      { label: "Tasa política", value: "40,00%", delta: 0, source: "Fallback" },
      { label: "Reservas", value: "US$ 29,4B", delta: 0.22, source: "Fallback" },
      { label: "S&P Merval", value: "1,62M", delta: 1.08, source: "Fallback" }
    ],
    featuredBonds: fallbackBonds,
    currencies: fallbackCurrencies
  };
}

export function fallbackSearch(): SearchResult[] {
  return [...fallbackStocks, ...fallbackBonds, ...fallbackCommodities].map((item) => ({
    symbol: item.symbol,
    name: item.name,
    type: item.type,
    market: item.market,
    source: item.source
  }));
}
