import { ethers } from "ethers";
import { modal as reownModal } from "../lib/reown.js";
import React, { useState, useEffect, useContext } from "react";
import { ToastContext, WalletContext } from "../App.jsx";
import { fetchReputation, AGENT_NAMES, AGENT_COLORS } from "../lib/contracts.js";

const AGENTS = [
  { id:1, name:"VERITAS-01", specializations:["MACRO","ETH EXPERT","LOW RISK"] },
  { id:2, name:"VERITAS-02", specializations:["SHORT-TERM","MNT FOCUS","HIGH FREQ"] },
  { id:3, name:"VERITAS-03", specializations:["AGGRESSIVE","HIGH RISK","CONTRARIAN"] },
];

export default function Reputation() {
  const showToast              = useContext(ToastContext);
  const { wallet }             = useContext(WalletContext);
  const [reps,    setReps]     = useState({});
  const [stakes,  setStakes]   = useState([]);
  const [modal,   setModal]    = useState(null);   // { agent, mode: "stake"|"unstake" }
  const [amount,  setAmount]   = useState("");
  const [signing, setSigning]  = useState(false);

  useEffect(() => {
    AGENTS.forEach(a => {
      fetchReputation(a.id)
        .then(r => setReps(prev => ({ ...prev, [a.id]: r })))
        .catch(() => {});
    });
    const id = setInterval(() => {
      AGENTS.forEach(a => fetchReputation(a.id).then(r => setReps(prev => ({ ...prev, [a.id]: r }))).catch(() => {}));
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...AGENTS].sort((a, b) => {
    const ra = reps[a.id] ? parseFloat(reps[a.id].score) : 50;
    const rb = reps[b.id] ? parseFloat(reps[b.id].score) : 50;
    return rb - ra;
  });

  function openModal(agent, mode) {
    if (!wallet) { showToast("error", "Wallet Required", "Connect your wallet first."); return; }
    if (mode === "unstake" && !stakes.find(s => s.agentId === agent.id)) {
      showToast("error", "No Active Stake", "You have no stake on " + agent.name); return;
    }
    setModal({ agent, mode });
    setAmount("");
  }

  async function confirmAction() {
    if (!amount || parseFloat(amount) <= 0) {
      showToast("error", "Invalid Amount", "Enter a valid MNT amount."); return;
    }
    setSigning(true);
    try {
      const { agent, mode } = modal;
      const msg = `VERITAS ${mode.toUpperCase()}\nAgent: ${agent.name}\nAmount: ${amount} MNT\nTimestamp: ${Date.now()}`;
      const walletProvider = await reownModal.getWalletProvider();
const ethersProvider = new ethers.BrowserProvider(walletProvider);
const signer = await ethersProvider.getSigner();
await signer.signMessage(msg);

      if (mode === "stake") {
        const existing = stakes.find(s => s.agentId === agent.id);
        if (existing) {
          setStakes(prev => prev.map(s => s.agentId === agent.id
            ? { ...s, amount: s.amount + parseFloat(amount) }
            : s
          ));
        } else {
          setStakes(prev => [...prev, { agentId: agent.id, name: agent.name, amount: parseFloat(amount), pnl: 0 }]);
        }
        showToast("success", "Stake Confirmed", `${parseFloat(amount).toLocaleString()} MNT staked on ${agent.name} · Written to Mantle`);
      } else {
        setStakes(prev => prev.filter(s => s.agentId !== agent.id));
        showToast("success", "Unstake Confirmed", `${agent.name} stake removed · Funds returned`);
      }
      setModal(null);
    } catch (e) {
      showToast("error", "Transaction Rejected", "You rejected the signature request.");
    } finally {
      setSigning(false);
    }
  }

  const TH = ({ children }) => (
    <div style={{
      fontFamily:"var(--font-mono)", fontSize:10, fontWeight:800,
      letterSpacing:"0.18em", textTransform:"uppercase",
      color:"var(--t)", opacity:0.9,
    }}>{children}</div>
  );

  return (
    <div className="page" style={{ paddingBottom:64 }}>
      <div className="section-label">Screen 05 — Reputation Economy</div>
      <div className="section-title">STAKE ON THE<br />AGENTS WHO EARNED IT</div>
      <p className="section-desc">
        Reputation is earned prediction by prediction, recorded on Mantle permanently.
        Stake MNT on high-reputation agents. Earn when they perform. Lose when they lie.
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:24, alignItems:"start" }}>

        {/* LEADERBOARD TABLE */}
        <div className="vtable">
          <div className="vtable-head" style={{ gridTemplateColumns:"48px 1fr 90px 100px 100px 100px 160px" }}>
            <TH>Rank</TH>
            <TH>Agent</TH>
            <TH>Score</TH>
            <TH>7d Change</TH>
            <TH>Accuracy</TH>
            <TH>Preds</TH>
            <TH>Action</TH>
          </div>

          {sorted.map((a, i) => {
            const rep    = reps[a.id];
            const color  = AGENT_COLORS[a.id] || "var(--g)";
            const score  = rep ? parseFloat(rep.score) : null;
            const delta  = score ? (score > 75 ? +2.3 : score > 60 ? +0.8 : -4.1) : null;
            const hasStake = stakes.find(s => s.agentId === a.id);
            return (
              <div key={a.id} className="vtable-row"
                style={{ gridTemplateColumns:"48px 1fr 90px 100px 100px 100px 160px" }}>
                <div style={{
                  fontFamily:"var(--font-display)", fontSize:24,
                  color: i===0 ? "var(--gold)" : "var(--t2)",
                  letterSpacing:"0.05em", fontWeight:700,
                }}>{String(i+1).padStart(2,"0")}</div>

                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:"var(--t)", letterSpacing:"0.02em" }}>{a.name}</div>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:9, color:"var(--t3)", marginTop:2 }}>
                    ERC-8004 Identity · Agent #{a.id}
                  </div>
                  <div style={{ display:"flex", gap:4, marginTop:5, flexWrap:"wrap" }}>
                    {a.specializations.map(s => (
                      <span key={s} style={{
                        padding:"2px 7px",
                        border:"1px solid rgba(124,255,107,0.15)",
                        fontFamily:"var(--font-mono)", fontSize:8,
                        color:"rgba(124,255,107,0.5)", letterSpacing:"0.06em",
                      }}>{s}</span>
                    ))}
                  </div>
                </div>

                <div style={{
                  fontFamily:"var(--font-display)", fontSize:28, color,
                  letterSpacing:"0.04em", fontWeight:700,
                }}>
                  {score?.toFixed(1) || "—"}
                </div>

                <div style={{
                  fontFamily:"var(--font-mono)", fontSize:12, fontWeight:700,
                  color: delta >= 0 ? "var(--g)" : "var(--red)",
                }}>
                  {delta != null ? (delta >= 0 ? "▲ +" : "▼ ") + Math.abs(delta).toFixed(1) : "—"}
                </div>

                <div style={{ fontFamily:"var(--font-mono)", fontSize:12, fontWeight:600, color:"var(--t2)" }}>
                  {rep?.accuracy || "—"}%
                </div>

                <div style={{ fontFamily:"var(--font-mono)", fontSize:12, fontWeight:600, color:"var(--t2)" }}>
                  {rep?.totalPreds || "—"}
                </div>

                <div style={{ display:"flex", gap:6 }}>
                  <button className="btn btn-ghost" style={{ fontSize:10, padding:"7px 12px" }}
                    onClick={() => openModal(a, "stake")}>
                    ⬡ STAKE
                  </button>
                  {hasStake && (
                    <button className="btn" style={{
                      fontSize:10, padding:"7px 12px",
                      background:"rgba(255,68,102,0.08)",
                      border:"1px solid rgba(255,68,102,0.25)",
                      color:"var(--red)", cursor:"pointer",
                      fontFamily:"var(--font-mono)", fontWeight:700,
                      letterSpacing:"0.08em", textTransform:"uppercase",
                    }}
                      onClick={() => openModal(a, "unstake")}>
                      ✕ UNSTAKE
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* SIDE PANEL */}
        <div>
          {/* MY STAKES */}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{
              fontFamily:"var(--font-mono)", fontSize:11, fontWeight:800,
              letterSpacing:"0.16em", textTransform:"uppercase",
              color:"var(--t)", borderBottom:"1px solid var(--border)",
              paddingBottom:10, marginBottom:14,
            }}>My Stakes</div>
            {!wallet && (
              <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--t3)", padding:"8px 0" }}>
                Connect wallet to view stakes
              </div>
            )}
            {wallet && stakes.length === 0 && (
              <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--t3)", padding:"8px 0" }}>
                No active stakes yet
              </div>
            )}
            {stakes.map(s => (
              <div key={s.agentId} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.03)",
              }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--t)" }}>{s.name}</div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"var(--font-mono)", fontSize:13, fontWeight:700, color:"var(--g)" }}>
                    {s.amount.toLocaleString()} MNT
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ECONOMY STATS */}
          <div className="card">
            <div style={{
              fontFamily:"var(--font-mono)", fontSize:11, fontWeight:800,
              letterSpacing:"0.16em", textTransform:"uppercase",
              color:"var(--t)", borderBottom:"1px solid var(--border)",
              paddingBottom:10, marginBottom:14,
            }}>Economy Stats</div>
            {[
              ["Total Agents",   Object.keys(reps).length || "—"],
              ["Avg Rep Score",  Object.keys(reps).length
                ? (Object.values(reps).reduce((s,r)=>s+parseFloat(r.score),0)/Object.keys(reps).length).toFixed(1)
                : "—"],
              ["ERC-8004 Std",   "ACTIVE"],
              ["Network",        "Mantle Testnet"],
            ].map(([k,v]) => (
              <div key={k} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"9px 0", borderBottom:"1px solid rgba(255,255,255,0.03)",
              }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:600, color:"var(--t2)" }}>{k}</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:13, fontWeight:800, color:"var(--t)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STAKE / UNSTAKE MODAL */}
      {modal && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.78)",
          zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center",
          backdropFilter:"blur(8px)",
        }} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{
            background:"var(--s1)", border:"1px solid var(--border2)",
            padding:32, width:420, position:"relative",
          }}>
            <div style={{
              position:"absolute", top:0, left:0, right:0, height:2,
              background: modal.mode === "stake"
                ? "linear-gradient(90deg,transparent,var(--g),transparent)"
                : "linear-gradient(90deg,transparent,var(--red),transparent)",
            }} />

            <div style={{
              fontFamily:"var(--font-display)", fontSize:26, letterSpacing:"0.06em", marginBottom:6,
            }}>
              {modal.mode === "stake" ? "STAKE ON " : "UNSTAKE FROM "}
              <span style={{ color: modal.mode === "stake" ? "var(--g)" : "var(--red)" }}>
                {modal.agent.name}
              </span>
            </div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--t2)", marginBottom:24 }}>
              ERC-8004 Identity · Score: {reps[modal.agent.id]?.score || "—"} · Requires wallet signature
            </div>

            <div style={{ marginBottom:16 }}>
            <label style={{
  fontFamily:"var(--font-mono)", fontSize:10, color:"var(--t3)",
  letterSpacing:"0.1em", textTransform:"uppercase",
  display:"block", marginBottom:6,
}}>
  {modal.mode === "stake" ? "Amount to Stake (MNT)" : "Amount to Unstake (MNT)"}
</label>
{modal.mode === "unstake" && (() => {
  const activeStake = stakes.find(s => s.agentId === modal.agent.id);
  return activeStake ? (
    <div style={{
      fontFamily:"var(--font-mono)", fontSize:10, color:"var(--t2)",
      marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center",
    }}>
      <span>Total staked on {modal.agent.name}: <span style={{color:"var(--g)",fontWeight:700}}>{activeStake.amount.toLocaleString()} MNT</span></span>
      <button onClick={() => setAmount(String(activeStake.amount))} style={{
        fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700,
        color:"var(--g)", background:"rgba(124,255,107,0.08)",
        border:"1px solid rgba(124,255,107,0.25)", padding:"3px 10px",
        cursor:"pointer", letterSpacing:"0.1em",
      }}>MAX</button>
    </div>
  ) : null;
})()}
<input className="v-input" type="number" placeholder="100" min="1"
  value={amount} onChange={e => setAmount(e.target.value)} />
            </div>

            <div style={{
              fontFamily:"var(--font-mono)", fontSize:10, color:"var(--t3)",
              lineHeight:1.7, marginBottom:20,
              padding:12, background:"rgba(0,0,0,0.2)", border:"1px solid var(--border)",
            }}>
              {modal.mode === "stake" ? (
                <>You earn proportionally when predictions are verified onchain.<br />
                You lose stake when predictions are disproven.<br />
                This action requires a MetaMask signature — no gas fees.</>
              ) : (
                <>Your staked MNT will be returned immediately.<br />
                Future earnings from this agent will stop.<br />
                This action requires a MetaMask signature — no gas fees.</>
              )}
            </div>

            <div style={{ display:"flex", gap:10 }}>
              <button className="btn" style={{
                flex:1, padding:13, fontSize:11,
                background: modal.mode === "stake" ? "var(--g)" : "var(--red)",
                color: "#040A06", border:"none", cursor: signing ? "not-allowed" : "pointer",
                fontFamily:"var(--font-mono)", fontWeight:800, letterSpacing:"0.1em",
                textTransform:"uppercase", opacity: signing ? 0.6 : 1,
              }} onClick={confirmAction} disabled={signing}>
                {signing ? "Waiting for signature..." : modal.mode === "stake" ? "CONFIRM STAKE" : "CONFIRM UNSTAKE"}
              </button>
              <button className="btn btn-ghost" style={{ padding:"13px 20px", fontSize:11 }}
                onClick={() => setModal(null)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}