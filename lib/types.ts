export type AssetType =
  | "stock"
  | "cedear"
  | "adr"
  | "bond"
  | "currency"
  | "crypto"
  | "commodity"
  | "index"
  | "macro";

export type DataSource = "BYMA" | "Data912" | "DolarAPI" | "BCRA" | "MAE" | "TradingView" | "Yahoo" | "Binance" | "Fallback";

export interface QuoteSnapshot {
  symbol: string;
  name: string;
  type: AssetType;
  market: string;
  currency: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  previousClose?: number;
  change: number;
  changePercent: number;
  monthChangePercent?: number;
  ytdChangePercent?: number;
  volume?: number;
  marketCap?: number;
  peRatio?: number;
  beta?: number;
  bookValue?: number;
  sector?: string;
  source: DataSource;
  updatedAt: string;
}

export interface BondMetric extends QuoteSnapshot {
  type: "bond";
  yield?: number;
  duration?: number;
  parity?: number;
  maturityDate?: string;
  law?: string;
}

export interface BondTechnicalInfo {
  symbol: string;
  denomination?: string;
  issuer?: string;
  isin?: string;
  law?: string;
  lawCountry?: string;
  currency?: string;
  speciesType?: string;
  obligationType?: string;
  guaranteeType?: string;
  issueDate?: string;
  maturityDate?: string;
  minimumDenomination?: number;
  nominalAmount?: number;
  residualAmount?: number;
  amortization?: string;
  interest?: string;
  defaultStatus?: string;
}

export interface BondCashFlow {
  paymentDate?: string;
  residualValue?: number;
  portfolioResidualValue?: number;
  cashFlow?: number;
  interest?: number;
  amortization?: number;
  total?: number;
}

export interface BondCashFlowProfile {
  symbol: string;
  description?: string;
  currency?: string;
  price?: number;
  yield?: number;
  duration?: number;
  currentCoupon?: number;
  interest?: number;
  amortization?: number;
  total?: number;
  flows: BondCashFlow[];
}

export interface InstrumentDetail {
  quote: QuoteSnapshot | BondMetric;
  history: HistoricalBar[];
  benchmarkHistory?: HistoricalBar[];
  bondInfo?: BondTechnicalInfo;
  bondCashFlow?: BondCashFlowProfile;
}

export interface CurrencyRate {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  source: DataSource;
  updatedAt: string;
}

export interface ArgentinaIndicator {
  label: string;
  value: number;
  delta?: number;
  source: DataSource | string;
  format: "points" | "percent" | "usd";
}

export interface HistoricalBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: DataSource | string;
  url: string;
  publishedAt: string;
  relatedSymbols?: string[];
}

export interface MarketOverview {
  updatedAt: string;
  sources: DataSource[];
  cards: Array<{
    label: string;
    value: string;
    delta?: number;
    source: DataSource;
  }>;
  featuredBonds: BondMetric[];
  currencies: CurrencyRate[];
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: AssetType;
  market: string;
  source: DataSource;
}

export interface CryptoBasisRow {
  asset: "BTC" | "ETH";
  spotSymbol: string;
  futureSymbol: string;
  contractLabel: string;
  spotPrice: number;
  futurePrice: number;
  maturityDate: string;
  daysToMaturity: number;
  futureOverSpot: number;
  annualizedYield: number;
  source: DataSource;
  updatedAt: string;
}

export interface FundClass {
  id: number;
  name: string;
  currency?: string;
  minimumInvestment?: string | number;
  liquidity?: string;
  managementFee?: string;
  depositoryFee?: string;
  expenseFee?: string;
  bloombergTicker?: string;
  isinTicker?: string;
  shareValue?: number;
  dayChangePercent?: number;
  monthChangePercent?: number;
  ytdChangePercent?: number;
  twelveMonthChangePercent?: number;
  assets?: number;
  marketShare?: number;
}

export interface FundSnapshot {
  id: number;
  name: string;
  cnvCode?: string;
  status?: string;
  manager?: string;
  depositary?: string;
  currency?: string;
  incomeType?: string;
  region?: string;
  horizon?: string;
  duration?: string;
  benchmark?: string;
  settlementDays?: string | number;
  startDate?: string;
  objective?: string;
  classes: FundClass[];
  shareValue?: number;
  dayChangePercent?: number;
  monthChangePercent?: number;
  ytdChangePercent?: number;
  twelveMonthChangePercent?: number;
  assets?: number;
  marketShare?: number;
  source: DataSource | "CAFCI";
  updatedAt: string;
}

export interface FundHolding {
  name: string;
  percentage: number;
}
