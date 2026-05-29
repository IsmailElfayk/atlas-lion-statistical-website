import { useState, useEffect, useRef } from 'react';
import { getRatingTone, statusMeta, fmtDate, COUNTRY_A2 } from '../../data.js';
import { useRouter } from '../../context/RouterContext.jsx';

export function Button({ variant='primary', size='md', loading, disabled, icon, iconRight, children, onClick, className='', type='button', style={} }) {
  const sizes = { sm:{padding:'6px 12px',fontSize:12,height:30}, md:{padding:'9px 18px',fontSize:13,height:38}, lg:{padding:'14px 28px',fontSize:15,height:50} };
  const variants = {
    primary:   { background:'var(--color-red)',    color:'#fff',                    border:'1px solid var(--color-red)' },
    secondary: { background:'transparent',          color:'var(--color-text-primary)',border:'1px solid var(--color-border-2)' },
    ghost:     { background:'transparent',          color:'var(--color-text-secondary)',border:'1px solid transparent' },
    danger:    { background:'var(--color-red-dim)', color:'#fff',                    border:'1px solid var(--color-red-dim)' },
    green:     { background:'var(--color-green)',   color:'#fff',                    border:'1px solid var(--color-green)' },
  };
  return (
    <button type={type} onClick={disabled||loading?undefined:onClick} disabled={disabled||loading} className={'atlas-btn '+className}
      style={{ ...variants[variant],...sizes[size], display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,
        borderRadius:6,fontFamily:'var(--font-body)',fontWeight:600,letterSpacing:'0.02em',
        cursor:disabled||loading?'not-allowed':'pointer',opacity:disabled?0.5:1,
        transition:'all 150ms ease',whiteSpace:'nowrap',...style }}>
      {loading ? <Spinner size="sm" color="#fff"/> : icon}
      {children}
      {iconRight}
    </button>
  );
}

export function Card({ children, elevated, interactive, className='', style={}, onClick, padding=20 }) {
  return (
    <div onClick={onClick} className={'atlas-card '+className}
      style={{ background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',
        padding,boxShadow:elevated?'var(--shadow-card)':'none',transition:'all 200ms ease',
        cursor:interactive?'pointer':'default',...style }}
      onMouseEnter={interactive?(e)=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-card-hover)'; e.currentTarget.style.borderColor='var(--color-border-2)'; }:undefined}
      onMouseLeave={interactive?(e)=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=elevated?'var(--shadow-card)':'none'; e.currentTarget.style.borderColor='var(--color-border)'; }:undefined}
    >{children}</div>
  );
}

export function Badge({ color='gray', size='md', children, style={} }) {
  const colors = {
    red:  { bg:'var(--color-red-soft)',   fg:'#E84856', border:'rgba(193,18,31,0.4)' },
    green:{ bg:'var(--color-green-soft)', fg:'#39B57A', border:'rgba(0,122,61,0.45)' },
    gold: { bg:'var(--color-gold-soft)',  fg:'#E2C24A', border:'rgba(212,175,55,0.45)' },
    teal: { bg:'rgba(72,168,156,0.13)',   fg:'#48A89C', border:'rgba(72,168,156,0.42)' },
    blue: { bg:'rgba(108,140,180,0.13)',  fg:'#94B0D6', border:'rgba(108,140,180,0.42)' },
    gray: { bg:'rgba(158,168,159,0.10)',  fg:'var(--color-text-secondary)', border:'var(--color-border-2)' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:4,
      padding:size==='sm'?'2px 7px':'3px 9px',fontSize:size==='sm'?9:10,fontWeight:600,
      letterSpacing:'var(--tracking-cap)',textTransform:'uppercase',
      color:c.fg,background:c.bg,border:`1px solid ${c.border}`,borderRadius:4,...style }}>
      {children}
    </span>
  );
}

export function PositionBadge({ position, size='md' }) {
  const colorMap = { GK:'gold',CB:'blue',RB:'blue',LB:'blue',WB:'blue',DM:'teal',CDM:'teal',CM:'teal',AM:'teal',CAM:'teal',LM:'teal',RM:'teal',RW:'red',LW:'red',ST:'red' };
  return <Badge color={colorMap[position]||'gray'} size={size}>{position}</Badge>;
}

export function EligibilityBadge({ eligibility }) {
  const map = { capped:{color:'red',label:'Capped',icon:'🇲🇦'}, eligible:{color:'green',label:'Eligible',icon:'✓'}, switchable:{color:'gold',label:'Switchable',icon:'⚡'}, ineligible:{color:'gray',label:'Ineligible',icon:'✗'} };
  const c = map[eligibility] || map.eligible;
  return <Badge color={c.color} size="sm" style={{gap:5}}><span style={{fontSize:11}}>{c.icon}</span>{c.label}</Badge>;
}

export function DataQualityBadge({ quality, size='sm' }) {
  const map = { event:{color:'green',icon:'●',label:'Event'}, rating:{color:'teal',icon:'★',label:'Rating'}, heuristic:{color:'gold',icon:'⚡',label:'Heuristic'}, none:{color:'gray',icon:'–',label:'No data'} };
  const c = map[quality] || map.none;
  return <Badge color={c.color} size={size} style={{gap:5}}><span>{c.icon}</span>{c.label}</Badge>;
}

export function StatusPill({ player, size='sm', showReturn=true }) {
  if (!player || player.status === 'available') {
    if (size === 'lg') return <Badge color="green" size="sm" style={{gap:5}}><span style={{fontSize:11}}>✓</span>Available</Badge>;
    return null;
  }
  const meta = statusMeta(player.status);
  const ret = showReturn && player.returnDate ? ` — back ${fmtDate(player.returnDate)}` : '';
  return <Badge color={meta.color} size={size} style={{gap:5}}><span style={{width:6,height:6,borderRadius:'50%',background:meta.dot,display:'inline-block'}}/>{meta.label}{ret}</Badge>;
}

export function Spinner({ size='md', color='var(--color-red)' }) {
  const px = {sm:14,md:24,lg:48}[size];
  return (
    <svg width={px} height={px} viewBox="0 0 24 24" style={{animation:'spin 0.8s linear infinite'}}>
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="14 38"/>
    </svg>
  );
}

export function Skeleton({ width, height=14, radius=4, style={} }) {
  return <div className="skeleton" style={{width,height,borderRadius:radius,...style}}/>;
}

export function Flag({ country, size='md' }) {
  const a2 = COUNTRY_A2[country] || country?.toLowerCase().slice(0,2);
  const w = size==='sm'?16:size==='lg'?28:20;
  return (
    <span style={{ display:'inline-block',width:w,height:Math.round(w*0.7),
      background:`url(https://flagcdn.com/w40/${a2}.png) center/cover no-repeat,var(--color-surface-2)`,
      borderRadius:2,border:'1px solid var(--color-border)',verticalAlign:'middle' }} title={country}/>
  );
}

export function RatingChip({ rating, size='md' }) {
  const noData = rating == null || isNaN(rating);
  const num = noData ? 'N/A' : (typeof rating === 'number' ? rating.toFixed(1) : rating);
  const tone = getRatingTone(noData ? null : rating);
  const h = size==='sm'?22:size==='lg'?34:26;
  return (
    <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',
      minWidth:h*1.4,height:h,padding:'0 7px',
      fontFamily:'var(--font-mono)',fontSize:size==='lg'?16:12,fontWeight:600,
      color:noData?tone.fg:'#0D0F0E',background:noData?tone.bg:tone.solid,
      border:noData?'1px solid var(--color-border-2)':'none',borderRadius:4 }}>
      {num}
    </span>
  );
}

function getContrast(hex) {
  const m = (hex||'').replace('#','');
  if (m.length < 6) return '#FFFFFF';
  const r=parseInt(m.slice(0,2),16),g=parseInt(m.slice(2,4),16),b=parseInt(m.slice(4,6),16);
  return (r*299+g*587+b*114)/1000 > 150 ? '#0D0F0E' : '#FFFFFF';
}

export function ClubLogo({ club, size=22 }) {
  if (!club) return null;
  if (club.logo && club.logo.length <= 2 && /\p{Emoji}/u.test(club.logo)) {
    return <span style={{fontSize:size,lineHeight:1,display:'inline-block',width:size+2}}>{club.logo}</span>;
  }
  const shortName = club.shortName || club.name?.slice(0,3).toUpperCase() || '?';
  return (
    <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',
      width:size,height:size,borderRadius:4,fontFamily:'var(--font-mono)',fontSize:size*0.42,fontWeight:600,letterSpacing:0,
      background:club.color||'#333',color:getContrast(club.color||'#333'),border:'1px solid rgba(255,255,255,0.08)' }}>
      {shortName}
    </span>
  );
}

export function PlayerPhoto({ player, size=48, ring }) {
  if (!player) return <div style={{width:size,height:size,borderRadius:'50%',background:'var(--color-surface-2)',border:'1px solid var(--color-border)'}}/>;
  const initials = (player.name||player.fullName||'').split(' ').filter(Boolean).map(s=>s[0]).slice(0,2).join('');
  const hue = Array.from(player.id||player.slug||'x').reduce((a,c)=>a+c.charCodeAt(0),0) % 360;
  return (
    <div style={{ width:size,height:size,borderRadius:'50%',
      background:`radial-gradient(circle at 30% 28%, hsl(${hue} 35% 28%), hsl(${(hue+30)%360} 28% 14%) 70%)`,
      display:'flex',alignItems:'center',justifyContent:'center',
      fontFamily:'var(--font-display)',fontSize:size*0.42,color:'rgba(240,237,232,0.92)',letterSpacing:'0.03em',
      border:ring?`2px solid ${ring}`:'1px solid var(--color-border)',flexShrink:0,overflow:'hidden',position:'relative' }}>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.5))'}}/>
      <span style={{position:'relative'}}>{initials}</span>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{textAlign:'center',padding:'56px 24px'}}>
      <div style={{fontSize:42,marginBottom:14,opacity:0.5}}>{icon||'◌'}</div>
      <div style={{fontFamily:'var(--font-display)',fontSize:24,letterSpacing:'0.02em',marginBottom:6}}>{title}</div>
      <div style={{color:'var(--color-text-secondary)',fontSize:13,maxWidth:380,margin:'0 auto 18px'}}>{description}</div>
      {action}
    </div>
  );
}

export function Toggle({ checked, onChange, size='md' }) {
  const w=size==='sm'?32:42, h=size==='sm'?18:22;
  return (
    <button role="switch" aria-checked={checked} onClick={()=>onChange(!checked)}
      style={{ position:'relative',width:w,height:h,padding:0,border:0,
        background:checked?'var(--color-green)':'var(--color-surface-3)',
        borderRadius:h,transition:'all 200ms ease',cursor:'pointer' }}>
      <span style={{ position:'absolute',top:2,insetInlineStart:checked?w-h+2:2,
        width:h-4,height:h-4,background:'#fff',borderRadius:'50%',
        transition:'all 200ms cubic-bezier(0.5,1.6,0.4,0.95)' }}/>
    </button>
  );
}

export function Checkbox({ checked, onChange, label, disabled }) {
  return (
    <label style={{display:'inline-flex',alignItems:'center',gap:10,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,userSelect:'none'}}>
      <span style={{ width:18,height:18,borderRadius:4,flexShrink:0,
        background:checked?'var(--color-red)':'transparent',
        border:`1.5px solid ${checked?'var(--color-red)':'var(--color-border-2)'}`,
        display:'inline-flex',alignItems:'center',justifyContent:'center',transition:'all 150ms ease' }}>
        {checked&&<svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M1 5l2.5 2.5L9 1.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} disabled={disabled} style={{position:'absolute',opacity:0,pointerEvents:'none'}}/>
      <span style={{fontSize:13}}>{label}</span>
    </label>
  );
}

export function Tabs({ tabs, activeTab, onTabChange, variant='underline' }) {
  if (variant === 'pill') {
    return (
      <div style={{display:'inline-flex',gap:4,padding:3,background:'var(--color-surface)',borderRadius:'var(--radius-md)',border:'1px solid var(--color-border)'}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>onTabChange(t.id)}
            style={{ padding:'6px 14px',fontSize:12,fontWeight:600,letterSpacing:'0.02em',
              background:activeTab===t.id?'var(--color-red)':'transparent',
              color:activeTab===t.id?'#fff':'var(--color-text-secondary)',
              border:0,borderRadius:6,cursor:'pointer',transition:'all 150ms ease' }}>
            {t.label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div style={{display:'flex',gap:24,borderBottom:'1px solid var(--color-border)'}}>
      {tabs.map(t=>(
        <button key={t.id} onClick={()=>onTabChange(t.id)}
          style={{ padding:'10px 0',fontSize:13,fontWeight:600,letterSpacing:'0.04em',
            color:activeTab===t.id?'var(--color-text-primary)':'var(--color-text-secondary)',
            background:'transparent',border:0,
            borderBottom:`2px solid ${activeTab===t.id?'var(--color-red)':'transparent'}`,
            marginBottom:-1,cursor:'pointer',transition:'all 150ms ease',textTransform:'uppercase' }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({ min, max, step=1, value, onChange, label, unit }) {
  const pct = ((value-min)/(max-min))*100;
  return (
    <div>
      {label&&(
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <span style={{fontSize:12,color:'var(--color-text-secondary)'}}>{label}</span>
          <span style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--color-text-primary)',fontWeight:600}}>{value}{unit||''}</span>
        </div>
      )}
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)}
        style={{ width:'100%',appearance:'none',WebkitAppearance:'none',height:6,borderRadius:3,outline:'none',
          background:`linear-gradient(to right,var(--color-red) 0%,var(--color-red) ${pct}%,var(--color-surface-3) ${pct}%,var(--color-surface-3) 100%)` }}/>
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, size='md', subtitle }) {
  useEffect(()=>{
    if (!isOpen) return;
    const onKey = e => e.key==='Escape'&&onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return ()=>{ document.removeEventListener('keydown',onKey); document.body.style.overflow=''; };
  },[isOpen,onClose]);
  if (!isOpen) return null;
  const widths = {sm:420,md:560,lg:760};
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.72)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',padding:24,animation:'fadeUp 220ms ease'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-lg)',width:'100%',maxWidth:widths[size],maxHeight:'88vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'var(--shadow-modal)',animation:'fadeUp 280ms ease'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid var(--color-border)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div>
            <h3 style={{fontFamily:'var(--font-display)',fontSize:24,letterSpacing:'0.01em'}}>{title}</h3>
            {subtitle&&<div style={{fontSize:12,color:'var(--color-text-secondary)',marginTop:2}}>{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" style={{width:32,height:32,borderRadius:6,border:0,background:'var(--color-surface-2)',color:'var(--color-text-secondary)',fontSize:18,cursor:'pointer'}}>×</button>
        </div>
        <div style={{overflowY:'auto',padding:0,flex:1}}>{children}</div>
      </div>
    </div>
  );
}

export function AtlasLogo({ size=28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Atlas Lions">
      <defs><linearGradient id="atl-r" x1="0" x2="1"><stop offset="0%" stopColor="#C1121F"/><stop offset="100%" stopColor="#7A0B12"/></linearGradient></defs>
      <path d="M22 16a9 9 0 1 1-9-9 7 7 0 1 0 9 9z" fill="url(#atl-r)"/>
      <path d="M24 11.5l1.1 2.6 2.8.2-2.1 1.9.7 2.8-2.5-1.5-2.5 1.5.7-2.8-2.1-1.9 2.8-.2z" fill="#D4AF37"/>
    </svg>
  );
}
