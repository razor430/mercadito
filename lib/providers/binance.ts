import type { CryptoBasisRow, DataSource } from "@/lib/types";
import { fetchJson } from "./http";

type AssetConfig = {
  asset: "BTC" | "ETH";
  spotSymbol: string;
  futurePair: string;
};

type BinanceSpotPrice = {
  symbol: string;
  price: string;
};

type BinanceFuturePrice = {
  symbol: string;
  price: string;
};

type YahooChart = {
  chart: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
      };
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
};

type BinanceDeliverySymbol = {
  symbol: string;
  pair: string;
  contractType: string;
  contractStatus: string;
  deliveryDate: number;
};

type BinanceDeliveryInfo = {
  symbols: BinanceDeliverySymbol[];
};

const assets: AssetConfig[] = [
  { asset: "BTC", spotSymbol: "BTCUSDT", futurePair: "BTCUSD" },
  { asset: "ETH", spotSymbol: "ETHUSDT", futurePair: "ETHUSD" }
];

function daysBetween(now: number, deliveryDate: number) {
  return Math.max(1, Math.ceil((deliveryDate - now) / 86_400_000));
}

function buildRow({
  asset,
  spotSymbol,
  futureSymbol,
  contractLabel,
  spotPrice,
  futurePrice,
  deliveryDate,
  source
}: {
  asset: "BTC" | "ETH";
  spotSymbol: string;
  futureSymbol: string;
  contractLabel: string;
  spotPrice: number;
  futurePrice: number;
  deliveryDate: number;
  source: DataSource;
}): CryptoBasisRow {
  if (!Number.isFinite(spotPrice) || !Number.isFinite(futurePrice) || spotPrice <= 0 || futurePrice <= 0) {
    throw new Error(`Invalid crypto basis price for ${asset}`);
  }
  const now = Date.now();
  const daysToMaturity = daysBetween(now, deliveryDate);
  const futureOverSpot = futurePrice / spotPrice;
  return {
    asset,
    spotSymbol,
    futureSymbol,
    contractLabel,
    spotPrice,
    futurePrice,
    maturityDate: new Date(deliveryDate).toISOString().slice(0, 10),
    daysToMaturity,
    futureOverSpot,
    annualizedYield: (futureOverSpot - 1) * (365 / daysToMaturity),
    source,
    updatedAt: new Date(now).toISOString()
  };
}

function fallbackRows(): CryptoBasisRow[] {
  const now = Date.now();
  const fallbackDeliveryDate = now + 90 * 86_400_000;
  return [
    buildRow({
      asset: "BTC",
      spotSymbol: "BTCUSDT",
      futureSymbol: "BTCUSD_QUARTER",
      contractLabel: "Trimestral",
      spotPrice: 105_000,
      futurePrice: 107_200,
      deliveryDate: fallbackDeliveryDate,
      source: "Fallback"
    }),
    buildRow({
      asset: "ETH",
      spotSymbol: "ETHUSDT",
      futureSymbol: "ETHUSD_QUARTER",
      contractLabel: "Trimestral",
      spotPrice: 3_600,
      futurePrice: 3_675,
      deliveryDate: fallbackDeliveryDate,
      source: "Fallback"
    }),
    buildRow({
      asset: "BTC",
      spotSymbol: "BTCUSDT",
      futureSymbol: "BTCUSD_LONG",
      contractLabel: "Largo",
      spotPrice: 105_000,
      futurePrice: 109_400,
      deliveryDate: now + 180 * 86_400_000,
      source: "Fallback"
    }),
    buildRow({
      asset: "ETH",
      spotSymbol: "ETHUSDT",
      futureSymbol: "ETHUSD_LONG",
      contractLabel: "Largo",
      spotPrice: 3_600,
      futurePrice: 3_750,
      deliveryDate: now + 180 * 86_400_000,
      source: "Fallback"
    })
  ];
}

function lastFridayOfMonth(year: number, month: number) {
  const date = new Date(Date.UTC(year, month + 1, 0));
  while (date.getUTCDay() !== 5) {
    date.setUTCDate(date.getUTCDate() - 1);
  }
  date.setUTCHours(21, 0, 0, 0);
  return date.getTime();
}

function nextMonthlyFutureDeliveryDate(now = new Date()) {
  let year = now.getUTCFullYear();
  let month = now.getUTCMonth();
  let deliveryDate = lastFridayOfMonth(year, month);
  if (deliveryDate <= now.getTime()) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    deliveryDate = lastFridayOfMonth(year, month);
  }
  return deliveryDate;
}

function lastDefinedPrice(values?: Array<number | null>) {
  return values?.findLast((value): value is number => typeof value === "number" && Number.isFinite(value));
}

async function getYahooPrice(symbol: string) {
  const data = await fetchJson<YahooChart>(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`
  );
  const result = data.chart.result?.[0];
  const close = lastDefinedPrice(result?.indicators?.quote?.[0]?.close);
  const price = result?.meta?.regularMarketPrice ?? close ?? result?.meta?.chartPreviousClose;
  if (!price || !Number.isFinite(price)) throw new Error(`No Yahoo price for ${symbol}`);
  return price;
}

async function getYahooCryptoBasis(): Promise<CryptoBasisRow[]> {
  const deliveryDate = nextMonthlyFutureDeliveryDate();
  const [btcSpot, ethSpot, btcFuture, ethFuture] = await Promise.all([
    getYahooPrice("BTC-USD"),
    getYahooPrice("ETH-USD"),
    getYahooPrice("BTC=F"),
    getYahooPrice("ETH=F")
  ]);

  return [
    buildRow({
      asset: "BTC",
      spotSymbol: "BTC-USD",
      futureSymbol: "BTC=F",
      contractLabel: "Mensual",
      spotPrice: btcSpot,
      futurePrice: btcFuture,
      deliveryDate,
      source: "Yahoo"
    }),
    buildRow({
      asset: "ETH",
      spotSymbol: "ETH-USD",
      futureSymbol: "ETH=F",
      contractLabel: "Mensual",
      spotPrice: ethSpot,
      futurePrice: ethFuture,
      deliveryDate,
      source: "Yahoo"
    })
  ];
}

function selectDeliveryContracts(symbols: BinanceDeliverySymbol[], pair: string) {
  const tradable = symbols
    .filter(
      (item) =>
        item.pair === pair &&
        item.contractStatus === "TRADING" &&
        item.contractType !== "PERPETUAL" &&
        item.deliveryDate > Date.now()
    )
    .sort((a, b) => a.deliveryDate - b.deliveryDate);
  const current = tradable.find((item) => item.contractType === "CURRENT_QUARTER") ?? tradable[0];
  const longer =
    tradable.find((item) => item.contractType === "NEXT_QUARTER") ??
    tradable.findLast((item) => item.symbol !== current?.symbol);
  return [current, longer].filter((item): item is BinanceDeliverySymbol => Boolean(item));
}

function contractLabel(contractType: string) {
  if (contractType === "CURRENT_QUARTER") return "Trimestral";
  if (contractType === "NEXT_QUARTER") return "Trimestral largo";
  return contractType.replaceAll("_", " ").toLowerCase();
}

export async function getBinanceCryptoBasis(): Promise<CryptoBasisRow[]> {
  try {
    const [deliveryInfo, spotPrices] = await Promise.all([
      fetchJson<BinanceDeliveryInfo>("https://dapi.binance.com/dapi/v1/exchangeInfo"),
      Promise.all(
        assets.map((item) =>
          fetchJson<BinanceSpotPrice>(`https://api.binance.com/api/v3/ticker/price?symbol=${item.spotSymbol}`)
        )
      )
    ]);

    const contractsByAsset = assets.map((item) => {
      const contracts = selectDeliveryContracts(deliveryInfo.symbols, item.futurePair);
      if (contracts.length === 0) throw new Error(`No delivery future for ${item.futurePair}`);
      return contracts;
    });

    const allFuturePrices = await fetchJson<BinanceFuturePrice[]>("https://dapi.binance.com/dapi/v1/ticker/price");
    const futurePriceBySymbol = new Map(allFuturePrices.map((item) => [item.symbol, Number(item.price)]));

    return assets.flatMap((item, index) =>
      contractsByAsset[index].map((contract) =>
        buildRow({
          asset: item.asset,
          spotSymbol: item.spotSymbol,
          futureSymbol: contract.symbol,
          contractLabel: contractLabel(contract.contractType),
          spotPrice: Number(spotPrices[index].price),
          futurePrice: futurePriceBySymbol.get(contract.symbol) ?? Number.NaN,
          deliveryDate: contract.deliveryDate,
          source: "Binance"
        })
      )
    );
  } catch {
    try {
      return await getYahooCryptoBasis();
    } catch {
      return fallbackRows();
    }
  }
}
