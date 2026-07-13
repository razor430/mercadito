"use client";

import { Activity, Database } from "lucide-react";
import { formatPercent } from "@/lib/format";
import type { DataSource } from "@/lib/types";

export function MetricCard({ label, value, delta, source }: { label: string; value: string; delta?: number; source: DataSource }) {
  const positive = (delta ?? 0) >= 0;

  return (
    <div className="rounded border border-line bg-white px-3 py-2 shadow-table dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-normal text-ink/60 dark:text-slate-400">
        <span>{label}</span>
        <Database className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="mt-1 flex items-end justify-between gap-3">
        <strong className="numeric text-lg leading-none text-ink dark:text-slate-100">{value}</strong>
        {delta !== undefined ? (
          <span className={`numeric flex items-center gap-1 text-xs font-semibold ${positive ? "text-gain" : "text-loss"}`}>
            <Activity className="h-3 w-3" aria-hidden="true" />
            {formatPercent(delta)}
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-[11px] text-ink/55 dark:text-slate-400">{source}</div>
    </div>
  );
}
