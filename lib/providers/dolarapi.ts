import { fallbackCurrencies } from "@/lib/fallback-data";
import type { CurrencyRate } from "@/lib/types";
import { fetchJson } from "./http";

type DolarApiResponse = {
  compra?: number;
  venta?: number;
  casa?: string;
  nombre?: string;
  moneda?: string;
  fechaActualizacion?: string;
};

const base = "https://dolarapi.com/v1/dolares";

function currencyFromDolarApi(row: DolarApiResponse, symbol: "USDMEP" | "USDCCL", fallbackIndex: number): CurrencyRate {
  const price = Number(row.venta ?? row.compra);
  if (!Number.isFinite(price) || price <= 0) {
    return fallbackCurrencies[fallbackIndex];
  }

  return {
    symbol,
    name: symbol === "USDMEP" ? "Dolar MEP" : "Dolar CCL",
    price,
    change: 0,
    changePercent: 0,
    source: "DolarAPI",
    updatedAt: row.fechaActualizacion ?? new Date().toISOString()
  };
}

export async function getDolarApiFinancialCurrencies(): Promise<CurrencyRate[]> {
  try {
    const [mep, ccl] = await Promise.all([
      fetchJson<DolarApiResponse>(`${base}/bolsa`),
      fetchJson<DolarApiResponse>(`${base}/contadoconliqui`)
    ]);

    return [
      currencyFromDolarApi(mep, "USDMEP", 0),
      currencyFromDolarApi(ccl, "USDCCL", 1)
    ];
  } catch {
    return fallbackCurrencies.slice(0, 2);
  }
}
