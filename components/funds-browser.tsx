"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { compactNumber, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import type { FundClass, FundHolding, FundSnapshot } from "@/lib/types";

function valueOrDash(value?: string | number) {
  return value === undefined || value === "" ? "-" : String(value);
}

function FundStat({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="border-b border-line py-2 last:border-0 dark:border-slate-700">
      <span className="block text-[11px] font-semibold uppercase text-ink/45 dark:text-slate-500">{label}</span>
      <strong className="mt-0.5 block text-sm font-semibold text-ink dark:text-slate-100">{valueOrDash(value)}</strong>
    </div>
  );
}

function FundClassRow({ fundClass }: { fundClass: FundClass }) {
  return (
    <tr className="border-b border-line last:border-0 dark:border-slate-700">
      <td className="px-3 py-2 font-semibold text-ink dark:text-slate-100">{fundClass.name}</td>
      <td className="px-3 py-2 text-ink/70 dark:text-slate-300">{valueOrDash(fundClass.currency)}</td>
      <td className="numeric px-3 py-2 text-right text-ink/70 dark:text-slate-300">{formatNumber(fundClass.shareValue, 3)}</td>
      <td className={`numeric px-3 py-2 text-right font-semibold ${(fundClass.dayChangePercent ?? 0) >= 0 ? "text-gain" : "text-loss"}`}>
        {formatPercent(fundClass.dayChangePercent)}
      </td>
      <td className="numeric px-3 py-2 text-right text-ink/70 dark:text-slate-300">{compactNumber(fundClass.assets)}</td>
    </tr>
  );
}

function managementFeeLabel(value?: string) {
  if (!value) return "-";
  return value.includes("%") ? value : `${value}%`;
}

function referenceHoldings(incomeType?: string): FundHolding[] {
  if (incomeType?.includes("Variable")) {
    return [
      { name: "YPF S.A. (YPFD)", percentage: 14 },
      { name: "Grupo Financiero Galicia (GGAL)", percentage: 12 },
      { name: "Pampa Energía (PAMP)", percentage: 10 },
      { name: "Ternium Argentina (TXAR)", percentage: 7 },
      { name: "MercadoLibre (MELI)", percentage: 6 },
      { name: "CEDEAR Apple (AAPL)", percentage: 9 },
      { name: "CEDEAR Microsoft (MSFT)", percentage: 8 },
      { name: "CEDEAR Amazon (AMZN)", percentage: 6 },
      { name: "CEDEAR Nvidia (NVDA)", percentage: 5 },
      { name: "Cauciones colocadoras BYMA", percentage: 8 },
      { name: "Disponibilidades", percentage: 4 },
      { name: "Otros activos", percentage: 11 }
    ];
  }
  if (incomeType?.includes("Mixta") || incomeType?.includes("Retorno")) {
    return [
      { name: "Bono República Argentina 2030 (AL30)", percentage: 16 },
      { name: "Bono República Argentina 2035 (GD35)", percentage: 10 },
      { name: "YPF S.A. (YPFD)", percentage: 9 },
      { name: "Pampa Energía (PAMP)", percentage: 6 },
      { name: "CEDEAR Apple (AAPL)", percentage: 7 },
      { name: "CEDEAR Microsoft (MSFT)", percentage: 6 },
      { name: "ON YPF Clase XXXIX", percentage: 12 },
      { name: "ON Pampa Energía Clase 21", percentage: 9 },
      { name: "LECAP S31E5", percentage: 10 },
      { name: "Cauciones colocadoras BYMA", percentage: 8 },
      { name: "Disponibilidades y otros activos", percentage: 7 }
    ];
  }
  if (incomeType?.includes("Dinero")) {
    return [
      { name: "Cuenta corriente remunerada — Banco Nación", percentage: 22 },
      { name: "Plazo fijo — Banco Galicia", percentage: 18 },
      { name: "Cauciones colocadoras BYMA", percentage: 20 },
      { name: "LECAP S31E5", percentage: 12 },
      { name: "LECAP S30Y6", percentage: 10 },
      { name: "BONCAP T15D5", percentage: 8 },
      { name: "Disponibilidades y otros activos", percentage: 10 }
    ];
  }
  return [
    { name: "Bono República Argentina 2030 (AL30)", percentage: 18 },
    { name: "Bono República Argentina 2035 (GD35)", percentage: 14 },
    { name: "Bono República Argentina 2038 (AE38)", percentage: 9 },
    { name: "LECAP S31E5", percentage: 12 },
    { name: "BONCAP T15D5", percentage: 10 },
    { name: "ON YPF Clase XXXIX", percentage: 13 },
    { name: "ON Pampa Energía Clase 21", percentage: 9 },
    { name: "Cauciones colocadoras BYMA", percentage: 7 },
    { name: "Disponibilidades y otros activos", percentage: 8 }
  ];
}

function FundHoldingsChart({ fund }: { fund?: FundSnapshot }) {
  void referenceHoldings;
  const fundClass = fund?.classes[0];
  const fundId = fund?.id;
  const classId = fundClass?.id;
  const [holdings, setHoldings] = useState<FundHolding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isReference = false;

  useEffect(() => {
    if (!fundId || !classId) {
      setHoldings([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setHoldings([]);
    setIsLoading(true);
    fetch(`/api/market/fund-holdings?fundId=${fundId}&classId=${classId}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo obtener la composición");
        return (await response.json()) as FundHolding[];
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        setHoldings(data);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
        setHoldings([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [classId, fundId]);

  return (
    <section className="rounded border border-line bg-white shadow-table dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-1 border-b border-line px-3 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-normal text-ink dark:text-slate-100">Tenencia por activo</h2>
          <p className="mt-0.5 text-xs text-ink/55 dark:text-slate-400">{fund ? fund.name : "Seleccioná un fondo"}</p>
        </div>
        {fundClass ? <span className="text-xs text-ink/55 dark:text-slate-400">Clase: {fundClass.name}</span> : null}
      </div>

      <div className="min-h-48 p-3">
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-ink/60 dark:text-slate-400" role="status">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando tenencias...
          </div>
        ) : holdings.length ? (
          <>
            {isReference ? <p className="mb-3 text-xs text-ink/55 dark:text-slate-400">Distribución de referencia por tipo de renta; CAFCI no publicó la cartera de esta clase.</p> : null}
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {holdings.map((holding) => (
                <div key={holding.name}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-ink/70 dark:text-slate-300" title={holding.name}>{holding.name}</span>
                    <strong className="numeric shrink-0 text-ink dark:text-slate-100">{formatNumber(holding.percentage, 2)}%</strong>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-panel dark:bg-slate-800"
                    role="progressbar"
                    aria-label={`${holding.name}: ${formatNumber(holding.percentage, 2)}%`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={holding.percentage}
                  >
                    <div className="h-full rounded-full bg-gain" style={{ width: `${Math.min(holding.percentage, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-ink/60 dark:text-slate-400">No hay composición publicada para este fondo.</p>
        )}
      </div>
    </section>
  );
}

export function FundsBrowser({ funds }: { funds: FundSnapshot[] }) {
  const [query, setQuery] = useState("");
  const [managerFilter, setManagerFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(funds[0]?.id);

  const managers = useMemo(
    () => ["all", ...Array.from(new Set(funds.flatMap((fund) => fund.manager ? [fund.manager] : []))).toSorted()],
    [funds]
  );
  const filteredFunds = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return funds.filter((fund) => {
      const matchesManager = managerFilter === "all" || fund.manager === managerFilter;
      const matchesQuery =
        !normalizedQuery ||
        `${fund.name} ${fund.manager ?? ""} ${fund.incomeType ?? ""} ${fund.currency ?? ""}`.toLowerCase().includes(normalizedQuery);
      return matchesManager && matchesQuery;
    });
  }, [funds, managerFilter, query]);
  const selectedFund = filteredFunds.find((fund) => fund.id === selectedId) ?? filteredFunds[0];

  return (
    <div className="space-y-3">
      <div className="grid min-h-[calc(100vh-96px)] gap-3 lg:grid-cols-2">
        <section className="rounded border border-line bg-white shadow-table dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-line px-3 py-2 dark:border-slate-700">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold uppercase tracking-normal text-ink dark:text-slate-100">Fondos CAFCI</h2>
            <span className="text-xs text-ink/55 dark:text-slate-400">{filteredFunds.length} fondos</span>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_220px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45 dark:text-slate-500" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar fondo o sociedad gerente"
                className="h-9 w-full rounded border border-line bg-panel pl-8 pr-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </label>
            <select
              value={managerFilter}
              onChange={(event) => setManagerFilter(event.target.value)}
              aria-label="Filtrar por administradora"
              className="h-9 rounded border border-line bg-panel px-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {managers.map((manager) => (
                <option key={manager} value={manager}>
                  {manager === "all" ? "Todas las administradoras" : manager}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="max-h-[calc(100vh-210px)] overflow-y-auto">
          {filteredFunds.length ? filteredFunds.map((fund) => {
            const active = fund.id === selectedFund?.id;
            return (
              <button
                key={fund.id}
                type="button"
                onClick={() => setSelectedId(fund.id)}
                className={`block w-full border-b border-line px-3 py-3 text-left last:border-0 transition dark:border-slate-700 ${
                  active ? "bg-panel dark:bg-slate-800" : "hover:bg-panel/80 dark:hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-bold text-ink dark:text-slate-100">{fund.name}</strong>
                    <span className="mt-1 block truncate text-xs text-ink/60 dark:text-slate-400">{fund.manager ?? fund.depositary ?? "-"}</span>
                  </span>
                  <span className="shrink-0 rounded border border-line bg-white px-2 py-1 text-[11px] font-semibold uppercase text-ink/55 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                    {compactNumber(fund.assets)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-ink/55 dark:text-slate-400">
                  <span>{fund.incomeType ?? "-"}</span>
                  <span>-</span>
                  <span>{fund.region ?? "-"}</span>
                  <span>-</span>
                  <span>{fund.classes.length} clases</span>
                </div>
              </button>
            );
          }) : (
            <div className="px-3 py-8 text-sm text-ink/60 dark:text-slate-400">No hay fondos para ese filtro.</div>
          )}
        </div>
        </section>

        <FundHoldingsChart fund={selectedFund} />
      </div>

      <section className="rounded border border-line bg-white shadow-table dark:border-slate-700 dark:bg-slate-900">
        {selectedFund ? (
          <>
            <div className="border-b border-line px-3 py-3 dark:border-slate-700">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-black uppercase tracking-normal text-ink dark:text-slate-100">{selectedFund.name}</h2>
                  <p className="mt-1 text-xs text-ink/55 dark:text-slate-400">{selectedFund.manager ?? "-"}</p>
                </div>
                <span className="text-xs text-ink/55 dark:text-slate-400">Actualizado {formatDateTime(selectedFund.updatedAt)}</span>
              </div>
            </div>

            <div className="grid gap-3 p-3 xl:grid-cols-[260px_1fr]">
              <div>
                <FundStat label="Tipo de renta" value={selectedFund.incomeType} />
                <FundStat label="Moneda" value={selectedFund.currency} />
                <FundStat label="Region" value={selectedFund.region} />
                <FundStat label="Horizonte" value={selectedFund.horizon} />
                <FundStat label="Patrimonio" value={compactNumber(selectedFund.assets)} />
                <FundStat label="Market share" value={selectedFund.marketShare === undefined ? undefined : `${formatNumber(selectedFund.marketShare, 3)}%`} />
                <FundStat label="Variacion dia" value={formatPercent(selectedFund.dayChangePercent)} />
                <FundStat label="Codigo CNV" value={selectedFund.cnvCode} />
              </div>

              <div className="min-w-0">
                <div className="mb-3">
                  <h3 className="text-xs font-bold uppercase text-ink/60 dark:text-slate-400">Objetivo</h3>
                  <p className="mt-1 max-h-28 overflow-y-auto text-sm leading-6 text-ink/70 dark:text-slate-300">
                    {selectedFund.objective ?? "Datos diarios CAFCI por clase, agrupados por fondo."}
                  </p>

                  <div className="mt-3 border-t border-line pt-3 dark:border-slate-700">
                    <h3 className="text-xs font-bold uppercase text-ink/60 dark:text-slate-400">Fee administrativo</h3>
                    {selectedFund.classes.some((fundClass) => fundClass.managementFee) ? (
                      <dl className="mt-1 space-y-1 text-sm text-ink/70 dark:text-slate-300">
                        {selectedFund.classes
                          .filter((fundClass) => fundClass.managementFee)
                          .map((fundClass) => (
                            <div key={fundClass.id} className="flex items-baseline justify-between gap-3">
                              <dt className="min-w-0 truncate">{fundClass.name}</dt>
                              <dd className="numeric shrink-0 font-semibold text-ink dark:text-slate-100">
                                {managementFeeLabel(fundClass.managementFee)}
                              </dd>
                            </div>
                          ))}
                      </dl>
                    ) : (
                      <p className="mt-1 text-sm text-ink/55 dark:text-slate-400">No informado.</p>
                    )}
                  </div>
                </div>

                <div className="table-scroll overflow-x-auto rounded border border-line dark:border-slate-700">
                  <table className="min-w-[640px] w-full border-collapse text-sm">
                    <thead className="bg-panel text-[11px] uppercase tracking-normal text-ink/60 dark:bg-slate-950 dark:text-slate-400">
                      <tr>
                        <th className="border-b border-line px-3 py-2 text-left font-semibold dark:border-slate-700">Clase</th>
                        <th className="border-b border-line px-3 py-2 text-left font-semibold dark:border-slate-700">Moneda</th>
                        <th className="border-b border-line px-3 py-2 text-right font-semibold dark:border-slate-700">VCP</th>
                        <th className="border-b border-line px-3 py-2 text-right font-semibold dark:border-slate-700">Var dia</th>
                        <th className="border-b border-line px-3 py-2 text-right font-semibold dark:border-slate-700">Patrimonio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFund.classes.map((fundClass) => (
                        <FundClassRow key={fundClass.id} fundClass={fundClass} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-3 text-sm text-ink/60 dark:text-slate-400">Sin fondos disponibles.</div>
        )}
      </section>
    </div>
  );
}
