import { Dashboard } from "@/components/dashboard";
import { getArgentinaIndicators, getBonds, getCommodities, getNews, getOverview, getStocks } from "@/lib/market-service";

export default async function Home() {
  const [overview, stocks, bonds, argentinaIndicators, commodities, news] = await Promise.all([
    getOverview(),
    getStocks(),
    getBonds(),
    getArgentinaIndicators(),
    getCommodities(),
    getNews()
  ]);

  return (
    <Dashboard
      initialOverview={overview}
      initialStocks={stocks}
      initialBonds={bonds}
      initialArgentinaIndicators={argentinaIndicators}
      initialCommodities={commodities}
      initialNews={news}
    />
  );
}
