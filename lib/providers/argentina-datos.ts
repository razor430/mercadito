import { fetchJson } from "./http";

type CountryRisk = { fecha: string; valor: number };

export async function getCountryRisk() {
  return fetchJson<CountryRisk>("https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais/ultimo");
}
