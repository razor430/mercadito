import type { FundHolding, FundSnapshot } from "@/lib/types";
import { fetchJson } from "./http";
import { inflateRawSync } from "node:zlib";

type CafciNamedValue = {
  nombre?: string;
};

type CafciFundClass = {
  id: number;
  nombre: string;
  moneda?: string;
  inversion_minima?: string | number;
  honorarios?: {
    administracion_gerente?: string;
    administracion_depositaria?: string;
    gasto_ordinario_gestion?: string;
  };
  liquidez?: string;
  ticker_bloomberg?: string;
  ticker_isin?: string;
};

type CafciFund = {
  id: number;
  nombre: string;
  codigo_cnv?: string;
  estado?: string | number;
  objetivo?: string;
  inicio?: string;
  dias_liquidacion?: string | number;
  sociedad_gerente?: CafciNamedValue;
  sociedad_depositaria?: CafciNamedValue;
  tipo_renta?: CafciNamedValue;
  region?: CafciNamedValue;
  moneda?: CafciNamedValue;
  horizonte?: CafciNamedValue;
  duration?: CafciNamedValue;
  benchmark?: CafciNamedValue;
  clases?: CafciFundClass[];
};

type CafciCatalog = {
  generated_at?: string;
  fondos?: CafciFund[];
};

type DailyFundRow = {
  name: string;
  category: string;
  currency?: string;
  region?: string;
  horizon?: string;
  date?: string;
  shareValue?: number;
  dayChangePercent?: number;
  monthChangePercent?: number;
  ytdChangePercent?: number;
  twelveMonthChangePercent?: number;
  assets?: number;
  marketShare?: number;
  depositary?: string;
  cnvCode?: string;
};

const cafciCatalogUrl = "https://estadisticas.cafci.org.ar/consulta-de-fondos.json";
const cafciDailyUrl = "https://api.pub.cafci.org.ar/pb_get";
const cafciFundUrl = "https://estadisticas.cafci.org.ar/fondos";

function nameOf(value?: CafciNamedValue) {
  return value?.nombre;
}

function decodeXml(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'");
}

function cellValue(cell: string) {
  const type = /\st="([^"]+)"/.exec(cell)?.[1];
  if (type === "inlineStr") {
    const inline = /<is>([\s\S]*?)<\/is>/.exec(cell)?.[1] ?? "";
    return decodeXml(Array.from(inline.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)).map((match) => match[1]).join(""));
  }
  return decodeXml(/<v>([\s\S]*?)<\/v>/.exec(cell)?.[1] ?? "");
}

function toNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readZipEntry(buffer: Buffer, entryName: string) {
  let eocdOffset = -1;
  for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 66_000); index -= 1) {
    if (buffer.readUInt32LE(index) === 0x06054b50) {
      eocdOffset = index;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error("Invalid XLSX zip: EOCD not found");

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let offset = buffer.readUInt32LE(eocdOffset + 16);

  for (let index = 0; index < totalEntries; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("Invalid XLSX zip: central directory entry not found");
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.toString("utf8", offset + 46, offset + 46 + fileNameLength);

    if (fileName === entryName) {
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
      return compressionMethod === 8 ? inflateRawSync(compressed).toString("utf8") : compressed.toString("utf8");
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  throw new Error(`XLSX entry not found: ${entryName}`);
}

function parseDailyRows(sheetXml: string) {
  const rows: DailyFundRow[] = [];
  let category = "";

  for (const rowMatch of sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = new Map<string, string>();
    for (const cellMatch of rowMatch[1].matchAll(/<c[^>]*r="([A-Z]+)\d+"[^>]*>[\s\S]*?<\/c>/g)) {
      cells.set(cellMatch[1], cellValue(cellMatch[0]));
    }

    const name = cells.get("A")?.trim();
    if (!name) continue;

    if (cells.size === 1) {
      category = name;
      continue;
    }
    if (!cells.get("B") || name === "Fondo") continue;

    rows.push({
      name,
      category,
      currency: cells.get("B"),
      region: cells.get("C"),
      horizon: cells.get("D"),
      date: cells.get("E"),
      shareValue: toNumber(cells.get("F")),
      dayChangePercent: toNumber(cells.get("H")),
      monthChangePercent: toNumber(cells.get("J")),
      ytdChangePercent: toNumber(cells.get("K")),
      twelveMonthChangePercent: toNumber(cells.get("L")),
      assets: toNumber(cells.get("O")),
      marketShare: toNumber(cells.get("Q")),
      depositary: cells.get("R"),
      cnvCode: cells.get("S")
    });
  }

  return rows;
}

function splitFundName(className: string) {
  const match = /^(.*?)\s+-\s+(Clase .+)$/.exec(className);
  return {
    fundName: match?.[1] ?? className,
    className: match?.[2] ?? className
  };
}

function incomeTypeFromCategory(category: string) {
  return category.replace(/\s+(Peso|Dolar Estadounidense|Dolar|Euro)\s+.+$/, "");
}

function normalizedName(value?: string) {
  return value?.trim().toLocaleLowerCase("es-AR").replace(/\s+/g, " ") ?? "";
}

async function getCafciDailyFunds(): Promise<FundSnapshot[]> {
  const response = await fetch(cafciDailyUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "*/*",
      Origin: "https://www.cafci.org.ar",
      Referer: "https://www.cafci.org.ar/"
    },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${cafciDailyUrl}`);

  const sheetXml = readZipEntry(Buffer.from(await response.arrayBuffer()), "xl/worksheets/sheet1.xml");
  const dailyRows = parseDailyRows(sheetXml).filter((row) => row.assets === undefined || row.assets > 0);
  const grouped = new Map<string, FundSnapshot>();
  const updatedAt = new Date().toISOString();

  dailyRows.forEach((row, index) => {
    const { fundName, className } = splitFundName(row.name);
    const key = `${row.cnvCode ?? fundName}-${fundName}`;
    const current = grouped.get(key);
    const fund =
      current ??
      ({
        id: Number(row.cnvCode) || index + 1,
        name: fundName,
        cnvCode: row.cnvCode,
        status: "Activo",
        depositary: row.depositary,
        currency: row.currency,
        incomeType: incomeTypeFromCategory(row.category),
        region: row.region,
        horizon: row.horizon,
        classes: [],
        source: "CAFCI" as const,
        updatedAt
      } satisfies FundSnapshot);

    fund.assets = (fund.assets ?? 0) + (row.assets ?? 0);
    fund.marketShare = (fund.marketShare ?? 0) + (row.marketShare ?? 0);
    fund.shareValue ??= row.shareValue;
    fund.dayChangePercent ??= row.dayChangePercent;
    fund.monthChangePercent ??= row.monthChangePercent;
    fund.ytdChangePercent ??= row.ytdChangePercent;
    fund.twelveMonthChangePercent ??= row.twelveMonthChangePercent;
    fund.classes.push({
      id: fund.classes.length + 1,
      name: className,
      currency: row.currency,
      shareValue: row.shareValue,
      dayChangePercent: row.dayChangePercent,
      monthChangePercent: row.monthChangePercent,
      ytdChangePercent: row.ytdChangePercent,
      twelveMonthChangePercent: row.twelveMonthChangePercent,
      assets: row.assets,
      marketShare: row.marketShare
    });
    grouped.set(key, fund);
  });

  const funds = Array.from(grouped.values()).sort((a, b) => (b.assets ?? 0) - (a.assets ?? 0));
  if (funds.length === 0) throw new Error("CAFCI daily XLSX normalized to an empty fund list");
  return funds;
}

function getCatalogFunds(catalog: CafciCatalog): FundSnapshot[] {
  const updatedAt = catalog.generated_at ?? new Date().toISOString();

  const funds = (catalog.fondos ?? [])
    .filter((fund) => fund.nombre && String(fund.estado ?? "").toLowerCase() !== "inactivo")
    .map((fund) => ({
      id: fund.id,
      name: fund.nombre,
      cnvCode: fund.codigo_cnv,
      status: typeof fund.estado === "number" ? (fund.estado === 1 ? "Activo" : String(fund.estado)) : fund.estado,
      manager: nameOf(fund.sociedad_gerente),
      depositary: nameOf(fund.sociedad_depositaria),
      currency: nameOf(fund.moneda),
      incomeType: nameOf(fund.tipo_renta),
      region: nameOf(fund.region),
      horizon: nameOf(fund.horizonte),
      duration: nameOf(fund.duration),
      benchmark: nameOf(fund.benchmark),
      settlementDays: fund.dias_liquidacion,
      startDate: fund.inicio,
      objective: fund.objetivo,
      classes: (fund.clases ?? []).map((fundClass) => ({
        id: fundClass.id,
        name: fundClass.nombre,
        currency: fundClass.moneda,
        minimumInvestment: fundClass.inversion_minima,
        liquidity: fundClass.liquidez,
        managementFee: fundClass.honorarios?.administracion_gerente,
        depositoryFee: fundClass.honorarios?.administracion_depositaria,
        expenseFee: fundClass.honorarios?.gasto_ordinario_gestion,
        bloombergTicker: fundClass.ticker_bloomberg?.trim() || undefined,
        isinTicker: fundClass.ticker_isin
      })),
      source: "CAFCI" as const,
      updatedAt
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return funds;
}

function mergeCatalogWithDaily(catalogFunds: FundSnapshot[], dailyFunds: FundSnapshot[]) {
  const catalogByCnvCode = new Map(catalogFunds.filter((fund) => fund.cnvCode).map((fund) => [fund.cnvCode!, fund]));
  const catalogByName = new Map(catalogFunds.map((fund) => [normalizedName(fund.name), fund]));

  return dailyFunds.map((dailyFund) => {
    const catalogFund = (dailyFund.cnvCode && catalogByCnvCode.get(dailyFund.cnvCode)) ?? catalogByName.get(normalizedName(dailyFund.name));
    if (!catalogFund) return dailyFund;

    return {
      ...catalogFund,
      ...dailyFund,
      id: catalogFund.id,
      classes: dailyFund.classes.map((dailyClass) => {
        const catalogClass = catalogFund.classes.find(
          (candidate) =>
            normalizedName(candidate.name) === normalizedName(dailyClass.name) ||
            normalizedName(candidate.name) === normalizedName(`${dailyFund.name} - ${dailyClass.name}`)
        );
        return catalogClass ? { ...catalogClass, ...dailyClass, id: catalogClass.id } : dailyClass;
      })
    } satisfies FundSnapshot;
  });
}

export async function getCafciFunds(): Promise<FundSnapshot[]> {
  const [catalogResult, dailyResult] = await Promise.allSettled([
    fetchJson<CafciCatalog>(cafciCatalogUrl),
    getCafciDailyFunds()
  ]);
  const catalogFunds =
    catalogResult.status === "fulfilled" && Array.isArray(catalogResult.value.fondos)
      ? getCatalogFunds(catalogResult.value)
      : [];
  const dailyFunds = dailyResult.status === "fulfilled" ? dailyResult.value : [];

  if (catalogFunds.length && dailyFunds.length) return mergeCatalogWithDaily(catalogFunds, dailyFunds);
  if (catalogFunds.length) return catalogFunds;
  if (dailyFunds.length) return dailyFunds;

  throw new Error("CAFCI catalog and daily snapshot are unavailable");
}

export async function getCafciFundHoldings(fundId: number, classId: number): Promise<FundHolding[]> {
  const response = await fetch(`${cafciFundUrl}/${fundId}?clase=${classId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml"
    },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for fund holdings`);

  const html = await response.text();
  const rawHoldings = /data-pie-chart-items-value="([^"]+)"/.exec(html)?.[1];
  if (!rawHoldings) return [];

  const parsed = JSON.parse(decodeXml(rawHoldings)) as Array<{ nombre?: string; porcentaje?: number | string }>;
  return parsed
    .map((holding) => ({ name: holding.nombre?.trim() ?? "", percentage: Number(holding.porcentaje) }))
    .filter((holding) => holding.name && Number.isFinite(holding.percentage) && holding.percentage >= 0)
    .sort((a, b) => b.percentage - a.percentage);
}
