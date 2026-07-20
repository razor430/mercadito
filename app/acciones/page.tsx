import { StocksBrowser } from "@/components/stocks-browser";
import { getStocks } from "@/lib/market-service";

export default async function ActionsPage() {
  const stocks = await getStocks();
  return <StocksBrowser initialStocks={stocks} />;
}
