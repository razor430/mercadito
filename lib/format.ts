export function formatNumber(value?: number, maximumFractionDigits = 2) {
  if (value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits }).format(value);
}

export function compactNumber(value?: number) {
  if (value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("es-AR", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercent(value?: number) {
  if (value === undefined || Number.isNaN(value)) return "-";
  return `${value >= 0 ? "+" : ""}${formatNumber(value, 2)}%`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
