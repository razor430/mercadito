import type { BondCashFlow, BondCashFlowProfile, BondMetric } from "@/lib/types";
import { fetchJson } from "./http";

type MaeFlow = {
  especie?: string;
  descripcion?: string;
  precio?: number;
  tir?: number;
  md?: number;
  moneda?: string;
  numeroCuponActual?: number;
  renta?: number;
  amortizacion?: number;
  amasR?: number;
  detalle?: MaeFlowDetail[];
};

type MaeFlowDetail = {
  fechaPago?: string;
  vr?: number;
  vrCartera?: number;
  cashFlow?: number;
  renta?: number;
  amortizacion?: number;
  amasR?: number;
};

const base = "https://api.marketdata.mae.com.ar/api";

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function cleanSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function toCashFlow(row: MaeFlowDetail): BondCashFlow {
  return {
    paymentDate: row.fechaPago,
    residualValue: num(row.vr),
    portfolioResidualValue: num(row.vrCartera),
    cashFlow: num(row.cashFlow),
    interest: num(row.renta),
    amortization: num(row.amortizacion),
    total: num(row.amasR)
  };
}

function toProfile(row: MaeFlow): BondCashFlowProfile | undefined {
  if (!row.especie) return undefined;
  return {
    symbol: cleanSymbol(String(row.especie)),
    description: row.descripcion,
    currency: row.moneda?.trim(),
    price: num(row.precio),
    yield: num(row.tir),
    duration: num(row.md),
    currentCoupon: num(row.numeroCuponActual),
    interest: num(row.renta),
    amortization: num(row.amortizacion),
    total: num(row.amasR),
    flows: (row.detalle ?? []).map(toCashFlow)
  };
}

async function getMaeFlowRows(letter: "B" | "H") {
  const rows = await fetchJson<MaeFlow[]>(`${base}/emisiones/flujofondoscotiz/${letter}`);
  return rows.map(toProfile).filter((row): row is BondCashFlowProfile => Boolean(row));
}

export async function getMaeBondMetrics(): Promise<Map<string, Pick<BondMetric, "yield" | "duration" | "parity">>> {
  try {
    const [hardDollar, bopreal] = await Promise.all([getMaeFlowRows("H"), getMaeFlowRows("B").catch(() => [])]);
    const rows = [...hardDollar, ...bopreal];
    return new Map(
      rows
        .map((row) => [
          row.symbol,
          {
            yield: row.yield,
            duration: row.duration,
            parity: row.price === undefined ? undefined : row.price * 100
          }
        ])
    );
  } catch {
    return new Map();
  }
}

export async function getMaeBondCashFlow(symbol: string): Promise<BondCashFlowProfile | undefined> {
  try {
    const normalized = cleanSymbol(symbol);
    const [hardDollar, bopreal] = await Promise.all([getMaeFlowRows("H"), getMaeFlowRows("B").catch(() => [])]);
    const rows = [...hardDollar, ...bopreal];
    const exact = rows.find((row) => row.symbol === normalized);
    if (exact) return exact;

    const variantBase = normalized.replace(/[CDXYZ]$/, "");
    return rows.find((row) => row.symbol === variantBase);
  } catch {
    return undefined;
  }
}
