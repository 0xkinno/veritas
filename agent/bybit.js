// agent/bybit.js — Real Bybit API price feeds (no mock)
import { RestClientV5 } from "bybit-api";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const client = new RestClientV5({
  key:     process.env.BYBIT_API_KEY,
  secret:  process.env.BYBIT_API_SECRET,
  testnet: process.env.BYBIT_TESTNET === "true",
});

export async function getTickerData(symbol) {
  const res = await client.getTickers({ category: "linear", symbol });
  const t   = res.result.list[0];
  return {
    symbol,
    lastPrice:    parseFloat(t.lastPrice),
    price24hPct:  parseFloat(t.price24hPcntChange) * 100,
    fundingRate:  parseFloat(t.fundingRate),
    openInterest: parseFloat(t.openInterest),
    volume24h:    parseFloat(t.volume24h),
  };
}

export async function getOrderbook(symbol) {
  const res = await client.getOrderbook({ category: "linear", symbol, limit: 25 });
  return {
    bids: res.result.b.map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) })),
    asks: res.result.a.map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) })),
  };
}

export async function getKlines(symbol, interval = "60", limit = 48) {
  const res = await client.getKline({ category: "linear", symbol, interval, limit });
  return res.result.list.map(([time, open, high, low, close, vol]) => ({
    time: parseInt(time), open: parseFloat(open), high: parseFloat(high),
    low:  parseFloat(low), close: parseFloat(close), volume: parseFloat(vol),
  }));
}

export async function getMultiTickers() {
  const symbols = ["ETHUSDT","BTCUSDT","MNTUSDT","SOLUSDT","ARBUSDT"];
  return Promise.all(symbols.map(getTickerData));
}