"use client";

import { ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import type { NewsItem } from "@/lib/types";

export function NewsFeed({ items }: { items: NewsItem[] }) {
  return (
    <section id="noticias" className="rounded border border-line bg-white shadow-table dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-line px-3 py-2 dark:border-slate-700">
        <h2 className="text-sm font-bold uppercase tracking-normal text-ink dark:text-slate-100">Noticias</h2>
      </div>
      <div className="divide-y divide-line dark:divide-slate-700">
        {items.slice(0, 8).map((item) => (
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block px-3 py-3 hover:bg-panel dark:hover:bg-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold leading-snug text-ink dark:text-slate-100">{item.title}</h3>
                <p className="mt-1 text-xs text-ink/55 dark:text-slate-400">
                  {item.source} · {formatDateTime(item.publishedAt)}
                </p>
              </div>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-ink/45 dark:text-slate-500" aria-hidden="true" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
