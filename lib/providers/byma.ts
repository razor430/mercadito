import { fallbackBonds, fallbackStocks } from "@/lib/fallback-data";
import type { BondMetric, BondTechnicalInfo, HistoricalBar, QuoteSnapshot } from "@/lib/types";
import { fetchJsonUnsafeTls } from "./http";

type BymaPanelResponse = { data?: BymaRow[] } | BymaRow[];
type BymaRow = Record<string, string | number | null | undefined>;
type BymaHistory = { s: string; t: number[]; o: number[]; h: number[]; l: number[]; c: number[]; v: number[] };
type BymaBondInfoResponse = { data?: BymaRow[]; empty?: boolean };

const base = "https://open.bymadata.com.ar/vanoms-be-core/rest/api/bymadata/free";

function list(response: BymaPanelResponse): BymaRow[] {
  return Array.isArray(response) ? response : response.data ?? [];
}

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toQuote(row: BymaRow, type: QuoteSnapshot["type"]): QuoteSnapshot {
  const price = num(row.trade ?? row.closingPrice ?? row.settlementPrice) ?? 0;
  const previous = num(row.previousClosingPrice ?? row.previousSettlementPrice);
  const changePercent = (num(row.imbalance) ?? 0) * 100;
  const change = previous ? price - previous : (price * changePercent) / 100;
  const symbol = String(row.symbol ?? "N/D");
  const name = String(row.description || row.denomination || row.securityDescription || symbol);
  return {
    symbol,
    name,
    type,
    market: String(row.market ?? "BYMA"),
    currency: String(row.denominationCcy ?? "ARS"),
    price,
    open: num(row.openingPrice),
    high: num(row.tradingHighPrice),
    low: num(row.tradingLowPrice),
    close: num(row.closingPrice) ?? price,
    previousClose: previous,
    change,
    changePercent,
    volume: num(row.volumeAmount ?? row.tradeVolume ?? row.volume),
    source: "BYMA",
    updatedAt: new Date().toISOString()
  };
}

export async function getBymaStocks(): Promise<QuoteSnapshot[]> {
  try {
    const response = await fetchJsonUnsafeTls<BymaPanelResponse>(`${base}/leading-equity`, { T1: true });
    return list(response).map((row) => toQuote(row, "stock")).filter((item) => item.price > 0);
  } catch {
    return fallbackStocks.filter((item) => item.type === "stock");
  }
}

export async function getBymaCedears(): Promise<QuoteSnapshot[]> {
  try {
    const response = await fetchJsonUnsafeTls<BymaPanelResponse>(`${base}/cedears`, { T1: true });
    return list(response)
      .slice(0, 120)
      .map((row) => toQuote(row, "cedear"))
      .filter((item) => item.price > 0);
  } catch {
    return fallbackStocks.filter((item) => item.type === "cedear");
  }
}

export async function getBymaBonds(): Promise<BondMetric[]> {
  try {
    const response = await fetchJsonUnsafeTls<BymaPanelResponse>(`${base}/public-bonds`, { T1: true, page_size: 5000 });
    return list(response)
      .slice(0, 120)
      .map((row) => ({
        ...toQuote(row, "bond"),
        type: "bond",
        parity: num(row.parity ?? row.paridad),
        maturityDate: typeof row.maturityDate === "string" ? row.maturityDate : undefined
      }));
  } catch {
    return fallbackBonds;
  }
}

export async function getBymaBondInfo(symbol: string): Promise<BondTechnicalInfo | undefined> {
  const response = await fetchJsonUnsafeTls<BymaBondInfoResponse>(`${base}/bnown/fichatecnica/especies/general`, {
    symbol
  });
  const row = response.data?.[0];
  if (!row) return undefined;
  return {
    symbol,
    denomination: typeof row.denominacion === "string" ? row.denominacion : undefined,
    issuer: typeof row.emisor === "string" ? row.emisor : undefined,
    isin: typeof row.codigoIsin === "string" ? row.codigoIsin : undefined,
    law: typeof row.ley === "string" ? row.ley : undefined,
    lawCountry: typeof row.paisLey === "string" ? row.paisLey : undefined,
    currency: typeof row.moneda === "string" ? row.moneda : undefined,
    speciesType: typeof row.tipoEspecie === "string" ? row.tipoEspecie : undefined,
    obligationType: typeof row.tipoObligacion === "string" ? row.tipoObligacion : undefined,
    guaranteeType: typeof row.tipoGarantia === "string" ? row.tipoGarantia : undefined,
    issueDate: typeof row.fechaEmision === "string" ? row.fechaEmision : undefined,
    maturityDate: typeof row.fechaVencimiento === "string" ? row.fechaVencimiento : undefined,
    minimumDenomination: num(row.denominacionMinima),
    nominalAmount: num(row.montoNominal),
    residualAmount: num(row.montoResidual),
    amortization: typeof row.formaAmortizacion === "string" ? row.formaAmortizacion : undefined,
    interest: typeof row.interes === "string" ? row.interes : undefined,
    defaultStatus: typeof row.default === "string" ? row.default : undefined
  };
}

export async function getBymaHistory(symbol: string, resolution = "D"): Promise<HistoricalBar[]> {
  const encoded = encodeURIComponent(`${symbol.replace(/\s+24HS$/i, "")} 24HS`);
  const to = Math.floor(Date.now() / 1000);
  const from = to - 365 * 24 * 60 * 60;
  const url = `${base}/chart/historical-series/history?symbol=${encoded}&resolution=${resolution}&from=${from}&to=${to}`;
  const response = await fetchJsonUnsafeTls<BymaHistory>(url);
  if (response.s !== "ok") return [];
  return response.t
    .map((time, index) => ({
      time: new Date(time * 1000).toISOString().slice(0, 10),
      open: response.o[index],
      high: response.h[index],
      low: response.l[index],
      close: response.c[index],
      volume: response.v[index]
    }))
    .filter((bar) => [bar.open, bar.high, bar.low, bar.close].every(Number.isFinite));
}
