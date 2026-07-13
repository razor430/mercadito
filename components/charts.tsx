"use client";

import { createChart, ColorType, IChartApi } from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BondMetric, HistoricalBar, QuoteSnapshot } from "@/lib/types";

function useDarkTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => setIsDark(document.documentElement.classList.contains("dark"));
    updateTheme();
    window.addEventListener("themechange", updateTheme);
    return () => window.removeEventListener("themechange", updateTheme);
  }, []);

  return isDark;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

export function PriceChart({ symbol, initialBars = [] }: { symbol: string; initialBars?: HistoricalBar[] }) {
  const { ref, width } = useElementSize<HTMLDivElement>();
  const chartRef = useRef<IChartApi | null>(null);
  const [bars, setBars] = useState<HistoricalBar[]>(initialBars);
  const isDark = useDarkTheme();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/market/history?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data: HistoricalBar[]) => {
        if (!cancelled) setBars(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    if (!ref.current || chartRef.current) return;
    chartRef.current = createChart(ref.current, {
      height: 260,
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#4b5b50"
      },
      grid: {
        vertLines: { color: "#edf1ee" },
        horzLines: { color: "#edf1ee" }
      },
      rightPriceScale: { borderColor: "#dbe3dd" },
      timeScale: { borderColor: "#dbe3dd" },
      crosshair: { mode: 0 }
    });
    return () => {
      chartRef.current?.remove();
      chartRef.current = null;
    };
  }, [ref]);

  useEffect(() => {
    chartRef.current?.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0f172a" : "#ffffff" },
        textColor: isDark ? "#cbd5e1" : "#4b5b50"
      },
      grid: {
        vertLines: { color: isDark ? "#1f2937" : "#edf1ee" },
        horzLines: { color: isDark ? "#1f2937" : "#edf1ee" }
      },
      rightPriceScale: { borderColor: isDark ? "#334155" : "#dbe3dd" },
      timeScale: { borderColor: isDark ? "#334155" : "#dbe3dd" }
    });
  }, [isDark]);

  useEffect(() => {
    chartRef.current?.resize(width, 260);
  }, [width]);

  useEffect(() => {
    if (!chartRef.current || !bars.length) return;
    const candleSeries = chartRef.current.addCandlestickSeries({
      upColor: "#087a3d",
      downColor: "#b42318",
      borderUpColor: "#087a3d",
      borderDownColor: "#b42318",
      wickUpColor: "#087a3d",
      wickDownColor: "#b42318"
    });
    candleSeries.setData(
      bars.map((bar) => ({
        time: bar.time,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close
      }))
    );
    chartRef.current.timeScale().fitContent();
    return () => chartRef.current?.removeSeries(candleSeries);
  }, [bars]);

  return (
    <section className="rounded border border-line bg-white shadow-table dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-line px-3 py-2 dark:border-slate-700">
        <h2 className="text-sm font-bold uppercase tracking-normal text-ink">Histórico {symbol}</h2>
        <span className="text-xs text-ink/55 dark:text-slate-400">OHLCV</span>
      </div>
      <div ref={ref} className="h-[260px] w-full" />
    </section>
  );
}

export function VolumeChart({ rows }: { rows: Array<QuoteSnapshot | BondMetric> }) {
  const isDark = useDarkTheme();
  const axisColor = isDark ? "#94a3b8" : "#4b5b50";
  const data = useMemo(
    () =>
      [...rows]
        .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
        .slice(0, 8)
        .map((row) => ({ symbol: row.symbol, volume: row.volume ?? 0 })),
    [rows]
  );

  return (
    <section className="rounded border border-line bg-white shadow-table dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-line px-3 py-2 dark:border-slate-700">
        <h2 className="text-sm font-bold uppercase tracking-normal text-ink">Volumen líder</h2>
      </div>
      <div className="h-[260px] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="symbol" tick={{ fontSize: 11, fill: axisColor }} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} />
            <Tooltip />
            <Bar dataKey="volume" fill="#355e49" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export function AssetShareChart({ rows }: { rows: Array<QuoteSnapshot | BondMetric> }) {
  const isDark = useDarkTheme();
  const colors = ["#087a3d", "#355e49", "#a15c04", "#52718b", "#7b6d4b"];
  const data = useMemo(() => {
    const totals = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.type] = (acc[row.type] ?? 0) + Math.max(row.volume ?? row.price, 1);
      return acc;
    }, {});
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [rows]);

  return (
    <section className="rounded border border-line bg-white shadow-table dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-line px-3 py-2 dark:border-slate-700">
        <h2 className="text-sm font-bold uppercase tracking-normal text-ink">Distribución</h2>
      </div>
      <div className="h-[260px] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ color: isDark ? "#cbd5e1" : "#17211b" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
