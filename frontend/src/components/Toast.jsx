import React from "react";

const ICONS = { success: "✓", error: "✕", info: "◈" };
const COLORS = { success: "var(--g)", error: "var(--red)", info: "var(--blue)" };

export default function Toast({ toasts }) {
  return (
    <div style={{
      position:"fixed", top:70, right:20, zIndex:99999,
      display:"flex", flexDirection:"column", gap:8,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background:"var(--s1)", border:"1px solid var(--border2)",
          borderLeft:`3px solid ${COLORS[t.type] || "var(--g)"}`,
          padding:"12px 18px", maxWidth:320,
          fontFamily:"var(--font-mono)", fontSize:11, color:"var(--t)",
          display:"flex", alignItems:"flex-start", gap:10,
          animation:"fadeUp 0.3s ease both",
        }}>
          <span style={{color:COLORS[t.type],flexShrink:0,marginTop:1}}>{ICONS[t.type]}</span>
          <div>
            <div style={{fontWeight:700,marginBottom:2}}>{t.title}</div>
            <div style={{color:"var(--t2)",fontSize:10,lineHeight:1.4}}>{t.msg}</div>
          </div>
        </div>
      ))}
    </div>
  );
}