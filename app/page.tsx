import { Dashboard } from "@/components/dashboard";
import { getBonds, getCommodities, getCurrencies, getNews, getOverview, getStocks } from "@/lib/market-service";

export default async function Home() {
  const [overview, stocks, bonds, currencies, commodities, news] = await Promise.all([
    getOverview(),
    getStocks(),
    getBonds(),
    getCurrencies(),
    getCommodities(),
    getNews()
  ]);

  return (
    <Dashboard
      initialOverview={overview}
      initialStocks={stocks}
      initialBonds={bonds}
      initialCurrencies={currencies}
      initialCommodities={commodities}
      initialNews={news}
    />
  );
}
