import { ArrowLeft, BarChart3, Landmark, LineChart } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceChart } from "@/components/charts";
import { compactNumber, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { getInstrumentDetail } from "@/lib/market-service";
import type { BondCashFlowProfile, BondMetric, BondTechnicalInfo, HistoricalBar, QuoteSnapshot } from "@/lib/types";

type Props = {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ origen?: string }>;
};

function isBond(quote: QuoteSnapshot | BondMetric): quote is BondMetric {
  return quote.type === "bond";
}

function cleanDate(value?: string) {
  if (!value) return "-";
  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(date);
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-line bg-white px-3 py-2 shadow-table">
      <span className="text-[11px] font-bold uppercase text-ink/55">{label}</span>
      <strong className="mt-1 block text-sm text-ink">{value}</strong>
    </div>
  );
}

function movingAverage(history: HistoricalBar[], period: number) {
  if (history.length < period) return undefined;
  const closes = history.slice(-period).map((bar) => bar.close);
  return closes.reduce((sum, close) => sum + close, 0) / closes.length;
}

function rsi(history: HistoricalBar[], period = 14) {
  if (history.length <= period) return undefined;
  let gains = 0;
  let losses = 0;
  const closes = history.slice(-(period + 1)).map((bar) => bar.close);
  for (let index = 1; index < closes.length; index += 1) {
    const change = closes[index]! - closes[index - 1]!;
    if (change >= 0) gains += change;
    else losses -= change;
  }
  if (losses === 0) return 100;
  const relativeStrength = gains / losses;
  return 100 - 100 / (1 + relativeStrength);
}

function beta(history: HistoricalBar[], benchmark: HistoricalBar[]) {
  const benchmarkByDate = new Map(benchmark.map((bar) => [bar.time, bar.close]));
  const aligned = history
    .map((bar) => ({ asset: bar.close, benchmark: benchmarkByDate.get(bar.time) }))
    .filter((bar): bar is { asset: number; benchmark: number } => bar.benchmark !== undefined)
    .slice(-61);
  if (aligned.length < 11) return undefined;

  const returns = aligned.slice(1).map((current, index) => ({
    asset: current.asset / aligned[index]!.asset - 1,
    benchmark: current.benchmark / aligned[index]!.benchmark - 1
  }));
  const averageAsset = returns.reduce((sum, value) => sum + value.asset, 0) / returns.length;
  const averageBenchmark = returns.reduce((sum, value) => sum + value.benchmark, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value.benchmark - averageBenchmark) ** 2, 0);
  if (variance === 0) return undefined;
  const covariance = returns.reduce((sum, value) => sum + (value.asset - averageAsset) * (value.benchmark - averageBenchmark), 0);
  return covariance / variance;
}

function IndicatorsPanel({ quote, history, benchmarkHistory }: { quote: QuoteSnapshot | BondMetric; history: HistoricalBar[]; benchmarkHistory: HistoricalBar[] }) {
  const technical = [
    { label: "Media móvil 50", value: formatNumber(movingAverage(history, 50), 2) },
    { label: "Media móvil 200", value: formatNumber(movingAverage(history, 200), 2) },
    { label: "RSI (14)", value: formatNumber(rsi(history), 2) }
  ];
  const fundamentals = [
    { label: "P/E", value: formatNumber(quote.peRatio, 2) },
    { label: "Beta vs. Merval", value: formatNumber(quote.beta ?? beta(history, benchmarkHistory), 2) },
    { label: "Valor libro", value: formatNumber(quote.bookValue, 2) }
  ];

  return (
    <section className="rounded border border-line bg-white shadow-table">
      <div className="border-b border-line px-3 py-2">
        <h2 className="text-sm font-bold uppercase tracking-normal text-ink">Indicadores</h2>
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase text-ink/55">Técnicos</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {technical.map((indicator) => <DetailStat key={indicator.label} {...indicator} />)}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase text-ink/55">Fundamentales</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {fundamentals.map((indicator) => <DetailStat key={indicator.label} {...indicator} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

function BondTechnicalPanel({ info }: { info?: BondTechnicalInfo }) {
  if (!info) return null;

  return (
    <section className="rounded border border-line bg-white shadow-table">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <Landmark className="h-4 w-4 text-gain" aria-hidden="true" />
        <h2 className="text-sm font-bold uppercase tracking-normal text-ink">Ficha tecnica</h2>
      </div>
      <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailStat label="Emisor" value={info.issuer ?? "-"} />
        <DetailStat label="ISIN" value={info.isin ?? "-"} />
        <DetailStat label="Ley" value={info.law ?? info.lawCountry ?? "-"} />
        <DetailStat label="Moneda" value={info.currency ?? "-"} />
        <DetailStat label="Tipo" value={info.speciesType ?? "-"} />
        <DetailStat label="Obligacion" value={info.obligationType ?? "-"} />
        <DetailStat label="Denominacion minima" value={formatNumber(info.minimumDenomination, 0)} />
        <DetailStat label="Monto residual" value={compactNumber(info.residualAmount)} />
      </div>
      <div className="grid gap-3 border-t border-line p-3 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase text-ink/60">Amortizacion</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/75">{info.amortization ?? "-"}</p>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase text-ink/60">Intereses</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink/75">{info.interest ?? "-"}</p>
        </div>
      </div>
    </section>
  );
}

function BondCashFlowPanel({ profile }: { profile?: BondCashFlowProfile }) {
  if (!profile) return null;
  const flows = profile.flows.slice(0, 12);

  return (
    <section className="rounded border border-line bg-white shadow-table">
      <div className="flex flex-col gap-1 border-b border-line px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gain" aria-hidden="true" />
          <h2 className="text-sm font-bold uppercase tracking-normal text-ink">Flujo de fondos MAE</h2>
        </div>
        <span className="text-xs text-ink/55">{profile.description ?? profile.symbol}</span>
      </div>
      <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailStat label="Precio MAE" value={formatNumber(profile.price, 2)} />
        <DetailStat label="TIR MAE" value={profile.yield === undefined ? "-" : `${formatNumber(profile.yield, 2)}%`} />
        <DetailStat label="MD MAE" value={formatNumber(profile.duration, 2)} />
        <DetailStat label="Moneda MAE" value={profile.currency ?? "-"} />
      </div>
      {flows.length ? (
        <div className="table-scroll overflow-x-auto border-t border-line">
          <table className="min-w-[760px] w-full border-collapse text-sm">
            <thead className="bg-panel text-[11px] uppercase tracking-normal text-ink/60">
              <tr>
                <th className="border-b border-line px-3 py-2 text-left font-semibold">Fecha pago</th>
                <th className="border-b border-line px-3 py-2 text-right font-semibold">VR</th>
                <th className="border-b border-line px-3 py-2 text-right font-semibold">Renta</th>
                <th className="border-b border-line px-3 py-2 text-right font-semibold">Amortizacion</th>
                <th className="border-b border-line px-3 py-2 text-right font-semibold">Cashflow</th>
                <th className="border-b border-line px-3 py-2 text-right font-semibold">A+R</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((flow, index) => (
                <tr key={`${flow.paymentDate ?? "flow"}-${index}`} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 text-ink">{cleanDate(flow.paymentDate)}</td>
                  <td className="numeric px-3 py-2 text-right text-ink/75">{formatNumber(flow.residualValue, 4)}</td>
                  <td className="numeric px-3 py-2 text-right text-ink/75">{formatNumber(flow.interest, 4)}</td>
                  <td className="numeric px-3 py-2 text-right text-ink/75">{formatNumber(flow.amortization, 4)}</td>
                  <td className="numeric px-3 py-2 text-right font-semibold text-ink">{formatNumber(flow.cashFlow, 4)}</td>
                  <td className="numeric px-3 py-2 text-right text-ink/75">{formatNumber(flow.total, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="border-t border-line p-3 text-sm text-ink/65">MAE informo metricas, pero no publico detalle de pagos para este ticker.</p>
      )}
    </section>
  );
}

export default async function InstrumentPage({ params, searchParams }: Props) {
  const { symbol } = await params;
  const { origen } = await searchParams;
  const detail = await getInstrumentDetail(decodeURIComponent(symbol));
  if (!detail) notFound();

  const { quote, history, benchmarkHistory = [], bondInfo, bondCashFlow } = detail;
  const quoteIsBond = isBond(quote);
  const returnHref = origen === "acciones" ? "/acciones" : "/#mercado";
  const returnLabel = origen === "acciones" ? "Volver a acciones" : "Volver al panel";
  const sourceLine = `${quote.market} · ${quote.source} · ${formatDateTime(quote.updatedAt)}`;

  return (
    <main className="mx-auto max-w-7xl px-3 py-4">
      <Link href={returnHref} className="inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm text-ink shadow-table hover:bg-panel">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {returnLabel}
      </Link>

      <header className="mt-3 rounded border border-line bg-white p-4 shadow-table">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-ink/55">
              <LineChart className="h-4 w-4 text-gain" aria-hidden="true" />
              {quote.type}
            </div>
            <h1 className="mt-1 text-3xl font-black text-ink">{quote.symbol}</h1>
            <p className="mt-1 max-w-3xl text-sm text-ink/70">{quote.name}</p>
            <p className="mt-2 text-xs text-ink/50">{sourceLine}</p>
          </div>
          <div className="text-left lg:text-right">
            <span className="text-xs font-bold uppercase text-ink/55">Ultimo</span>
            <strong className="block text-3xl font-black text-ink">
              {quote.currency} {formatNumber(quote.price, quote.price > 100 ? 2 : 4)}
            </strong>
            <span className={`numeric text-sm font-bold ${quote.changePercent >= 0 ? "text-gain" : "text-loss"}`}>
              {formatPercent(quote.changePercent)}
            </span>
          </div>
        </div>
      </header>

      <section className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <DetailStat label="Apertura" value={formatNumber(quote.open, 2)} />
        <DetailStat label="Maximo" value={formatNumber(quote.high, 2)} />
        <DetailStat label="Minimo" value={formatNumber(quote.low, 2)} />
        <DetailStat label="Volumen" value={compactNumber(quote.volume)} />
        {quoteIsBond ? <DetailStat label="TIR" value={quote.yield === undefined ? "-" : `${formatNumber(quote.yield, 2)}%`} /> : null}
        {quoteIsBond ? <DetailStat label="Duration" value={formatNumber(quote.duration, 2)} /> : null}
        {quoteIsBond ? <DetailStat label="Paridad" value={quote.parity === undefined ? "-" : `${formatNumber(quote.parity, 2)}%`} /> : null}
        {quoteIsBond ? <DetailStat label="Vencimiento" value={cleanDate(quote.maturityDate ?? bondInfo?.maturityDate)} /> : null}
      </section>

      <section className="mt-3 grid gap-3 xl:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <PriceChart symbol={quote.symbol} initialBars={history} />
          <IndicatorsPanel quote={quote} history={history} benchmarkHistory={benchmarkHistory} />
        </div>
        <aside className="rounded border border-line bg-white p-3 shadow-table">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gain" aria-hidden="true" />
            <h2 className="text-sm font-bold uppercase tracking-normal text-ink">Caracteristicas</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between gap-3 border-b border-line pb-2">
              <span className="text-ink/60">Mercado</span>
              <strong className="text-ink">{quote.market}</strong>
            </p>
            <p className="flex justify-between gap-3 border-b border-line pb-2">
              <span className="text-ink/60">Moneda</span>
              <strong className="text-ink">{quote.currency}</strong>
            </p>
            <p className="flex justify-between gap-3 border-b border-line pb-2">
              <span className="text-ink/60">Cierre previo</span>
              <strong className="numeric text-ink">{formatNumber(quote.previousClose, 2)}</strong>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-ink/60">{quoteIsBond ? "Descripcion" : "Sector"}</span>
              <strong className="text-right text-ink">{quote.sector || bondInfo?.denomination || bondCashFlow?.description || "-"}</strong>
            </p>
          </div>
        </aside>
      </section>

      {quoteIsBond ? (
        <div className="mt-3 space-y-3">
          <BondCashFlowPanel profile={bondCashFlow} />
          <BondTechnicalPanel info={bondInfo} />
        </div>
      ) : null}
    </main>
  );
}
