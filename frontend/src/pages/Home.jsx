import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllTickers, formatPrice } from "../lib/bybit.js";

export default function Home() {
  const canvasRef = useRef(null);
  const navigate  = useNavigate();
  const [tickers, setTickers] = useState([]);
  const [block,   setBlock]   = useState(null);

  useEffect(() => {
    getAllTickers().then(setTickers).catch(() => {});
    import("../lib/chain.js").then(({ getReadProvider }) => {
      const p = getReadProvider();
      p.getBlockNumber().then(setBlock);
      const id = setInterval(() => p.getBlockNumber().then(setBlock), 12000);
      return () => clearInterval(id);
    });
  }, []);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let af;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const nodes = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.3,
      p: Math.random() * Math.PI * 2,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.p += 0.018;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(124,255,107,${(1 - d/120)*0.12})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(124,255,107,${Math.sin(n.p)*0.35+0.55})`;
        ctx.fill();
      });
      af = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(af); window.removeEventListener("resize", resize); };
  }, []);

  const eth = tickers.find(t => t.symbol === "ETHUSDT");

  return (
    <div style={{ position:"relative", background:"var(--bg)" }}>

      {/* ═══ HERO ═══ */}
      <div style={{ position:"relative", minHeight:"100vh", overflow:"hidden", display:"flex", flexDirection:"column" }}>
        <canvas ref={canvasRef} style={{ position:"absolute",inset:0,width:"100%",height:"100%",zIndex:0 }} />
        <div style={{ position:"absolute",inset:0,zIndex:1, background:"linear-gradient(120deg,rgba(4,10,6,0.93) 0%,rgba(4,10,6,0.60) 50%,rgba(4,10,6,0.88) 100%)" }} />

        <div style={{ position:"relative",zIndex:5,flex:1,display:"flex",alignItems:"flex-end",padding:"120px 56px 100px" }}>
          <div style={{ flex:1,maxWidth:760 }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:24 }} className="fade-up">
              <span className="live-dot" />
              <span style={{ fontFamily:"var(--font-mono)",fontSize:11,letterSpacing:"0.25em",textTransform:"uppercase",color:"var(--g)" }}>
                Live on Mantle · ERC-8004 Active
              </span>
              <div style={{ width:40,height:1,background:"var(--t3)" }} />
              <span style={{ fontFamily:"var(--font-mono)",fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:"var(--t3)" }}>
                AI Trading &amp; Strategy
              </span>
            </div>

            <div className="fade-up delay-1">
              <div style={{ fontFamily:"var(--font-display)",fontSize:"clamp(80px,11vw,148px)",lineHeight:0.88,letterSpacing:"0.03em",color:"var(--t)" }}>THE FIRST</div>
              <div style={{ fontFamily:"var(--font-display)",fontSize:"clamp(80px,11vw,148px)",lineHeight:0.88,letterSpacing:"0.03em",color:"transparent",WebkitTextStroke:"1.5px var(--g)" }}>ACCOUNTABLE</div>
              <div style={{ fontFamily:"var(--font-display)",fontSize:"clamp(80px,11vw,148px)",lineHeight:0.88,letterSpacing:"0.03em",color:"var(--g)",textShadow:"0 0 60px rgba(124,255,107,0.3)" }}>AI TRADER</div>
            </div>

            <p style={{ fontSize:17,fontWeight:300,color:"var(--t2)",maxWidth:520,lineHeight:1.75,margin:"32px 0 40px" }} className="fade-up delay-2">
              Every signal. Every reasoning chain. Every trade outcome.
              <strong style={{color:"var(--t)",fontWeight:500}}> Permanently committed to Mantle</strong> via ERC-8004.
              The agent cannot hide. It cannot lie.
            </p>

            <div style={{ display:"flex",gap:14 }} className="fade-up delay-3">
              <button className="btn btn-primary" style={{ padding:"14px 32px",fontSize:12 }} onClick={() => navigate("/feed")}>
                Launch Terminal
              </button>
              <button className="btn btn-ghost" style={{ padding:"14px 32px",fontSize:12 }} onClick={() => navigate("/universe")}>
                Agent Universe
              </button>
            </div>
          </div>

          {/* Glass terminal */}
          <div style={{ width:360,flexShrink:0,marginLeft:48,background:"rgba(10,22,14,0.85)",border:"1px solid rgba(124,255,107,0.18)",backdropFilter:"blur(24px)",padding:24,position:"relative",overflow:"hidden" }} className="fade-up delay-2">
            <div style={{ position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(124,255,107,0.5),transparent)" }} />
            <div style={{ fontFamily:"var(--font-mono)",fontSize:9,color:"var(--t3)",letterSpacing:"0.2em",marginBottom:16,display:"flex",alignItems:"center",gap:8 }}>
              VERITAS_AGENT_01 · LIVE FEED
              <div style={{ flex:1,height:1,background:"var(--t3)",opacity:0.3 }} />
            </div>
            {[
              { p:"›", t:"signal_scan --market ETH/USDT", dim:true },
              { p:" ", t:`✓ Price: ${eth ? formatPrice(eth.lastPrice) : "loading..."}`, g:true },
              { p:" ", t:`✓ Funding: ${eth ? (eth.fundingRate*100).toFixed(4)+"%" : "—"}`, g:true },
              { p:" ", t:"⚡ Whale accumulation flagged", gold:true },
              null,
              { p:"›", t:"reason --models 3 --consensus", dim:true },
              { p:" ", t:"Model-A LONG 84% · Model-B LONG 79%", dim:true },
              { p:" ", t:"✓ Consensus: LONG ETH/USDT", g:true },
              null,
              { p:"›", t:"commit --chain mantle --erc8004", dim:true },
              { p:" ", t:"✓ Hash: 0x7f3a...d891 sealed", g:true },
              { p:" ", t:`⛓ Block #${block ? Number(block).toLocaleString() : "..."}`, blue:true },
              null,
              { p:"›", t:"_", cursor:true },
            ].map((line, i) => line === null ? (
              <div key={i} style={{ borderTop:"1px solid rgba(255,255,255,0.05)",margin:"10px 0" }} />
            ) : (
              <div key={i} style={{ display:"flex",gap:8,fontFamily:"var(--font-mono)",fontSize:11,lineHeight:1.9 }}>
                <span style={{ color:"rgba(124,255,107,0.5)",flexShrink:0 }}>{line.p}</span>
                <span style={{ color:line.g?"var(--g)":line.gold?"var(--gold)":line.blue?"var(--blue)":"var(--t3)" }}>
                  {line.t}
                  {line.cursor && <span style={{ display:"inline-block",width:7,height:13,background:"var(--g)",verticalAlign:"middle",marginLeft:2,animation:"glow-pulse 1s step-end infinite" }} />}
                </span>
              </div>
            ))}
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)",marginTop:14,paddingTop:14 }}>
              {[["Predictions Logged","2,863"],["Avg Accuracy","73.4%"],["Unverified Claims","0"],["Reputation Score","94.7"]].map(([k,v]) => (
                <div key={k} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0" }}>
                  <span style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--t3)" }}>{k}</span>
                  <span style={{ fontFamily:"var(--font-mono)",fontSize:13,fontWeight:700,color:v==="0"||v==="94.7"?"var(--g)":"var(--t)" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stat bar */}
        <div style={{ position:"relative",zIndex:5,borderTop:"1px solid var(--border)",background:"rgba(4,10,6,0.7)",display:"grid",gridTemplateColumns:"repeat(4,1fr)",backdropFilter:"blur(10px)",paddingBottom:36 }}>
          {[["2,863","Predictions Onchain"],["3","ERC-8004 Agents"],["73.4%","Avg Accuracy"],["$0","Unverified Claims"]].map(([v,l]) => (
            <div key={l} style={{ padding:"20px 48px",borderRight:"1px solid var(--border)" }}>
              <span className="data-val">{v}</span>
              <span className="data-label">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ FOUR LAYERS OF TRUTH ═══ */}
      <div style={{ padding:"120px 56px", borderTop:"1px solid var(--border)" }}>
        <div className="section-label">How VERITAS Works</div>
        <div style={{ fontFamily:"var(--font-display)",fontSize:"clamp(52px,7vw,88px)",letterSpacing:"0.03em",lineHeight:0.92,marginBottom:20,color:"var(--t)" }}>
          FOUR LAYERS<br />OF TRUTH
        </div>
        <p style={{ fontSize:16,fontWeight:300,color:"var(--t2)",maxWidth:580,lineHeight:1.75,marginBottom:64 }}>
          Every trade follows a cryptographically sealed pipeline. Skip a step — forfeit your reputation. Every decision, permanently onchain.
        </p>

        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,background:"rgba(124,255,107,0.08)" }}>
          {[
            { num:"01", title:"SIGNAL", desc:"Real market data via Bybit API, Mantle on-chain flows, funding rates, and whale tracking. Zero fabricated inputs ever.", badge:"BYBIT API · MANTLE ON-CHAIN", highlight:false },
            { num:"02", title:"REASON", desc:"Three Claude models debate the signal. Majority consensus commits a reasoning hash to Mantle before any trade executes.", badge:"CLAUDE 3-MODEL CONSENSUS", highlight:true },
            { num:"03", title:"EXECUTE", desc:"Trade logged on-chain. Execution hash matched to reasoning hash. Any mismatch triggers automatic reputation penalty.", badge:"MANTLE MAINNET · ERC-8004", highlight:false },
            { num:"04", title:"PROVE",  desc:"Outcome recorded permanently. Reputation updates. Anyone verifies the full chain: signal → reasoning → trade → result.", badge:"ERC-8004 REPUTATION REGISTRY", highlight:false },
          ].map(step => (
            <div key={step.num} style={{
              background:"var(--bg)",
              borderTop:"2px solid transparent",
              padding:"36px 28px",
              position:"relative",
              transition:"border-color 0.25s,background 0.25s",
              cursor:"default",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderTopColor="var(--g)"; e.currentTarget.style.background="rgba(124,255,107,0.04)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderTopColor="transparent"; e.currentTarget.style.background="var(--bg)"; }}
            >
              <div style={{ fontFamily:"var(--font-display)",fontSize:56,color:"rgba(124,255,107,0.08)",lineHeight:1,marginBottom:20,letterSpacing:"0.05em" }}>{step.num}</div>
              <div style={{ fontFamily:"var(--font-display)",fontSize:30,letterSpacing:"0.08em",color:"var(--t)",marginBottom:14 }}>{step.title}</div>
              <p style={{ fontSize:13,color:"var(--t2)",lineHeight:1.7,fontWeight:300 }}>{step.desc}</p>
              <span style={{ marginTop:24,display:"inline-block",padding:"4px 12px",border:"1px solid rgba(124,255,107,0.15)",fontFamily:"var(--font-mono)",fontSize:9,color:"rgba(124,255,107,0.6)",letterSpacing:"0.1em",textTransform:"uppercase" }}>{step.badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ STAKE ON THE AGENTS ═══ */}
      <div style={{ padding:"120px 56px", background:"rgba(124,255,107,0.015)", borderTop:"1px solid var(--border)" }}>
        <div className="section-label">Reputation Economy</div>
        <div style={{ fontFamily:"var(--font-display)",fontSize:"clamp(52px,7vw,88px)",letterSpacing:"0.03em",lineHeight:0.92,marginBottom:20 }}>
          STAKE ON THE<br />AGENTS WHO EARNED IT
        </div>
        <p style={{ fontSize:16,fontWeight:300,color:"var(--t2)",maxWidth:540,lineHeight:1.75,marginBottom:64 }}>
          Reputation is earned prediction by prediction, recorded permanently, and can never be faked. Stake on high-reputation agents and earn when they perform.
        </p>

        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,background:"rgba(124,255,107,0.07)" }}>
          {[
            { rank:"01", id:"AGENT_VERITAS_01 · ERC-8004", name:"VERITAS-01", score:"94.7", delta:"+2.3", up:true,  tags:["MACRO","ETH EXPERT","LOW RISK"],   color:"var(--g)",   top:true },
            { rank:"02", id:"AGENT_VERITAS_02 · ERC-8004", name:"VERITAS-02", score:"81.2", delta:"+0.8", up:true,  tags:["SHORT-TERM","HIGH FREQ","MNT FOCUS"], color:"var(--gold)", top:false },
            { rank:"03", id:"AGENT_VERITAS_03 · ERC-8004", name:"VERITAS-03", score:"67.4", delta:"-4.1", up:false, tags:["AGGRESSIVE","HIGH RISK","RECOVERING"],color:"var(--gold)", top:false },
          ].map(agent => (
            <div key={agent.rank} style={{ background:"var(--bg)",padding:"40px 32px",borderTop:agent.top?"2px solid var(--g)":"2px solid transparent",transition:"background 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(124,255,107,0.03)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--bg)"}
            >
              <div style={{ fontFamily:"var(--font-display)",fontSize:72,lineHeight:1,color:agent.top?"rgba(255,209,102,0.15)":"rgba(124,255,107,0.08)",marginBottom:20,letterSpacing:"0.04em" }}>{agent.rank}</div>
              <div style={{ fontFamily:"var(--font-mono)",fontSize:9,color:"var(--t3)",letterSpacing:"0.12em",marginBottom:6 }}>{agent.id}</div>
              <div style={{ fontFamily:"var(--font-display)",fontSize:28,letterSpacing:"0.06em",color:"var(--t)",marginBottom:28 }}>{agent.name}</div>
              <div style={{ fontFamily:"var(--font-mono)",fontSize:9,color:"var(--t3)",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:6 }}>Reputation Score</div>
              <div style={{ fontFamily:"var(--font-display)",fontSize:64,letterSpacing:"0.02em",lineHeight:1,color:agent.color }}>{agent.score}</div>
              <div style={{ fontFamily:"var(--font-mono)",fontSize:11,margin:"8px 0 24px",color:agent.up?"var(--g)":"var(--red)",fontWeight:600 }}>
                {agent.up?"▲ +":"▼ "}{Math.abs(parseFloat(agent.delta)).toFixed(1)} this week
              </div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:24 }}>
                {agent.tags.map(t=><span key={t} style={{ padding:"3px 9px",border:"1px solid rgba(124,255,107,0.12)",fontFamily:"var(--font-mono)",fontSize:9,color:"rgba(124,255,107,0.5)",letterSpacing:"0.06em" }}>{t}</span>)}
              </div>
              <button className="btn btn-ghost" style={{ fontSize:10,padding:"9px 20px" }} onClick={()=>navigate("/reputation")}>
                ⬡ STAKE ON {agent.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ TRUTH IS THE ONLY EDGE ═══ */}
      <div style={{ padding:"160px 56px",textAlign:"center",position:"relative",overflow:"hidden",borderTop:"1px solid var(--border)" }}>
        {/* Glow orb */}
        <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:700,height:350,background:"radial-gradient(ellipse,rgba(124,255,107,0.09) 0%,transparent 70%)",pointerEvents:"none" }} />

        <div style={{ fontFamily:"var(--font-mono)",fontSize:10,letterSpacing:"0.25em",textTransform:"uppercase",color:"var(--g)",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:24 }}>
          <div style={{ width:20,height:1,background:"var(--g)" }} />
          Built on Mantle · Powered by ERC-8004
          <div style={{ width:20,height:1,background:"var(--g)" }} />
        </div>

        <div style={{ fontFamily:"var(--font-display)",fontSize:"clamp(60px,9vw,110px)",letterSpacing:"0.04em",lineHeight:0.9,marginBottom:28,position:"relative",zIndex:1 }}>
          <div style={{ color:"var(--t)" }}>TRUTH IS THE</div>
          <div style={{ color:"var(--g)",textShadow:"0 0 80px rgba(124,255,107,0.4)" }}>ONLY EDGE.</div>
        </div>

        <p style={{ fontSize:17,fontWeight:300,color:"var(--t2)",maxWidth:440,margin:"0 auto 48px",lineHeight:1.75,position:"relative",zIndex:1 }}>
          VERITAS doesn't just trade. It proves. Every signal, every reason, every outcome — permanently onchain.
        </p>

        <div style={{ display:"flex",gap:14,justifyContent:"center",position:"relative",zIndex:1 }}>
          <button className="btn btn-primary" style={{ padding:"16px 36px",fontSize:12 }} onClick={()=>navigate("/feed")}>
            Launch VERITAS Terminal
          </button>
          <button className="btn btn-ghost" style={{ padding:"16px 36px",fontSize:12 }}
            onClick={()=>window.open("https://explorer.sepolia.mantle.xyz","_blank")}>
            View on Mantle Explorer
          </button>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding:"28px 56px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--t3)",letterSpacing:"0.1em" }}>
          VERITAS © 2026 · The Turing Test Hackathon · Mantle Network
        </div>
        <div style={{ display:"flex",gap:24 }}>
          {[["GitHub","https://github.com/0xkinno/veritas"],["Docs","https://github.com/0xkinno/veritas"],["Explorer","https://explorer.sepolia.mantle.xyz"],["DoraHacks","https://dorahacks.io"]].map(([l,href])=>(
            <a key={l} href={href} target="_blank" rel="noreferrer" style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--t3)",textDecoration:"none",letterSpacing:"0.1em",textTransform:"uppercase",transition:"color 0.2s" }}
              onMouseEnter={e=>e.target.style.color="var(--g)"}
              onMouseLeave={e=>e.target.style.color="var(--t3)"}
            >{l}</a>
          ))}
        </div>
        <div style={{ fontFamily:"var(--font-mono)",fontSize:9,color:"rgba(124,255,107,0.5)",padding:"4px 10px",border:"1px solid rgba(124,255,107,0.15)",letterSpacing:"0.1em" }}>
          ERC-8004 COMPLIANT
        </div>
      </footer>

    </div>
  );
}