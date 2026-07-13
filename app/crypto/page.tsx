import { ArrowLeft, Bitcoin, RefreshCw } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { getCryptoBasis } from "@/lib/market-service";

export const dynamic = "force-dynamic";

export default async function CryptoPage() {
  const rows = await getCryptoBasis();
  const updatedAt = rows[0]?.updatedAt ?? new Date().toISOString();
  const sources = Array.from(new Set(rows.map((row) => row.source))).join(", ");

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-950/92">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-line bg-panel text-ink hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded border border-line bg-panel dark:border-slate-700 dark:bg-slate-900">
              <Bitcoin className="h-5 w-5 text-amber" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-black uppercase tracking-normal text-ink dark:text-slate-100">Crypto Basis</h1>
              <p className="text-xs text-ink/55 dark:text-slate-400">BTC y ETH spot contra futuros trimestrales</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-4">
        <section className="rounded border border-line bg-white shadow-table dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-2 border-b border-line px-3 py-2 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-gain" aria-hidden="true" />
              <h2 className="text-sm font-bold uppercase tracking-normal text-ink dark:text-slate-100">Spot vs Futuro</h2>
            </div>
            <span className="text-xs text-ink/55 dark:text-slate-400">Actualizado {formatDateTime(updatedAt)}</span>
          </div>

          <div className="table-scroll overflow-x-auto">
            <table className="min-w-[1140px] w-full border-collapse text-sm">
              <thead className="bg-panel text-[11px] uppercase tracking-normal text-ink/60 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="border-b border-line px-3 py-2 text-left font-semibold dark:border-slate-700">Activo</th>
                  <th className="border-b border-line px-3 py-2 text-left font-semibold dark:border-slate-700">Spot</th>
                  <th className="border-b border-line px-3 py-2 text-left font-semibold dark:border-slate-700">Contrato</th>
                  <th className="border-b border-line px-3 py-2 text-left font-semibold dark:border-slate-700">Futuro</th>
                  <th className="border-b border-line px-3 py-2 text-right font-semibold dark:border-slate-700">Precio spot</th>
                  <th className="border-b border-line px-3 py-2 text-right font-semibold dark:border-slate-700">Precio futuro</th>
                  <th className="border-b border-line px-3 py-2 text-right font-semibold dark:border-slate-700">Vencimiento</th>
                  <th className="border-b border-line px-3 py-2 text-right font-semibold dark:border-slate-700">D&iacute;as</th>
                  <th className="border-b border-line px-3 py-2 text-right font-semibold dark:border-slate-700">Futuro / spot</th>
                  <th className="border-b border-line px-3 py-2 text-right font-semibold dark:border-slate-700">Rend. directo</th>
                  <th className="border-b border-line px-3 py-2 text-right font-semibold dark:border-slate-700">Rend. anualizado</th>
                  <th className="border-b border-line px-3 py-2 text-left font-semibold dark:border-slate-700">Fuente</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.asset}-${row.futureSymbol}`} className="border-b border-line last:border-0 hover:bg-panel/80 dark:border-slate-700 dark:hover:bg-slate-800/70">
                    <td className="px-3 py-3 font-bold text-ink dark:text-slate-100">{row.asset}</td>
                    <td className="px-3 py-3 text-ink/70 dark:text-slate-300">{row.spotSymbol}</td>
                    <td className="px-3 py-3 text-ink/70 dark:text-slate-300">{row.contractLabel}</td>
                    <td className="px-3 py-3 text-ink/70 dark:text-slate-300">{row.futureSymbol}</td>
                    <td className="numeric px-3 py-3 text-right text-ink dark:text-slate-100">US$ {formatNumber(row.spotPrice, 2)}</td>
                    <td className="numeric px-3 py-3 text-right text-ink dark:text-slate-100">US$ {formatNumber(row.futurePrice, 2)}</td>
                    <td className="numeric px-3 py-3 text-right text-ink/70 dark:text-slate-300">{row.maturityDate}</td>
                    <td className="numeric px-3 py-3 text-right text-ink/70 dark:text-slate-300">{row.daysToMaturity}</td>
                    <td className="numeric px-3 py-3 text-right font-semibold text-ink dark:text-slate-100">
                      {formatNumber(row.futureOverSpot, 4)} ({formatPercent((row.futureOverSpot - 1) * 100)})
                    </td>
                    <td className={`numeric px-3 py-3 text-right font-semibold ${row.futureOverSpot >= 1 ? "text-gain" : "text-loss"}`}>
                      {formatPercent((row.futureOverSpot - 1) * 100)}
                    </td>
                    <td className={`numeric px-3 py-3 text-right font-semibold ${row.annualizedYield >= 0 ? "text-gain" : "text-loss"}`}>
                      {formatPercent(row.annualizedYield * 100)}
                    </td>
                    <td className="px-3 py-3 text-ink/70 dark:text-slate-300">{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-3 text-xs text-ink/55 dark:text-slate-400">
          Fuente: {sources}. El rendimiento directo es futuro / spot - 1. El rendimiento anualizado usa capitalizaci&oacute;n simple:
          (futuro / spot - 1) * 365 / d&iacute;as al vencimiento.
        </p>
      </div>
    </main>
  );
}
