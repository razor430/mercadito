"use client";

import { formatNumber, formatPercent } from "@/lib/format";
import type { CurrencyRate } from "@/lib/types";

export function CurrencyStrip({ rows }: { rows: CurrencyRate[] }) {
  return (
    <section id="dolares" className="rounded border border-line bg-white shadow-table dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-line px-3 py-2 dark:border-slate-700">
        <h2 className="text-sm font-bold uppercase tracking-normal text-ink">Dólares y FX</h2>
      </div>
      <div className="grid gap-px bg-line dark:bg-slate-700 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <div key={row.symbol} className="bg-white px-3 py-3 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase text-ink/60 dark:text-slate-400">{row.name}</span>
              <span className="text-[11px] text-ink/45 dark:text-slate-500">{row.source}</span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-3">
              <strong className="numeric text-xl leading-none text-ink dark:text-slate-100">{formatNumber(row.price, row.price > 20 ? 2 : 4)}</strong>
              <span className={`numeric text-xs font-semibold ${row.changePercent >= 0 ? "text-gain" : "text-loss"}`}>
                {formatPercent(row.changePercent)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
