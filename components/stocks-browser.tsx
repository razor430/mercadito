"use client";

import { BarChart3, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MarketTable } from "@/components/market-table";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMarketData } from "@/components/use-market-data";
import { isGeneralPanelStock, isMervalStock } from "@/lib/stock-filters";
import type { QuoteSnapshot } from "@/lib/types";

type Panel = "merval" | "general";

const panels: Array<{ id: Panel; label: string; title: string }> = [
  { id: "merval", label: "Merval", title: "Acciones del S&P Merval" },
  { id: "general", label: "Panel general", title: "Acciones del panel general" }
];

export function StocksBrowser({ initialStocks }: { initialStocks: QuoteSnapshot[] }) {
  const stocks = useMarketData("/api/market/stocks", initialStocks);
  const [activePanel, setActivePanel] = useState<Panel>("merval");
  const rows = useMemo(
    () => stocks.data.filter(activePanel === "merval" ? isMervalStock : isGeneralPanelStock),
    [activePanel, stocks.data]
  );
  const currentPanel = panels.find((panel) => panel.id === activePanel) ?? panels[0];

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-950/92">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-line bg-panel text-ink transition hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800" aria-label="Volver al inicio">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <div className="flex min-w-0 items-center gap-2">
              <BarChart3 className="h-5 w-5 shrink-0 text-gain" aria-hidden="true" />
              <div>
                <h1 className="text-base font-black uppercase tracking-normal text-ink dark:text-slate-100">Acciones argentinas</h1>
                <p className="text-xs text-ink/55 dark:text-slate-400">Cotizaciones y volumen por panel</p>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-4">
        <nav className="mb-3 flex gap-1 border-b border-line dark:border-slate-700" aria-label="Paneles de acciones">
          {panels.map((panel) => {
            const isActive = panel.id === activePanel;
            return (
              <button
                key={panel.id}
                type="button"
                onClick={() => setActivePanel(panel.id)}
                aria-current={isActive ? "page" : undefined}
                className={`border-b-2 px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gain ${isActive ? "border-gain text-gain" : "border-transparent text-ink/65 hover:border-line hover:text-ink dark:text-slate-400 dark:hover:text-slate-100"}`}
              >
                {panel.label}
              </button>
            );
          })}
        </nav>

        <MarketTable title={currentPanel.title} rows={rows} variant="stocks" showSource={false} paginate={false} />
      </div>
    </main>
  );
}
