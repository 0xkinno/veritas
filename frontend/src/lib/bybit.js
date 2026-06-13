// frontend/src/lib/bybit.js — Live Bybit prices via public REST (no auth needed for read)
const BASE = window.location.hostname === "localhost" 
  ? "https://api.bybit.com"
  : "/api";

export async function getTicker(symbol) {
  const r = await fetch(`${BASE}/v5/market/tickers?category=linear&symbol=${symbol}`);
  const d = await r.json();
  const t = d.result.list[0];
  return {
    symbol,
    lastPrice:   parseFloat(t.lastPrice),
    change24h:   parseFloat(t.price24hPcntChange) * 100,
    fundingRate: parseFloat(t.fundingRate),
    openInterest: parseFloat(t.openInterest),
    volume24h:   parseFloat(t.volume24h),
  };
}

export async function getAllTickers() {
  const symbols = ["ETHUSDT","BTCUSDT","MNTUSDT","SOLUSDT","ARBUSDT"];
  const results = await Promise.allSettled(symbols.map(getTicker));
  return results.filter(r => r.status === "fulfilled").map(r => r.value);
}
export function formatPrice(price) {
  if (price > 1000) return "$" + price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (price > 1)    return "$" + price.toFixed(3);
  return "$" + price.toFixed(5);
}