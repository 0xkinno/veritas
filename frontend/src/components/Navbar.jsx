import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { WalletContext, ToastContext } from "../App.jsx";
import { modal } from "../lib/reown.js";
import { useBlockNumber } from "../hooks/useVeritas.js";

const NAV = [
  { to: "/universe",   label: "Agent Universe" },
  { to: "/feed",       label: "Intelligence Feed" },
  { to: "/dna",        label: "Agent DNA" },
  { to: "/ledger",     label: "Validation Ledger" },
  { to: "/reputation", label: "Reputation Economy" },
  { to: "/docs", label: "Docs", external: "https://github.com/0xkinno/veritas" },
];

export default function Navbar() {
  const { wallet, setWallet } = useContext(WalletContext);
  const showToast             = useContext(ToastContext);
  const navigate              = useNavigate();
  const block                 = useBlockNumber();

  function handleWallet() {
    modal.open();
  }

  function handleDisconnect() {
    // Disconnect via Reown if available, fallback to clearing state
    try {
      if (modal?.disconnect) modal.disconnect();
    } catch (_) {}
    setWallet(null);
    showToast("info", "Wallet Disconnected", "Your wallet has been disconnected.");
  }

  function truncate(addr) {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  }

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
      height: 60, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 32px",
      background: "rgba(6,13,8,0.92)", backdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--border)",
    }}>

      {/* LOGO */}
      <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", flexShrink:0 }}
        onClick={() => navigate("/")}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="4" width="20" height="20" stroke="#7CFF6B" strokeWidth="1.5" transform="rotate(45 14 14)" />
          <rect x="9" y="9" width="10" height="10" fill="#7CFF6B" transform="rotate(45 14 14)" />
        </svg>
        <div>
          <div style={{ fontFamily:"var(--font-display)", fontSize:20, letterSpacing:"0.1em", lineHeight:1, color:"var(--t)" }}>
            VERITAS
          </div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:7, letterSpacing:"0.2em", color:"var(--t3)", textTransform:"uppercase" }}>
            Accountable AI Trading
          </div>
        </div>
      </div>

      {/* NAV LINKS */}
      <div style={{ display:"flex", gap:2, alignItems:"center" }}>
        {NAV.map(n => (
          <NavLink key={n.to} to={n.to} onClick={n.external ? (e) => { e.preventDefault(); window.open(n.external, "_blank"); } : undefined}
            style={({ isActive }) => ({
              fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.12em",
              textTransform:"uppercase", textDecoration:"none", padding:"6px 12px",
              color: isActive ? "var(--g)" : "var(--t3)",
              borderBottom: isActive ? "1px solid var(--g)" : "1px solid transparent",
              transition:"color 0.2s",
            })}
            onMouseEnter={e => { if (!e.currentTarget.style.color.includes("107")) e.currentTarget.style.color = "var(--t2)"; }}
            onMouseLeave={e => { if (!e.currentTarget.style.color.includes("107")) e.currentTarget.style.color = "var(--t3)"; }}
          >{n.label}</NavLink>
        ))}
      </div>

      {/* RIGHT — block + wallet */}
      <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>

        {/* Live block */}
        {block && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px", border:"1px solid var(--border)" }}>
            <span className="live-dot" style={{ width:5, height:5 }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--t3)", letterSpacing:"0.1em" }}>
              Block #{Number(block).toLocaleString()}
            </span>
          </div>
        )}

        {wallet ? (
          /* Connected state: address pill + disconnect button */
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            {/* Address — click to open Reown modal */}
            <button
              onClick={handleWallet}
              style={{
                fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700,
                letterSpacing:"0.12em", textTransform:"uppercase",
                padding:"8px 14px", cursor:"pointer",
                background:"rgba(124,255,107,0.10)",
                color:"var(--g)",
                border:"1px solid var(--g5)",
                transition:"all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(124,255,107,0.16)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(124,255,107,0.10)"}
            >
              {truncate(wallet)}
            </button>

            {/* Disconnect — power icon */}
            <button
              title="Disconnect wallet"
              onClick={handleDisconnect}
              style={{
                width:36, height:36,
                background:"rgba(255,68,102,0.07)",
                border:"1px solid rgba(255,68,102,0.18)",
                color:"var(--red)", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0, transition:"all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255,68,102,0.18)";
                e.currentTarget.style.borderColor = "var(--red)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,68,102,0.07)";
                e.currentTarget.style.borderColor = "rgba(255,68,102,0.18)";
              }}
            >
              {/* Power SVG */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
                <line x1="12" y1="2" x2="12" y2="12"/>
              </svg>
            </button>
          </div>
        ) : (
          /* Disconnected state: single connect button */
          <button
            onClick={handleWallet}
            style={{
              fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700,
              letterSpacing:"0.12em", textTransform:"uppercase",
              padding:"8px 18px", cursor:"pointer",
              background:"var(--g)", color:"#040A06",
              border:"none", transition:"all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--g2)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--g)"}
          >
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}