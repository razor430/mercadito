import { ArrowLeft, Landmark } from "lucide-react";
import Link from "next/link";
import { FundsBrowser } from "@/components/funds-browser";
import { ThemeToggle } from "@/components/theme-toggle";
import { getFunds } from "@/lib/market-service";

export const dynamic = "force-dynamic";

export default async function FundsPage() {
  const funds = await getFunds();

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
              <Landmark className="h-5 w-5 text-gain" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-black uppercase tracking-normal text-ink dark:text-slate-100">Fondos</h1>
              <p className="text-xs text-ink/55 dark:text-slate-400">FCI del mercado argentino</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-3 py-4">
        <FundsBrowser funds={funds} />
      </div>
    </main>
  );
}
