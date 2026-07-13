"use client";

import { useEffect, useState, useTransition } from "react";

type Status = "idle" | "refreshing" | "error";

export function useMarketData<T>(endpoint: string, initialData: T, refreshMs = 45_000) {
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState<Status>("idle");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      setStatus("refreshing");
      try {
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const next = (await response.json()) as T;
        if (!cancelled) {
          startTransition(() => setData(next));
          setStatus("idle");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    const timer = window.setInterval(refresh, refreshMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [endpoint, refreshMs]);

  return { data, status: isPending ? "refreshing" : status, refreshLabel: status === "error" ? "fallback activo" : "auto refresh" };
}
