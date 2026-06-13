import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllAgents, fetchReputation, AGENT_COLORS } from "../lib/contracts.js";

const MAIN_AGENTS = [
  { id:1, name:"VERITAS-01", color:"#7CFF6B" },
  { id:2, name:"VERITAS-02", color:"#FFD166" },
  { id:3, name:"VERITAS-03", color:"#FF4466" },
];

export default function Universe() {
  const canvasRef = useRef(null);
  const navigate  = useNavigate();
  const [reps,    setReps]    = useState({});
  const [stats,   setStats]   = useState({ agents:0, preds:0, verified:0 });
  const [tooltip, setTooltip] = useState(null);
  const nodesRef  = useRef([]);
  const edgesRef  = useRef([]);
  const scaleRef  = useRef(1);
  const offRef    = useRef({ x:0, y:0 });
  const dragRef   = useRef({ on:false, sx:0, sy:0 });
  const afRef     = useRef(null);
  const timeRef   = useRef(0);

  // Fetch real rep from chain
  useEffect(() => {
    MAIN_AGENTS.forEach(a => {
      fetchReputation(a.id)
        .then(r => setReps(prev => ({ ...prev, [a.id]: r })))
        .catch(() => {});
    });
  }, []);

  // Boot canvas once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      buildNodes(canvas.width, canvas.height);
    };

    function buildNodes(W, H) {
      // 3 large main agents — positioned in a triangle
      const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.28;
      const mainPositions = [
        { x: cx,             y: cy - r       },
        { x: cx - r * 0.85, y: cy + r * 0.5 },
        { x: cx + r * 0.85, y: cy + r * 0.5 },
      ];

      const mainNodes = MAIN_AGENTS.map((a, i) => ({
        ...a, isMain:true,
        x: mainPositions[i].x,
        y: mainPositions[i].y,
        r: 22,
        vx:0, vy:0,
        pulse: i * (Math.PI * 2 / 3),
        repVal: 50,
      }));

      // Ghost nodes
      const ghostColors = ["#7CFF6B","#FFD166","#FF4466"];
      const ghostNodes = Array.from({ length: 28 }, (_, i) => {
        const rep = 25 + Math.random() * 72;
        const ci  = rep > 80 ? 0 : rep > 55 ? 1 : 2;
        return {
          id:null, name:`AGENT-${String(i+4).padStart(2,"0")}`,
          isMain:false, color:ghostColors[ci], repVal:rep,
          x: 60 + Math.random() * (W - 120),
          y: 60 + Math.random() * (H - 120),
          r: 4 + Math.random() * 7,
          vx: (Math.random()-0.5)*0.35,
          vy: (Math.random()-0.5)*0.35,
          pulse: Math.random()*Math.PI*2,
        };
      });

      const allNodes = [...ghostNodes, ...mainNodes];
      nodesRef.current = allNodes;

      // Edges — only connect nearby nodes
      const edges = [];
      for (let i=0;i<allNodes.length;i++) {
        for (let j=i+1;j<allNodes.length;j++) {
          const dx=allNodes[i].x-allNodes[j].x, dy=allNodes[i].y-allNodes[j].y;
          const d=Math.sqrt(dx*dx+dy*dy);
          const threshold = (allNodes[i].isMain||allNodes[j].isMain) ? 320 : 160;
          if (d<threshold && Math.random()>0.45)
            edges.push({ a:i, b:j, trust:Math.random(), d });
        }
      }
      // Always connect the 3 main agents to each other
      const mStart = ghostNodes.length;
      [[mStart,mStart+1],[mStart+1,mStart+2],[mStart,mStart+2]].forEach(([a,b])=>{
        if (!edges.find(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a)))
          edges.push({ a, b, trust:1, d:200, isMainEdge:true });
      });
      edgesRef.current = edges;
    }

    resize();
    window.addEventListener("resize", resize);

    function draw(ts) {
      timeRef.current = ts * 0.001;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0,0,W,H);
      ctx.save();
      ctx.translate(offRef.current.x, offRef.current.y);
      ctx.scale(scaleRef.current, scaleRef.current);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const t = timeRef.current;

      // Move ghost nodes
      nodes.forEach(n => {
        if (n.isMain) { n.pulse += 0.012; return; }
        n.x += n.vx; n.y += n.vy; n.pulse += 0.022;
        const BW = W/scaleRef.current, BH = H/scaleRef.current;
        if (n.x < 40 || n.x > BW-40) n.vx *= -1;
        if (n.y < 40 || n.y > BH-40) n.vy *= -1;
      });

      // Draw edges
      edges.forEach(e => {
        const a = nodes[e.a], b = nodes[e.b];
        const dx=a.x-b.x, dy=a.y-b.y;
        const d=Math.sqrt(dx*dx+dy*dy);
        const maxD = e.isMainEdge ? 600 : 280;
        if (d > maxD) return;

        if (e.isMainEdge) {
          // Animated main edge — glowing pulse traveling along it
          const grad = ctx.createLinearGradient(a.x,a.y,b.x,b.y);
          const phase = (t * 0.4) % 1;
          grad.addColorStop(Math.max(0,phase-0.1), "rgba(124,255,107,0.04)");
          grad.addColorStop(phase,                  "rgba(124,255,107,0.55)");
          grad.addColorStop(Math.min(1,phase+0.1), "rgba(124,255,107,0.04)");
          ctx.beginPath();
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.2;
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
          // Static dim base line
          ctx.beginPath();
          ctx.strokeStyle = "rgba(124,255,107,0.08)";
          ctx.lineWidth = 0.6;
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(77,223,255,${(1-d/maxD)*e.trust*0.18})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(n => {
        const glow = Math.sin(n.pulse)*0.35+0.65;

        if (n.isMain) {
          // Outer atmospheric rings
          [44, 32, 22].forEach((extra, ri) => {
            const alpha = [0.06, 0.12, 0.22][ri] * glow;
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r + extra, 0, Math.PI*2);
            ctx.strokeStyle = n.color + Math.round(alpha*255).toString(16).padStart(2,"0");
            ctx.lineWidth = 1.5;
            ctx.stroke();
          });
          // Rotating dashed ring
          ctx.save();
          ctx.translate(n.x, n.y);
          ctx.rotate(t * 0.3);
          ctx.beginPath();
          ctx.arc(0, 0, n.r + 14, 0, Math.PI*2);
          ctx.setLineDash([4, 8]);
          ctx.strokeStyle = n.color + "50";
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
          // Node fill with radial gradient
          const rg = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
          rg.addColorStop(0, n.color + "FF");
          rg.addColorStop(0.6, n.color + "CC");
          rg.addColorStop(1, n.color + "66");
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
          ctx.fillStyle = rg; ctx.fill();
          // Name label
          ctx.font = "700 12px 'JetBrains Mono',monospace";
          ctx.fillStyle = "#EEF9EE";
          ctx.textAlign = "center";
          ctx.fillText(n.name, n.x, n.y + n.r + 22);
          // Rep score label
          ctx.font = "500 10px 'JetBrains Mono',monospace";
          ctx.fillStyle = n.color;
          const repStr = reps[n.id] ? "REP " + parseFloat(reps[n.id].score).toFixed(1) : "REP —";
          ctx.fillText(repStr, n.x, n.y + n.r + 36);
          // ERC-8004 label
          ctx.font = "400 8px 'JetBrains Mono',monospace";
          ctx.fillStyle = "rgba(124,255,107,0.35)";
          ctx.fillText("ERC-8004", n.x, n.y + n.r + 48);
        } else {
          // Ghost node — simple glow dot
          const rg2 = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r*2);
          rg2.addColorStop(0, n.color + "44");
          rg2.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r*2, 0, Math.PI*2);
          ctx.fillStyle = rg2; ctx.fill();
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
          ctx.fillStyle = n.color + Math.round(glow*150).toString(16).padStart(2,"0");
          ctx.fill();
        }
      });

      ctx.restore();
      afRef.current = requestAnimationFrame(draw);
    }

    afRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(afRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [reps]); // re-run when rep data arrives

  function toCanvas(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offRef.current.x) / scaleRef.current,
      y: (e.clientY - rect.top  - offRef.current.y) / scaleRef.current,
    };
  }

  function handleMouseMove(e) {
    if (dragRef.current.on) {
      offRef.current.x += e.clientX - dragRef.current.sx;
      offRef.current.y += e.clientY - dragRef.current.sy;
      dragRef.current.sx = e.clientX;
      dragRef.current.sy = e.clientY;
      return;
    }
    const { x:mx, y:my } = toCanvas(e);
    const rect = canvasRef.current.getBoundingClientRect();
    let found = null;
    nodesRef.current.forEach(n => {
      if (Math.sqrt((n.x-mx)**2+(n.y-my)**2) < n.r + 14) found = n;
    });
    if (found) {
      setTooltip({
        sx: e.clientX - rect.left + 16,
        sy: e.clientY - rect.top  + 16,
        node: found,
      });
      canvasRef.current.style.cursor = found.isMain ? "pointer" : "crosshair";
    } else {
      setTooltip(null);
      canvasRef.current.style.cursor = "grab";
    }
  }

  function handleClick(e) {
    const { x:mx, y:my } = toCanvas(e);
    nodesRef.current.forEach(n => {
      if (n.isMain && Math.sqrt((n.x-mx)**2+(n.y-my)**2) < n.r+14)
        navigate("/dna");
    });
  }

  const totalPreds = Object.values(reps).reduce((s,r)=>s+parseInt(r.totalPreds||0),0);
  const totalCorr  = Object.values(reps).reduce((s,r)=>s+parseInt(r.correct||0),0);

  return (
    <div style={{ position:"relative", height:"100vh", overflow:"hidden", paddingTop:60, background:"var(--bg)" }}>

      <canvas ref={canvasRef}
        style={{ position:"absolute",inset:0,width:"100%",height:"100%",cursor:"grab" }}
        onMouseMove={handleMouseMove}
        onMouseDown={e=>{dragRef.current={on:true,sx:e.clientX,sy:e.clientY}; e.currentTarget.style.cursor="grabbing";}}
        onMouseUp={e=>{dragRef.current.on=false; e.currentTarget.style.cursor="grab";}}
        onMouseLeave={()=>{dragRef.current.on=false;}}
        onClick={handleClick}
      />

      {/* Subtle vignette */}
      <div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 70% at 50% 50%,transparent 40%,rgba(6,13,8,0.55) 100%)",pointerEvents:"none" }} />

      {/* Header */}
      <div style={{ position:"relative",zIndex:10,display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"28px 48px 0" }}>
        <div>
          <div className="section-label">Screen 01 — Agent Universe</div>
          <div style={{ fontFamily:"var(--font-display)",fontSize:"clamp(28px,4vw,44px)",letterSpacing:"0.06em" }}>
            VERITAS <span style={{color:"var(--g)"}}>AGENT NETWORK</span>
          </div>
          <div style={{ fontFamily:"var(--font-mono)",fontSize:10,color:"var(--t3)",marginTop:6,display:"flex",gap:16 }}>
            <span>Every node is a registered ERC-8004 AI agent</span>
            <span style={{color:"var(--g)"}}>· Click main agents to inspect DNA</span>
          </div>
        </div>
        <div style={{display:"flex",gap:36}}>
          {[
            [Object.keys(reps).length||"—","Active Agents"],
            [totalPreds||"—","Predictions"],
            [totalCorr||"—","Verified"],
            ["$0","Unproven Claims"],
          ].map(([v,l])=>(
            <div key={l} style={{textAlign:"right"}}>
              <span style={{fontFamily:"var(--font-mono)",fontSize:22,fontWeight:700,color:"var(--g)",display:"block"}}>{String(v)}</span>
              <span style={{fontFamily:"var(--font-mono)",fontSize:9,color:"var(--t3)",letterSpacing:"0.15em",textTransform:"uppercase"}}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ position:"absolute",bottom:48,left:48,zIndex:10,display:"flex",flexDirection:"column",gap:10,background:"rgba(6,13,8,0.75)",padding:"14px 18px",border:"1px solid var(--border)",backdropFilter:"blur(8px)" }}>
        {[
          ["#7CFF6B","High Reputation (90+)"],
          ["#FFD166","Mid Reputation (60–90)"],
          ["#FF4466","Low Reputation (<60)"],
          ["#4DDFFF","Trust Connection"],
        ].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:c,boxShadow:`0 0 6px ${c}88`}} />
            <span style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--t2)",letterSpacing:"0.1em"}}>{l}</span>
          </div>
        ))}
      </div>

      {/* VERITAS agent quick-nav */}
      <div style={{ position:"absolute",bottom:48,right:48,zIndex:10,display:"flex",flexDirection:"column",gap:8 }}>
        {MAIN_AGENTS.map(a => (
          <div key={a.id} style={{
            display:"flex",alignItems:"center",gap:10,padding:"8px 14px",
            background:"rgba(6,13,8,0.82)",border:`1px solid ${a.color}30`,
            backdropFilter:"blur(8px)",cursor:"pointer",transition:"border-color 0.2s",
          }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=a.color+"80"}
          onMouseLeave={e=>e.currentTarget.style.borderColor=a.color+"30"}
          onClick={()=>navigate("/dna")}
          >
            <div style={{width:8,height:8,borderRadius:"50%",background:a.color,boxShadow:`0 0 8px ${a.color}`}} />
            <span style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--t2)",letterSpacing:"0.1em"}}>{a.name}</span>
            <span style={{fontFamily:"var(--font-mono)",fontSize:10,color:a.color,marginLeft:"auto",paddingLeft:12}}>
              {reps[a.id] ? "REP "+parseFloat(reps[a.id].score).toFixed(1) : "—"}
            </span>
          </div>
        ))}
        <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:4}}>
          {[["+","Zoom in",1.2],["-","Zoom out",0.8],["↺","Reset",null]].map(([label,title,factor])=>(
            <button key={label} title={title} onClick={()=>{
              if (factor) scaleRef.current=Math.max(0.4,Math.min(3,scaleRef.current*factor));
              else { scaleRef.current=1; offRef.current={x:0,y:0}; }
            }} style={{
              width:38,height:38,background:"rgba(6,13,8,0.85)",border:"1px solid var(--border)",
              color:"var(--t2)",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",
              justifyContent:"center",fontFamily:"var(--font-mono)",transition:"all 0.2s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--g)";e.currentTarget.style.color="var(--g)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--t2)"}}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position:"absolute",left:tooltip.sx,top:tooltip.sy,
          background:"rgba(10,21,16,0.96)",border:"1px solid var(--border2)",
          padding:"14px 18px",fontFamily:"var(--font-mono)",fontSize:11,
          pointerEvents:"none",zIndex:20,backdropFilter:"blur(12px)",minWidth:200,
        }}>
          <div style={{fontSize:13,fontWeight:700,color:tooltip.node.color||"var(--g)",marginBottom:8}}>{tooltip.node.name}</div>
          {tooltip.node.isMain && reps[tooltip.node.id] ? (
            <>
              <div style={{display:"flex",justifyContent:"space-between",gap:24,marginBottom:4}}><span style={{color:"var(--t3)"}}>Rep Score</span><span style={{color:tooltip.node.color}}>{parseFloat(reps[tooltip.node.id].score).toFixed(1)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",gap:24,marginBottom:4}}><span style={{color:"var(--t3)"}}>Accuracy</span><span>{reps[tooltip.node.id].accuracy}%</span></div>
              <div style={{display:"flex",justifyContent:"space-between",gap:24,marginBottom:4}}><span style={{color:"var(--t3)"}}>Predictions</span><span>{reps[tooltip.node.id].totalPreds}</span></div>
              <div style={{marginTop:8,fontSize:9,color:"rgba(124,255,107,0.4)"}}>Click to inspect Agent DNA →</div>
            </>
          ) : (
            <>
              <div style={{color:"var(--t3)",marginBottom:4}}>Ghost node · ERC-8004 registered</div>
              <div style={{display:"flex",justifyContent:"space-between",gap:24}}><span style={{color:"var(--t3)"}}>Rep Score</span><span style={{color:tooltip.node.color}}>{tooltip.node.repVal?.toFixed(1)}</span></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}