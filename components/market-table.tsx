"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { compactNumber, formatNumber, formatPercent } from "@/lib/format";
import type { BondMetric, QuoteSnapshot } from "@/lib/types";

type Row = QuoteSnapshot | BondMetric;
type TableVariant = "default" | "bonds" | "stocks";

function instrumentHref(symbol: string) {
  return `/instrumento/${encodeURIComponent(symbol)}`;
}

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "symbol",
    header: "Ticker",
    cell: ({ row }) => (
      <Link className="font-semibold text-gain underline-offset-2 hover:underline" href={instrumentHref(row.original.symbol)}>
        {row.original.symbol}
      </Link>
    )
  },
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => <span className="block max-w-[220px] truncate text-ink/75 dark:text-slate-300">{row.original.name}</span>
  },
  {
    accessorKey: "price",
    header: "Último",
    cell: ({ row }) => <span className="numeric">{formatNumber(row.original.price, row.original.price > 100 ? 2 : 4)}</span>
  },
  {
    accessorKey: "changePercent",
    header: "Var %",
    cell: ({ row }) => (
      <span className={`numeric font-semibold ${row.original.changePercent >= 0 ? "text-gain" : "text-loss"}`}>
        {formatPercent(row.original.changePercent)}
      </span>
    )
  },
  {
    accessorKey: "volume",
    header: "Volumen",
    cell: ({ row }) => <span className="numeric">{compactNumber(row.original.volume)}</span>
  },
  {
    accessorKey: "currency",
    header: "Moneda"
  },
  {
    accessorKey: "market",
    header: "Mercado"
  },
  {
    accessorKey: "yield",
    header: "TIR",
    cell: ({ row }) => {
      const value = "yield" in row.original ? row.original.yield : undefined;
      return <span className="numeric">{value === undefined ? "-" : `${formatNumber(value, 2)}%`}</span>;
    }
  },
  {
    accessorKey: "source",
    header: "Fuente"
  }
];

const columnsWithoutSource = columns.slice(0, -1);

function ChangeCell({ value }: { value: number | undefined }) {
  if (value === undefined) return <span className="numeric">-</span>;
  return <span className={`numeric font-semibold ${value >= 0 ? "text-gain" : "text-loss"}`}>{formatPercent(value)}</span>;
}

const performanceColumns: ColumnDef<Row>[] = [
  {
    accessorKey: "monthChangePercent",
    header: "Var. mes",
    cell: ({ row }) => <ChangeCell value={row.original.monthChangePercent} />
  },
  {
    accessorKey: "ytdChangePercent",
    header: "Var. año",
    cell: ({ row }) => <ChangeCell value={row.original.ytdChangePercent} />
  }
];

const stockColumns: ColumnDef<Row>[] = [
  {
    accessorKey: "symbol",
    header: "Ticker",
    cell: ({ row }) => (
      <Link className="font-semibold text-gain underline-offset-2 hover:underline" href={`${instrumentHref(row.original.symbol)}?origen=acciones`}>
        {row.original.symbol}
      </Link>
    )
  },
  columns[2]!,
  columns[3]!,
  ...performanceColumns,
  columns[4]!,
  columns[5]!,
  columns[6]!,
  columns[8]!
];
const stockColumnsWithoutSource = stockColumns.slice(0, -1);

const bondColumns: ColumnDef<Row>[] = [
  {
    accessorKey: "symbol",
    header: "Ticker",
    cell: ({ row }) => (
      <Link className="font-semibold text-gain underline-offset-2 hover:underline" href={instrumentHref(row.original.symbol)}>
        {row.original.symbol}
      </Link>
    )
  },
  {
    accessorKey: "price",
    header: "Precio",
    cell: ({ row }) => <span className="numeric">{formatNumber(row.original.price, row.original.price > 100 ? 2 : 4)}</span>
  },
  {
    accessorKey: "yield",
    header: "TIR",
    cell: ({ row }) => {
      const value = "yield" in row.original ? row.original.yield : undefined;
      return <span className="numeric">{value === undefined ? "-" : `${formatNumber(value, 2)}%`}</span>;
    }
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const value = "duration" in row.original ? row.original.duration : undefined;
      return <span className="numeric">{formatNumber(value, 2)}</span>;
    }
  },
  {
    accessorKey: "changePercent",
    header: "Variacion",
    cell: ({ row }) => (
      <span className={`numeric font-semibold ${row.original.changePercent >= 0 ? "text-gain" : "text-loss"}`}>
        {formatPercent(row.original.changePercent)}
      </span>
    )
  },
  {
    accessorKey: "volume",
    header: "Vol(M)",
    cell: ({ row }) => <span className="numeric">{row.original.volume === undefined ? "-" : formatNumber(row.original.volume / 1_000_000, 2)}</span>
  },
  {
    accessorKey: "parity",
    header: "Paridad",
    cell: ({ row }) => {
      const value = "parity" in row.original ? row.original.parity : undefined;
      return <span className="numeric">{value === undefined ? "-" : `${formatNumber(value, 2)}%`}</span>;
    }
  }
];

export function MarketTable({
  title,
  rows,
  compact = false,
  variant = "default",
  showSource = true,
  paginate = true
}: {
  title: string;
  rows: Row[];
  compact?: boolean;
  variant?: TableVariant;
  showSource?: boolean;
  paginate?: boolean;
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [assetFilter, setAssetFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([{ id: "changePercent", desc: true }]);

  const assetTypes = useMemo(() => ["all", ...Array.from(new Set(rows.map((row) => row.type)))], [rows]);
  const data = useMemo(
    () => rows.filter((row) => assetFilter === "all" || row.type === assetFilter),
    [assetFilter, rows]
  );

  const table = useReactTable({
    data,
    columns:
      variant === "bonds"
        ? bondColumns
        : variant === "stocks"
          ? showSource
            ? stockColumns
            : stockColumnsWithoutSource
          : showSource
            ? columns
            : columnsWithoutSource,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: paginate ? getPaginationRowModel() : undefined,
    initialState: paginate ? { pagination: { pageSize: compact ? 6 : 9 } } : undefined
  });

  return (
    <section className="rounded border border-line bg-white shadow-table dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-2 border-b border-line px-3 py-2 dark:border-slate-700 md:flex-row md:items-center md:justify-between">
        <h2 className="text-sm font-bold uppercase tracking-normal text-ink dark:text-slate-100">{title}</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45 dark:text-slate-500" aria-hidden="true" />
            <input
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              placeholder="Buscar ticker o nombre"
              className="h-8 w-full rounded border border-line bg-panel pl-8 pr-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 sm:w-56"
            />
          </label>
          <select
            value={assetFilter}
            onChange={(event) => setAssetFilter(event.target.value)}
            className="h-8 rounded border border-line bg-panel px-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {assetTypes.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? "Todos" : type}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="table-scroll overflow-x-auto">
        <table className={`${variant === "bonds" ? "min-w-[760px]" : variant === "stocks" ? "min-w-[840px]" : "min-w-[860px]"} w-full border-collapse text-sm`}>
          <thead className="bg-panel text-[11px] uppercase tracking-normal text-ink/60 dark:bg-slate-950 dark:text-slate-400">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="border-b border-line px-3 py-2 text-left font-semibold dark:border-slate-700">
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      className="flex items-center gap-1 text-left"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="text-ink/35 dark:text-slate-500">
                        {header.column.getIsSorted() === "asc" ? "↑" : header.column.getIsSorted() === "desc" ? "↓" : ""}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0 hover:bg-panel/80 dark:border-slate-700 dark:hover:bg-slate-800/70">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginate ? <div className="flex items-center justify-between border-t border-line px-3 py-2 text-xs text-ink/65 dark:border-slate-700 dark:text-slate-400">
        <span>
          {table.getFilteredRowModel().rows.length} instrumentos · página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded border border-line bg-panel p-1 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded border border-line bg-panel p-1 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div> : null}
    </section>
  );
}
