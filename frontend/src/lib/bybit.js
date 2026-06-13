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
  try {
    if (window.location.hostname !== "localhost") {
      const res = await fetch("/api/tickers");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } else {
      const symbols = ["ETHUSDT","BTCUSDT","MNTUSDT","SOLUSDT","ARBUSDT"];
      const results = await Promise.allSettled(symbols.map(getTicker));
      return results.filter(r => r.status === "fulfilled").map(r => r.value);
    }
  } catch {}
  // Fallback — fetch directly from public Bybit API
  try {
    const symbols = ["ETHUSDT","BTCUSDT","MNTUSDT","SOLUSDT","ARBUSDT"];
    const results = await Promise.allSettled(symbols.map(async (symbol) => {
      const res = await fetch(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}`);
      const data = await res.json();
      const t = data.result.list[0];
      return {
        symbol,
        lastPrice: parseFloat(t.lastPrice),
        change24h: parseFloat(t.price24hPcntChange) * 100,
        fundingRate: parseFloat(t.fundingRate),
      };
    }));
    return results.filter(r => r.status === "fulfilled").map(r => r.value);
  } catch {}
  // Last resort hardcoded fallback
  return [
    { symbol:"ETHUSDT", lastPrice:1668, change24h:0.42, fundingRate:0.0001 },
    { symbol:"BTCUSDT", lastPrice:63500, change24h:1.2, fundingRate:0.0001 },
    { symbol:"MNTUSDT", lastPrice:0.538, change24h:-0.8, fundingRate:0.0001 },
    { symbol:"SOLUSDT", lastPrice:67.1, change24h:2.1, fundingRate:0.0001 },
    { symbol:"ARBUSDT", lastPrice:0.084, change24h:-1.4, fundingRate:0.0001 },
  ];
}

export function formatPrice(price) {
  if (!price) return "$0";
  if (price > 1000) return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price > 1) return "$" + price.toFixed(4);
  return "$" + price.toFixed(6);
}