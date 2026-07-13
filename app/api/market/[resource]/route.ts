import { NextRequest, NextResponse } from "next/server";
import {
  getBonds,
  getCommodities,
  getCurrencies,
  getHistory,
  getFundHoldings,
  getInstrumentDetail,
  getNews,
  getOverview,
  getSearch,
  getStocks
} from "@/lib/market-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ resource: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const { resource } = await params;
  const searchParams = request.nextUrl.searchParams;

  try {
    switch (resource) {
      case "overview":
        return NextResponse.json(await getOverview());
      case "stocks":
        return NextResponse.json(await getStocks());
      case "bonds":
        return NextResponse.json(await getBonds());
      case "currencies":
        return NextResponse.json(await getCurrencies());
      case "commodities":
        return NextResponse.json(await getCommodities());
      case "history":
        return NextResponse.json(
          await getHistory(searchParams.get("symbol") ?? "AL30", searchParams.get("source") ?? undefined, searchParams.get("range") ?? undefined)
        );
      case "instrument":
        return NextResponse.json(await getInstrumentDetail(searchParams.get("symbol") ?? "AL30"));
      case "fund-holdings": {
        const fundId = Number(searchParams.get("fundId"));
        const classId = Number(searchParams.get("classId"));
        if (!Number.isInteger(fundId) || !Number.isInteger(classId)) {
          return NextResponse.json({ error: "fundId and classId must be integers" }, { status: 400 });
        }
        return NextResponse.json(await getFundHoldings(fundId, classId));
      }
      case "news":
        return NextResponse.json(await getNews());
      case "search":
        return NextResponse.json(await getSearch(searchParams.get("q") ?? ""));
      default:
        return NextResponse.json({ error: `Unknown market resource: ${resource}` }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected market API error"
      },
      { status: 500 }
    );
  }
}
