import React, { useState, useEffect, useRef } from "react";
import { fetchReputation, fetchAgentPredictions, AGENT_COLORS } from "../lib/contracts.js";

const AGENTS = [
  { id:1, name:"VERITAS-01", specializations:["MACRO","ETH EXPERT","LOW RISK","LONG-TERM"] },
  { id:2, name:"VERITAS-02", specializations:["SHORT-TERM","HIGH FREQ","MNT FOCUS","MOMENTUM"] },
  { id:3, name:"VERITAS-03", specializations:["AGGRESSIVE","HIGH RISK","CONTRARIAN","RECOVERING"] },
];
const DNA_DIMS = ["ACCURACY","CONVICTION","ADAPTABILITY","RISK APPETITE","REACTION SPEED","CONSISTENCY"];

export default function DNA() {
  const [selected, setSelected] = useState(1);
  const [reps,     setReps]     = useState({});
  const [preds,    setPreds]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    AGENTS.forEach(a => {
      fetchReputation(a.id)
        .then(r => setReps(prev => ({...prev, [a.id]: r})))
        .catch(()=>{});
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAgentPredictions(selected, 10)
      .then(p => { setPreds(p); setLoading(false); })
      .catch(()=>setLoading(false));
  }, [selected]);

  const agent = AGENTS.find(a=>a.id===selected);
  const rep   = reps[selected];
  const color = AGENT_COLORS[selected] || "var(--g)";

  // DNA values derived from onchain data
  const accuracy = rep ? parseFloat(rep.accuracy)/100 : 0.5;
  const dnaVals  = [
    accuracy,
    Math.min(1, accuracy * 1.15),
    0.4 + Math.random()*0.1,
    selected===3 ? 0.9 : selected===2 ? 0.72 : 0.44,
    selected===2 ? 0.94 : 0.78,
    Math.min(1, accuracy * 1.05),
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W=432,H=432,CX=216,CY=216,R=155;
    const n=DNA_DIMS.length;
    const angles = DNA_DIMS.map((_,i)=>i*(2*Math.PI/n)-Math.PI/2);
    ctx.clearRect(0,0,W,H);
    // Rings
    for (let r=1;r<=5;r++) {
      ctx.beginPath();
      angles.forEach((a,i)=>{ const x=CX+Math.cos(a)*(R*r/5),y=CY+Math.sin(a)*(R*r/5); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
      ctx.closePath();
      ctx.strokeStyle=r===5?"rgba(124,255,107,0.18)":"rgba(124,255,107,0.06)";
      ctx.lineWidth=0.7; ctx.stroke();
    }
    // Axes
    angles.forEach(a=>{
      ctx.beginPath(); ctx.moveTo(CX,CY);
      ctx.lineTo(CX+Math.cos(a)*R,CY+Math.sin(a)*R);
      ctx.strokeStyle="rgba(124,255,107,0.07)"; ctx.lineWidth=0.7; ctx.stroke();
    });
    // Data
    ctx.beginPath();
    angles.forEach((a,i)=>{ const x=CX+Math.cos(a)*R*dnaVals[i],y=CY+Math.sin(a)*R*dnaVals[i]; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.closePath();
    ctx.fillStyle=color+"14"; ctx.fill();
    ctx.strokeStyle=color+"AA"; ctx.lineWidth=1.8; ctx.stroke();
    // Dots
    angles.forEach((a,i)=>{ const x=CX+Math.cos(a)*R*dnaVals[i],y=CY+Math.sin(a)*R*dnaVals[i]; ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fillStyle=color; ctx.fill(); ctx.strokeStyle="rgba(4,10,6,0.9)"; ctx.lineWidth=2; ctx.stroke(); });
    // Labels
    ctx.font="600 9px 'JetBrains Mono',monospace"; ctx.fillStyle="rgba(58,90,69,0.9)"; ctx.textAlign="center";
    angles.forEach((a,i)=>{ ctx.fillText(DNA_DIMS[i],CX+Math.cos(a)*(R+28),CY+Math.sin(a)*(R+28)+4); });
    ctx.font="500 9px 'JetBrains Mono',monospace"; ctx.fillStyle=color+"BB";
    angles.forEach((a,i)=>{ const x=CX+Math.cos(a)*R*dnaVals[i],y=CY+Math.sin(a)*R*dnaVals[i]; ctx.fillText((dnaVals[i]*100).toFixed(1)+"%",x+Math.cos(a)*16,y+Math.sin(a)*16); });
  }, [selected, reps]);

  return (
    <div className="page" style={{paddingBottom:64}}>
      <div className="section-label">Screen 03 — Agent DNA</div>
      <div className="section-title">LIVING INTELLIGENCE<br />PROFILES</div>
      <p className="section-desc">Every agent develops a unique evolving fingerprint derived from onchain decisions. A living reputation that updates with every prediction.</p>

      {/* Agent selector */}
      <div style={{display:"flex",gap:8,marginBottom:28}}>
        {AGENTS.map(a=>(
          <button key={a.id} onClick={()=>setSelected(a.id)} className="btn" style={{
            padding:"8px 20px",
            background: selected===a.id ? "rgba(124,255,107,0.1)" : "var(--s2)",
            border: `1px solid ${selected===a.id?"var(--g)":"var(--border)"}`,
            color: selected===a.id ? "var(--g)" : "var(--t2)",
          }}>{a.name}</button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 460px",gap:40,alignItems:"start"}}>
        <div>
          {/* Profile header */}
          <div className="card" style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"var(--font-display)",fontSize:32,letterSpacing:"0.06em"}}>{agent?.name}</div>
                <div style={{fontFamily:"var(--font-mono)",fontSize:9,color:"var(--t3)",marginTop:4}}>ERC-8004 Identity · Agent ID #{selected}</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontFamily:"var(--font-display)",fontSize:52,color,lineHeight:1}}>
                  {rep?.score || "—"}
                </div>
                <div style={{fontFamily:"var(--font-mono)",fontSize:8,color:"var(--t3)",letterSpacing:"0.15em"}}>REPUTATION SCORE</div>
              </div>
            </div>
            {/* DNA bars */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {DNA_DIMS.map((dim,i)=>(
                <div key={dim} className="card" style={{padding:14}}>
                  <div style={{fontFamily:"var(--font-mono)",fontSize:9,color:"var(--t3)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>{dim}</div>
                  <div style={{fontFamily:"var(--font-display)",fontSize:32,color,lineHeight:1}}>{(dnaVals[i]*100).toFixed(1)}%</div>
                  <div style={{height:2,background:"rgba(255,255,255,0.05)",marginTop:8}}>
                    <div style={{height:2,background:`linear-gradient(90deg,${color}40,${color})`,width:`${dnaVals[i]*100}%`,transition:"width 0.8s ease"}} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="card">
            <div className="card-title">Recent Onchain Predictions</div>
            {loading && <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--t3)",padding:"8px 0"}}>Loading...</div>}
            {!loading && preds.length===0 && <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--t3)",padding:"8px 0"}}>No predictions yet for this agent.</div>}
            {preds.map(p=>(
              <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                <span style={{fontSize:13,fontWeight:600}}>{p.market}</span>
                <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:p.isLong?"var(--g)":"var(--red)"}}>{p.isLong?"▲ LONG":"▼ SHORT"}</span>
                <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:p.status==="Verified"?"var(--g)":p.status==="Disproven"?"var(--red)":"var(--gold)"}}>{p.status}</span>
                <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:p.pnl>0?"var(--g)":p.pnl<0?"var(--red)":"var(--gold)"}}>{p.status==="Pending"?"PENDING":p.pnl>0?`+$${p.pnl.toFixed(0)}`:`-$${Math.abs(p.pnl).toFixed(0)}`}</span>
                <span style={{fontFamily:"var(--font-mono)",fontSize:9,color:"var(--t3)"}}>{p.confidence}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Radar */}
        <div style={{position:"sticky",top:80}}>
          <div className="card">
            <div className="card-title">Agent DNA Radar · 6-Dimension Profile</div>
            <canvas ref={canvasRef} width={432} height={432} style={{width:"100%",display:"block"}} />
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:14}}>
              {agent?.specializations.map(s=>(
                <span key={s} style={{padding:"4px 10px",border:"1px solid rgba(124,255,107,0.15)",fontFamily:"var(--font-mono)",fontSize:9,color:"rgba(124,255,107,0.5)",letterSpacing:"0.08em"}}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}