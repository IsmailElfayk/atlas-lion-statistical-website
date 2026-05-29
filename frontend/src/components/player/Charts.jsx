import { useState, useMemo } from 'react';

export function RatingHistoryChart({ ratings, height=280, label='Sofascore rating' }) {
  const W=720, H=height, PAD={t:24,r:24,b:36,l:36};
  const minR=4.0, maxR=9.5;
  const pts = ratings || [];
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!pts.length) return <div style={{height,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--color-text-secondary)',fontSize:13}}>No rating data in window.</div>;
  const innerW=W-PAD.l-PAD.r, innerH=H-PAD.t-PAD.b;
  const xAt=i=>PAD.l+(i/Math.max(1,pts.length-1))*innerW;
  const yAt=r=>PAD.t+(1-(r-minR)/(maxR-minR))*innerH;
  const path=pts.map((p,i)=>`${i?'L':'M'} ${xAt(i).toFixed(1)} ${yAt(p.rating).toFixed(1)}`).join(' ');
  const areaPath=`${path} L ${xAt(pts.length-1)} ${PAD.t+innerH} L ${PAD.l} ${PAD.t+innerH} Z`;
  const gridYs=[5,6,7,8,9];
  const xTicks=[]; let lastMonth='';
  pts.forEach((p,i)=>{ const m=p.date.slice(0,7); if(m!==lastMonth){ xTicks.push({i,label:new Date(p.date).toLocaleDateString('en',{month:'short'})}); lastMonth=m; } });
  return (
    <div style={{position:'relative'}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block',overflow:'visible'}}>
        <defs><linearGradient id="rh-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="rgba(193,18,31,0.32)"/><stop offset="100%" stopColor="rgba(193,18,31,0)"/></linearGradient></defs>
        <rect x={PAD.l} y={PAD.t} width={innerW} height={yAt(5.5)-PAD.t} fill="rgba(193,18,31,0.04)"/>
        <rect x={PAD.l} y={yAt(8.0)} width={innerW} height={(PAD.t+innerH)-yAt(8.0)} fill="rgba(212,175,55,0.05)"/>
        {gridYs.map(y=>(
          <g key={y}>
            <line x1={PAD.l} x2={PAD.l+innerW} y1={yAt(y)} y2={yAt(y)} stroke="var(--color-border)" strokeWidth="0.6"/>
            <text x={PAD.l-8} y={yAt(y)+3.5} fontSize="10" fontFamily="var(--font-mono)" fill="var(--color-text-tertiary)" textAnchor="end">{y.toFixed(1)}</text>
          </g>
        ))}
        <line x1={PAD.l} x2={PAD.l+innerW} y1={yAt(7.0)} y2={yAt(7.0)} stroke="var(--color-gold)" strokeDasharray="3 3" strokeWidth="0.8" opacity="0.55"/>
        <text x={PAD.l+innerW-6} y={yAt(7.0)-4} fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-gold)" textAnchor="end" letterSpacing="0.1em">TOP FORM 7.0</text>
        {xTicks.map(t=>(
          <text key={t.i} x={xAt(t.i)} y={H-14} fontSize="10" fontFamily="var(--font-mono)" fill="var(--color-text-tertiary)" textAnchor="middle" letterSpacing="0.08em">{t.label.toUpperCase()}</text>
        ))}
        <path d={areaPath} fill="url(#rh-area)"/>
        <path d={path} fill="none" stroke="var(--color-red)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"
          style={{strokeDasharray:2000,strokeDashoffset:2000,animation:'draw 1.4s 0.1s forwards cubic-bezier(0.6,0.05,0.3,0.95)'}}/>
        {pts.map((p,i)=>(
          <g key={i} onMouseEnter={()=>setHoverIdx(i)} onMouseLeave={()=>setHoverIdx(null)} style={{cursor:'pointer'}}>
            <circle cx={xAt(i)} cy={yAt(p.rating)} r={hoverIdx===i?5:3} fill="var(--color-red)" stroke="var(--color-bg)" strokeWidth="1.5"/>
            <circle cx={xAt(i)} cy={yAt(p.rating)} r="14" fill="transparent"/>
          </g>
        ))}
        {hoverIdx!=null&&(()=>{
          const p=pts[hoverIdx]; const cx=xAt(hoverIdx); const cy=yAt(p.rating); const flip=cx>W*0.7;
          return (
            <g pointerEvents="none">
              <line x1={cx} x2={cx} y1={PAD.t} y2={PAD.t+innerH} stroke="rgba(255,255,255,0.18)" strokeDasharray="2 3"/>
              <foreignObject x={flip?cx-200:cx+10} y={cy-50} width="190" height="80">
                <div xmlns="http://www.w3.org/1999/xhtml" style={{background:'var(--color-surface)',border:'1px solid var(--color-border-2)',borderRadius:6,padding:'8px 10px',fontSize:11,color:'var(--color-text-primary)',boxShadow:'var(--shadow-card)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',gap:8,marginBottom:4}}>
                    <span style={{color:'var(--color-text-secondary)',fontFamily:'var(--font-mono)'}}>{new Date(p.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>
                    <span style={{fontFamily:'var(--font-mono)',fontWeight:700,color:p.rating>=7?'var(--color-gold)':'#fff'}}>{p.rating.toFixed(1)}</span>
                  </div>
                  <div style={{fontWeight:600,fontSize:12}}>{p.matchLabel}</div>
                  <div style={{color:'var(--color-text-tertiary)',fontSize:10,marginTop:2}}>
                    {p.competition} · {p.minutes}&apos;
                    {p.result&&<span style={{color:p.result==='W'?'#39B57A':p.result==='L'?'#E84856':'var(--color-text-secondary)',marginLeft:4}}>{p.result}</span>}
                    {p.goals>0&&<span> ⚽</span>}{p.assists>0&&<span> 🅰️</span>}
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })()}
      </svg>
      <div style={{display:'flex',alignItems:'center',gap:14,fontSize:11,color:'var(--color-text-secondary)',marginTop:6}}>
        <span style={{display:'inline-flex',alignItems:'center',gap:6}}><span style={{width:10,height:2,background:'var(--color-red)'}}/> {label}</span>
        <span style={{display:'inline-flex',alignItems:'center',gap:6}}><span style={{width:10,height:0,borderTop:'1.4px dashed var(--color-gold)'}}/> Top form 7.0</span>
      </div>
    </div>
  );
}

export function FormHeatmap({ ratings, days=365 }) {
  const map = useMemo(()=>{ const m={}; (ratings||[]).forEach(r=>{m[r.date]=r;}); return m; },[ratings]);
  const now = new Date('2026-05-28');
  const cells = [];
  for (let i=days-1;i>=0;i--) {
    const d=new Date(now); d.setDate(d.getDate()-i);
    cells.push({date:d.toISOString().slice(0,10),day:d.getDay(),entry:map[d.toISOString().slice(0,10)]});
  }
  const weeks=[]; let curWeek=null;
  cells.reverse().forEach(c=>{ if(c.day===0||!curWeek) curWeek=Array(7).fill(null); curWeek[c.day]=c; if(c.day===6){weeks.push(curWeek);curWeek=null;} });
  if(curWeek) weeks.push(curWeek);
  const cellColor=r=>{ if(!r)return 'var(--color-border)'; if(r.rating<5.5)return '#5A1E22'; if(r.rating<7.0)return '#4A4838'; if(r.rating<8.0)return '#1F6B3F'; return '#39B57A'; };
  const cs=11,gap=2, w=weeks.length*(cs+gap), h=7*(cs+gap)+22;
  const monthLabels=[]; let lastMon='';
  weeks.forEach((wk,i)=>{ const first=wk.find(Boolean); if(!first)return; const m=first.date.slice(5,7); if(m!==lastMon){monthLabels.push({i,label:new Date(first.date).toLocaleDateString('en',{month:'short'})});lastMon=m;} });
  const [hover,setHover] = useState(null);
  return (
    <div>
      <div style={{overflowX:'auto'}}>
        <svg width={w+36} height={h} style={{display:'block'}}>
          {monthLabels.map(m=><text key={m.i} x={32+m.i*(cs+gap)} y={11} fontSize="9" fontFamily="var(--font-mono)" letterSpacing="0.1em" fill="var(--color-text-tertiary)">{m.label.toUpperCase()}</text>)}
          {['Mon','Wed','Fri'].map((d,i)=><text key={d} x={26} y={22+(i*2+1)*(cs+gap)+8} fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-text-tertiary)" textAnchor="end">{d}</text>)}
          {weeks.map((wk,wi)=>wk.map((c,di)=>c&&(
            <rect key={wi+'-'+di} x={32+wi*(cs+gap)} y={22+di*(cs+gap)} width={cs} height={cs} rx={2}
              fill={cellColor(c.entry)} onMouseEnter={()=>setHover(c)} onMouseLeave={()=>setHover(null)}
              style={{cursor:'pointer',transition:'all 100ms ease'}}
              stroke={hover?.date===c.date?'#fff':'transparent'} strokeWidth={1}/>
          )))}
        </svg>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,fontSize:11,color:'var(--color-text-secondary)'}}>
        <div style={{minHeight:18}}>
          {hover&&<span><span style={{fontFamily:'var(--font-mono)',color:'var(--color-text-primary)'}}>{hover.date}</span>{hover.entry?<> · <strong style={{color:hover.entry.rating>=7?'var(--color-gold)':'#fff',fontFamily:'var(--font-mono)'}}>{hover.entry.rating.toFixed(1)}</strong> · {hover.entry.matchLabel}</>:' · No match'}</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:10,fontFamily:'var(--font-mono)',letterSpacing:'0.1em'}}>
          <span>LESS</span>
          {['var(--color-border)','#5A1E22','#4A4838','#1F6B3F','#39B57A'].map(c=><span key={c} style={{width:10,height:10,borderRadius:2,background:c}}/>)}
          <span>MORE</span>
        </div>
      </div>
    </div>
  );
}

export function MarketValueChart({ history, height=220 }) {
  const W=700,H=height,PAD={t:20,r:18,b:30,l:54};
  const pts=history||[];
  if(!pts.length) return null;
  const innerW=W-PAD.l-PAD.r,innerH=H-PAD.t-PAD.b;
  const maxV=Math.max(...pts.map(p=>p.valueEur))*1.1;
  const xAt=i=>PAD.l+(i/(pts.length-1))*innerW;
  const yAt=v=>PAD.t+(1-v/maxV)*innerH;
  const path=pts.map((p,i)=>`${i?'L':'M'} ${xAt(i).toFixed(1)} ${yAt(p.valueEur).toFixed(1)}`).join(' ');
  const area=`${path} L ${xAt(pts.length-1)} ${PAD.t+innerH} L ${PAD.l} ${PAD.t+innerH} Z`;
  const fmt=v=>v>=1e6?'€'+(v/1e6).toFixed(0)+'m':'€'+Math.round(v/1e3)+'k';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:'block'}}>
      <defs><linearGradient id="mv-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="rgba(0,122,61,0.5)"/><stop offset="100%" stopColor="rgba(0,122,61,0)"/></linearGradient></defs>
      {[0.25,0.5,0.75,1].map(p=>(
        <g key={p}>
          <line x1={PAD.l} x2={PAD.l+innerW} y1={yAt(maxV*p)} y2={yAt(maxV*p)} stroke="var(--color-border)" strokeWidth="0.5"/>
          <text x={PAD.l-8} y={yAt(maxV*p)+3} fontSize="10" fontFamily="var(--font-mono)" fill="var(--color-text-tertiary)" textAnchor="end">{fmt(maxV*p)}</text>
        </g>
      ))}
      <path d={area} fill="url(#mv-area)"/>
      <path d={path} stroke="var(--color-green)" strokeWidth="2" fill="none"/>
      {pts.map((p,i)=><circle key={i} cx={xAt(i)} cy={yAt(p.valueEur)} r="2.5" fill="var(--color-green)" stroke="var(--color-bg)" strokeWidth="1"/>)}
      {pts.filter((_,i)=>i%2===0).map((p,i)=>(
        <text key={i} x={xAt(pts.indexOf(p))} y={H-10} fontSize="10" fontFamily="var(--font-mono)" fill="var(--color-text-tertiary)" textAnchor="middle">{p.date.slice(0,4)}</text>
      ))}
    </svg>
  );
}

export function CompareRadar({ players, metrics, data, size=360 }) {
  const cx=size/2,cy=size/2,radius=size*0.38,N=metrics.length;
  const colors=['#C1121F','#007A3D','#D4AF37','#9FB0CC'];
  const pointAt=(value,max,i)=>{
    const r=(value/max)*radius, angle=(-Math.PI/2)+(i*2*Math.PI/N);
    return [cx+Math.cos(angle)*r,cy+Math.sin(angle)*r];
  };
  return (
    <svg viewBox={`0 0 ${size} ${size+50}`} width="100%" style={{display:'block'}}>
      {[0.25,0.5,0.75,1].map(p=>(
        <polygon key={p} points={metrics.map((_,i)=>pointAt(p,1,i).join(',')).join(' ')} fill="none" stroke="var(--color-border)" strokeWidth="0.7"/>
      ))}
      {metrics.map((_,i)=>{ const [x,y]=pointAt(1,1,i); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--color-border)" strokeWidth="0.5"/>; })}
      {metrics.map((m,i)=>{ const [x,y]=pointAt(1.15,1,i); return <text key={i} x={x} y={y+4} fontSize="9" fontFamily="var(--font-mono)" letterSpacing="0.1em" fill="var(--color-text-secondary)" textAnchor="middle">{m.label.toUpperCase()}</text>; })}
      {players.map((p,pi)=>{
        const pts2=metrics.map((m,i)=>{ const v=data[p.id||p.slug]?.[m.key]||0; return pointAt(v,m.max,i); });
        const d=pts2.map(([x,y],i)=>`${i?'L':'M'} ${x} ${y}`).join(' ')+' Z';
        return (
          <g key={p.id||p.slug}>
            <path d={d} fill={colors[pi]+'22'} stroke={colors[pi]} strokeWidth="1.8"/>
            {pts2.map(([x,y],i)=><circle key={i} cx={x} cy={y} r="2.5" fill={colors[pi]}/>)}
          </g>
        );
      })}
      {players.map((p,pi)=>(
        <g key={p.id||p.slug} transform={`translate(${10+pi*(size/players.length)},${size+22})`}>
          <rect width="10" height="10" rx="2" fill={colors[pi]}/>
          <text x="14" y="9" fontSize="11" fill="var(--color-text-primary)" fontWeight="600">{(p.name||p.fullName||'').split(' ').slice(-1)[0]}</text>
        </g>
      ))}
    </svg>
  );
}
