import React, { useEffect, useState } from "react";
import { getAllTickers, formatPrice }  from "../lib/bybit.js";

export default function Ticker() {
  const [tickers, setTickers] = useState([]);

  useEffect(() => {
    getAllTickers().then(setTickers).catch(() => {});
    const id = setInterval(() => getAllTickers().then(setTickers).catch(()=>{}), 15000);
    return () => clearInterval(id);
  }, []);

  const static_rep = [
    { label:"VERITAS-01 REP", val:"—",  up:true  },
    { label:"VERITAS-02 REP", val:"—",  up:true  },
    { label:"VERITAS-03 REP", val:"—",  up:false },
    { label:"ERC-8004",       val:"ACTIVE", up:true },
  ];

  const items = [
    ...tickers.map(t => ({
      label: t.symbol.replace("USDT","/USDT"),
      val:   formatPrice(t.lastPrice),
      chg:   (t.change24h >= 0 ? "+" : "") + t.change24h.toFixed(2) + "%",
      up:    t.change24h >= 0,
    })),
    ...static_rep.map(r => ({ label: r.label, val: r.val, chg: "", up: r.up })),
  ];

  if (items.length === 0) return null;

  const content = [...items, ...items].map((item, i) => (
    <div key={i} style={{
      display:"inline-flex", alignItems:"center", gap:8,
      padding:"0 24px", borderRight:"1px solid rgba(124,255,107,0.06)",
      fontFamily:"var(--font-mono)", fontSize:10,
    }}>
      <span style={{color:"var(--t3)",letterSpacing:"0.06em"}}>{item.label}</span>
      <span style={{color:"var(--t)",fontWeight:500}}>{item.val}</span>
      {item.chg && <span style={{color:item.up?"var(--g)":"var(--red)"}}>{item.chg}</span>}
    </div>
  ));

  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, height:32,
      background:"rgba(4,10,6,0.92)", borderTop:"1px solid var(--border)",
      overflow:"hidden", zIndex:8000, display:"flex", alignItems:"center",
    }}>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-inner {
          display: flex;
          animation: ticker-scroll 40s linear infinite;
          white-space: nowrap;
          width: max-content;
        }
      `}</style>
      <div className="ticker-inner">{content}</div>
    </div>
  );
}