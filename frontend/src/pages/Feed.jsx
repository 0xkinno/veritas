import { modal } from "../lib/reown.js";
import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import { ToastContext, WalletContext } from "../App.jsx";
import { getAllTickers, formatPrice } from "../lib/bybit.js";
import { fetchPredictions, AGENT_NAMES, EXPLORER } from "../lib/contracts.js";

export default function Feed() {
  const showToast              = useContext(ToastContext);
  const { wallet, provider }   = useContext(WalletContext);
  const [preds,    setPreds]   = useState([]);
  const [tickers,  setTickers] = useState([]);
  const [running,  setRunning] = useState(false);
  const [market,   setMarket]  = useState("ETHUSDT");
  const [agentName,setAgent]   = useState("VERITAS-01");
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions(20).then(p => { setPreds(p); setLoading(false); }).catch(() => setLoading(false));
    getAllTickers().then(setTickers).catch(() => {});
    const id = setInterval(() => {
      fetchPredictions(20).then(setPreds).catch(() => {});
      getAllTickers().then(setTickers).catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, []);

  async function runPrediction() {
    if (!wallet) {
      showToast("error", "Wallet Required", "Connect your wallet to authorize agent execution.");
      return;
    }

    setRunning(true);
    try {
      // Step 1 — Request wallet signature
      showToast("info", "Step 1 — Authorize", "Sign the message in your wallet to authorize this agent run.");
      let signature;
      try {
        const walletProvider = await modal.getWalletProvider();
const ethersProvider = new ethers.BrowserProvider(walletProvider);
const signer = await ethersProvider.getSigner();
        const message = `VERITAS Agent Authorization\n\nAgent: ${agentName}\nMarket: ${market}\nTimestamp: ${Date.now()}\n\nBy signing, you authorize this agent to commit a reasoning hash to Mantle via ERC-8004.`;
        signature = await signer.signMessage(message);
        showToast("success", "Authorized", "Wallet verified · Starting prediction pipeline...");
      } catch (sigErr) {
        showToast("error", "Signature Rejected", "You rejected the signing request.");
        setRunning(false);
        return;
      }

      // Step 2 — Signal
      await sleep(500);
      showToast("info", "Step 2 — Signal Scan", "Pulling live Bybit data for " + market + "...");
      await sleep(800);

      // Step 3 — Reasoning
      showToast("info", "Step 3 — AI Reasoning", "3-model Groq consensus running...");
      await sleep(1200);

      // Step 4 — Commit
      showToast("info", "Step 4 — Committing to Mantle", "Writing reasoning hash to ERC-8004 registry...");

      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName,
          symbol: market,
          signature,
          authorizedBy: wallet,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      showToast(
        "success",
        "Prediction Committed",
        `${data.direction} ${market} · Block #${data.blockNumber} · Hash ${data.txHash?.slice(0, 12)}...`
      );
      setTimeout(() => fetchPredictions(20).then(setPreds).catch(() => {}), 8000);
setTimeout(() => fetchPredictions(20).then(setPreds).catch(() => {}), 15000);

    } catch (e) {
      if (e.code === 4001 || e.message?.includes("rejected")) {
        showToast("error", "Rejected", "Transaction rejected by wallet.");
      } else {
        showToast("error", "Agent Error", e.message);
      }
    } finally {
      setRunning(false);
    }
  }

  const SIGNALS = tickers.map(t => ({
    dot:  t.change24h >= 0 ? "g" : "r",
    text: `${t.symbol.replace("USDT", "/USDT")} ${t.change24h >= 0 ? "+" : ""}${t.change24h.toFixed(2)}% · ${formatPrice(t.lastPrice)}`,
    time: "live",
  }));

  return (
    <div className="page" style={{ paddingBottom: 64 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

        {/* MAIN */}
        <div>
          <div className="section-label">Screen 02 — Live Intelligence Feed</div>
          <div className="section-title">REAL-TIME<br />PREDICTION STREAM</div>
          <p className="section-desc">
            Signal detected → AI reasoning → hash committed on Mantle → outcome recorded.
            Every step cryptographically proven.
          </p>

          {/* Trigger Panel */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 800,
                letterSpacing: "0.12em", color: "var(--g)",
              }}>
                ▶ RUN NEW PREDICTION
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select className="v-select" value={market} onChange={e => setMarket(e.target.value)}>
                  {["ETHUSDT","BTCUSDT","MNTUSDT","SOLUSDT","ARBUSDT"].map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="v-select" value={agentName} onChange={e => setAgent(e.target.value)}>
                  {["VERITAS-01","VERITAS-02","VERITAS-03"].map(a => <option key={a}>{a}</option>)}
                </select>
                <button className="btn btn-primary" onClick={runPrediction} disabled={running}>
                  {running ? <span className="spinner" /> : null}
                  {running ? "Running..." : wallet ? "▶ Run Agent" : "🔒 Connect to Run"}
                </button>
              </div>
            </div>

            {/* Pipeline description — bold and clear */}
            <div style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: "6px 0",
              alignItems: "center",
            }}>
              {[
                { label:"Live Bybit Signals" },
                { label:"3-Model Groq Consensus" },
                { label:"Reasoning Hash to Mantle" },
                { label:"ERC-8004 Reputation Updated" },
              ].map((step, i, arr) => (
                <React.Fragment key={step.num}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 800,
                      color: "var(--g)", letterSpacing: "0.1em",
                    }}>{step.num}</span>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                      color: "var(--t)", letterSpacing: "0.05em",
                    }}>{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 14,
                      fontWeight: 900, color: "var(--g)", padding: "0 8px",
                    }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Wallet status line */}
            <div style={{
              marginTop: 10,
              fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600,
              color: wallet ? "var(--g)" : "var(--t3)",
              letterSpacing: "0.06em",
            }}>
              {wallet
                ? `● Authorized: ${wallet.slice(0, 8)}...${wallet.slice(-4)} · Each run requires your wallet signature`
                : "○ Connect wallet to authorize agent execution"
              }
            </div>
          </div>

          {/* Predictions stream */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflowY: "auto" }}>
            {loading && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--t3)", padding: "20px 0" }}>
                Loading onchain predictions...
              </div>
            )}
            {!loading && preds.length === 0 && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--t3)", padding: "20px 0" }}>
                No predictions yet. Run your first agent above.
              </div>
            )}
            {preds.map(p => <PredCard key={p.id} p={p} />)}
          </div>
        </div>

        {/* SIDE */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-title">Live Market Data</div>
            {tickers.map(t => (
              <div key={t.symbol} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.03)",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: "var(--t)" }}>
                  {t.symbol.replace("USDT", "/USDT")}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--t2)" }}>
                  {formatPrice(t.lastPrice)}
                </span>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
                  color: t.change24h >= 0 ? "var(--g)" : "var(--red)",
                }}>
                  {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-title">Signal Feed</div>
            {SIGNALS.map((s, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "flex-start",
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: s.dot === "g" ? "var(--g)" : "var(--red)",
                  flexShrink: 0, marginTop: 4,
                }} />
                <div>
                  <div style={{ fontSize: 12, color: "var(--t2)" }}>{s.text}</div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--t3)" }}>{s.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PredCard({ p }) {
  const STATUS_COLOR = { Verified: "var(--g)", Pending: "var(--gold)", Disproven: "var(--red)" };
  const nodes = ["SIGNAL","REASON","COMMIT","EXECUTE","PROVE"];
  const doneN = p.status === "Verified" ? 5 : p.status === "Pending" ? 3 : 5;
  return (
    <div className="card" style={{ borderLeft: `3px solid ${STATUS_COLOR[p.status] || "var(--border)"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--t3)", marginBottom: 4 }}>
            {AGENT_NAMES[p.agentId] || `AGENT-${p.agentId}`} · #{p.id}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--t)", marginBottom: 4 }}>{p.market}</div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px",
            fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
            background: p.isLong ? "rgba(124,255,107,0.08)" : "rgba(255,68,102,0.08)",
            color: p.isLong ? "var(--g)" : "var(--red)",
            border: `1px solid ${p.isLong ? "rgba(124,255,107,0.2)" : "rgba(255,68,102,0.2)"}`,
          }}>
            {p.isLong ? "▲ LONG" : "▼ SHORT"}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700,
            color: p.pnl > 0 ? "var(--g)" : p.pnl < 0 ? "var(--red)" : "var(--gold)",
          }}>
            {p.status === "Pending" ? "PENDING" : p.pnl > 0 ? `+$${p.pnl.toFixed(0)}` : `-$${Math.abs(p.pnl).toFixed(0)}`}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--t3)" }}>
            {new Date(p.committedAt).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Pipeline nodes */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 2 }}>
        {nodes.map((n, i) => (
          <React.Fragment key={n}>
            {i > 0 && <span style={{ fontSize: 10, color: "var(--t3)", padding: "0 2px" }}>→</span>}
            <div style={{
              padding: "3px 8px", fontFamily: "var(--font-mono)", fontSize: 9,
              letterSpacing: "0.06em", textTransform: "uppercase",
              backgroundColor: i < doneN ? "rgba(124,255,107,0.04)" : "var(--s3)",
              border: `1px solid ${i < doneN ? "rgba(124,255,107,0.2)" : "var(--border)"}`,
              color: i < doneN ? "var(--g)" : "var(--t3)",
            }}>{n}</div>
          </React.Fragment>
        ))}
      </div>

      {/* Hash */}
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--t3)",
        display: "flex", gap: 8, alignItems: "center",
      }}>
        <span>Reasoning Hash:</span>
        <span style={{ color: "var(--blue)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}
          onClick={() => window.open(`${EXPLORER}/tx/${p.reasoningHash}`, "_blank")}>
          {p.reasoningHash.slice(0, 14)}...
        </span>
      </div>

      {/* Confidence bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--t3)" }}>Confidence:</span>
        <div style={{ flex: 1, height: 3, background: "var(--s3)" }}>
          <div style={{ height: 3, background: "var(--g)", width: `${p.confidence}%`, transition: "width 0.8s ease" }} />
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--g)", minWidth: 32 }}>
          {p.confidence}%
        </span>
      </div>
    </div>
  );
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }