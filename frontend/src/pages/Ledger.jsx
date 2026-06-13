import React, { useState, useEffect, useContext } from "react";
import { ToastContext } from "../App.jsx";
import { fetchPredictions, AGENT_NAMES, EXPLORER } from "../lib/contracts.js";

export default function Ledger() {
  const showToast = useContext(ToastContext);
  const [preds,   setPreds]   = useState([]);
  const [filter,  setFilter]  = useState("all");
  const [open,    setOpen]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions(100)
      .then(p=>{ setPreds(p); setLoading(false); })
      .catch(()=>setLoading(false));
    const id = setInterval(()=>fetchPredictions(100).then(setPreds).catch(()=>{}), 25000);
    return ()=>clearInterval(id);
  },[]);

  const filtered = filter==="all" ? preds : preds.filter(p=>p.status.toLowerCase().startsWith(filter));
  const STATUS_CLASS = { Verified:"badge-verified", Pending:"badge-pending", Disproven:"badge-disproven" };

  return (
    <div className="page" style={{paddingBottom:64}}>
      <div className="section-label">Screen 04 — Validation Ledger</div>
      <div className="section-title">EVERY DECISION,<br />PERMANENTLY PROVEN</div>
      <p className="section-desc">Click any row to inspect the full cryptographic proof chain — reasoning hash, Mantle transaction, ERC-8004 identity + validation + reputation records.</p>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{display:"flex",gap:8}}>
          {[["all","ALL"],["ver","VERIFIED"],["pen","PENDING"],["dis","DISPROVEN"]].map(([v,l])=>(
            <button key={v} className="btn" onClick={()=>setFilter(v)} style={{
              padding:"7px 14px", fontSize:10,
              background:filter===v?"rgba(124,255,107,0.1)":"var(--s2)",
              border:`1px solid ${filter===v?"var(--g)":"var(--border)"}`,
              color:filter===v?"var(--g)":"var(--t3)",
            }}>{l}</button>
          ))}
        </div>
        <span style={{fontFamily:"var(--font-mono)",fontSize:11,fontWeight:700,color:"var(--t2),"}}>{filtered.length} record{filtered.length!==1?"s":""}</span>
      </div>

      <div className="vtable">
      <div className="vtable-head" style={{gridTemplateColumns:"68px 1fr 120px 130px 110px 110px 44px"}}>
  {["ID","Agent","Market","Prediction","Outcome","Status",""].map(h=>(
    <div key={h} style={{
      fontFamily:"var(--font-mono)", fontSize:10, fontWeight:800,
      letterSpacing:"0.18em", textTransform:"uppercase",
      color:"var(--t)", opacity:0.9,
    }}>{h}</div>
  ))}
</div>
        {loading && <div style={{padding:"20px",fontFamily:"var(--font-mono)",fontSize:11,color:"var(--t3)"}}>Loading onchain records...</div>}
        {!loading && filtered.length===0 && <div style={{padding:"20px",fontFamily:"var(--font-mono)",fontSize:11,color:"var(--t3)"}}>No records found.</div>}
        {filtered.map((p,idx)=>(
          <React.Fragment key={p.id}>
            <div className="vtable-row" style={{gridTemplateColumns:"68px 1fr 120px 130px 110px 110px 44px"}} onClick={()=>setOpen(open===idx?null:idx)}>
              <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--t3)"}}>#{p.id}</div>
              <div>
                <div style={{fontSize:13,fontWeight:600}}>{AGENT_NAMES[p.agentId]||`AGENT-${p.agentId}`}</div>
                <div style={{fontFamily:"var(--font-mono)",fontSize:9,color:"var(--t3)",marginTop:2}}>{p.reasoningHash.slice(0,12)}...</div>
              </div>
              <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--t2)"}}>{p.market}</div>
              <div style={{fontSize:13,fontWeight:700,color:p.isLong?"var(--g)":"var(--red)"}}>{p.isLong?"▲ LONG":"▼ SHORT"}</div>
              <div style={{fontFamily:"var(--font-mono)",fontSize:12,color:p.pnl>0?"var(--g)":p.pnl<0?"var(--red)":"var(--gold)"}}>
                {p.status==="Pending"?"PENDING":p.pnl>0?`+$${p.pnl.toFixed(0)}`:`-$${Math.abs(p.pnl).toFixed(0)}`}
              </div>
              <div><span className={`badge ${STATUS_CLASS[p.status]}`}><span className="badge-dot"/>{p.status.toUpperCase()}</span></div>
              <div><button style={{width:28,height:28,background:"transparent",border:"1px solid var(--border)",color:"var(--t3)",cursor:"pointer",fontFamily:"var(--font-mono)",fontSize:12}}>{open===idx?"−":"+"}</button></div>
            </div>
            {open===idx&&(
              <div style={{background:"var(--s3)",borderBottom:"1px solid var(--border)",borderTop:"1px solid var(--border2)",padding:20}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
                  {[
                    { title:"ERC-8004 Identity Registry", fields:[["Agent",AGENT_NAMES[p.agentId]||`AGENT-${p.agentId}`],["Agent ID",`#${p.agentId}`],["Registered Block","On-chain"]] },
                    { title:"ERC-8004 Validation Registry", fields:[["Reasoning Hash",p.reasoningHash.slice(0,20)+"..."],["Entry Price",`$${p.entryPrice.toFixed(2)}`],["Confidence",`${p.confidence}%`]] },
                    { title:"ERC-8004 Reputation Registry", fields:[["Status",p.status],["Outcome",p.status==="Pending"?"Pending":p.pnl>0?`+$${p.pnl.toFixed(0)}`:`-$${Math.abs(p.pnl).toFixed(0)}`],["Rep Impact",p.status==="Verified"?"+0.80":p.status==="Pending"?"Pending":"-1.40"]] },
                  ].map(block=>(
                    <div key={block.title} style={{background:"var(--s2)",border:"1px solid var(--border)",padding:16}}>
                      <div style={{fontFamily:"var(--font-mono)",fontSize:9,color:"var(--t3)",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:12,height:1,background:"var(--g)"}} />{block.title}
                      </div>
                      {block.fields.map(([k,v])=>(
                        <div key={k} style={{marginBottom:8}}>
                          <div style={{fontFamily:"var(--font-mono)",fontSize:9,color:"var(--t3)",marginBottom:3}}>{k}</div>
                          <div style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--t)",wordBreak:"break-all"}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{background:"var(--bg)",border:"1px solid var(--border)",padding:14}}>
                  <div style={{fontFamily:"var(--font-mono)",fontSize:9,color:"var(--t3)",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:8}}>Committed At</div>
                  <div style={{fontSize:12,color:"var(--t2)"}}>{new Date(p.committedAt).toLocaleString()} · Block committed before trade execution</div>
                </div>
                <button className="btn btn-ghost" style={{marginTop:12,fontSize:10}} onClick={()=>{ window.open(`${EXPLORER}/tx/${p.reasoningHash}`,"_blank"); showToast("info","Opening Explorer","Viewing transaction on Mantle Explorer"); }}>
                  View on Mantle Explorer →
                </button>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}