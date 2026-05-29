import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useT } from '../../context/LanguageContext.jsx';
import { useRouter, Link } from '../../context/RouterContext.jsx';
import { AtlasLogo, PlayerPhoto, ClubLogo } from '../ui/index.jsx';
import { PLAYERS, CLUBS, FIXTURES } from '../../data.js';

const kbdStyle = {
  fontFamily:'var(--font-mono)',fontSize:9,padding:'2px 6px',borderRadius:4,
  background:'var(--color-surface-3)',border:'1px solid var(--color-border-2)',color:'var(--color-text-secondary)',
};

function CommandPalette({ open, onClose }) {
  const { navigate } = useRouter();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  useEffect(()=>{ if(open){ setQ(''); setActive(0); setTimeout(()=>inputRef.current?.focus(),30); } },[open]);

  const PAGES = [
    {label:'Best XI',to:'/best-xi',hint:'Lineup builder'},
    {label:'Fixtures',to:'/fixtures',hint:'Match centre'},
    {label:'Compare',to:'/compare',hint:'Player comparison'},
    {label:'Methodology',to:'/methodology',hint:'How we rate'},
  ];

  const results = useMemo(()=>{
    const s = q.trim().toLowerCase();
    const groups = [];
    if(!s){ groups.push({type:'Pages',items:PAGES.map(p=>({...p,kind:'page'}))}); return groups; }
    const players = PLAYERS.filter(p=>p.name.toLowerCase().includes(s)||(p.nameAr&&p.nameAr.includes(q.trim()))||p.club?.name.toLowerCase().includes(s)).slice(0,6).map(p=>({kind:'player',player:p,to:`/players/${p.id}`,label:p.name}));
    const clubSeen=new Set();
    const clubs = Object.values(CLUBS).filter(c=>c.name.toLowerCase().includes(s)&&!clubSeen.has(c.id)&&clubSeen.add(c.id)).slice(0,4).map(c=>({kind:'club',club:c,to:'/players',label:c.name}));
    const pages = PAGES.filter(p=>p.label.toLowerCase().includes(s)).map(p=>({...p,kind:'page'}));
    if(players.length) groups.push({type:'Players',items:players});
    if(clubs.length)   groups.push({type:'Clubs',items:clubs});
    if(pages.length)   groups.push({type:'Pages',items:pages});
    return groups;
  },[q]);

  const flat = useMemo(()=>results.flatMap(g=>g.items),[results]);
  useEffect(()=>{ setActive(0); },[q]);
  const select = useCallback(item=>{ if(!item)return; navigate(item.to); onClose(); },[navigate,onClose]);

  useEffect(()=>{
    if(!open) return;
    const onKey = e=>{
      if(e.key==='Escape') onClose();
      else if(e.key==='ArrowDown'){ e.preventDefault(); setActive(a=>Math.min(flat.length-1,a+1)); }
      else if(e.key==='ArrowUp'){ e.preventDefault(); setActive(a=>Math.max(0,a-1)); }
      else if(e.key==='Enter'){ e.preventDefault(); select(flat[active]); }
    };
    document.addEventListener('keydown',onKey);
    return ()=>document.removeEventListener('keydown',onKey);
  },[open,flat,active,select,onClose]);

  if(!open) return null;
  let idx = -1;
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:300,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(6px)',display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:'12vh'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:560,background:'var(--color-surface)',border:'1px solid var(--color-border-2)',borderRadius:'var(--radius-lg)',boxShadow:'var(--shadow-modal)',overflow:'hidden',animation:'fadeUp 200ms ease'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',borderBottom:'1px solid var(--color-border)'}}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
          <input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search players, clubs, competitions…" style={{flex:1,background:'transparent',border:0,outline:'none',fontSize:15,color:'var(--color-text-primary)'}}/>
          <kbd style={kbdStyle}>ESC</kbd>
        </div>
        <div style={{maxHeight:'52vh',overflowY:'auto',padding:'8px 0'}}>
          {flat.length===0?(<div style={{padding:'32px 18px',textAlign:'center',color:'var(--color-text-secondary)',fontSize:13}}>No results. Try <strong style={{color:'var(--color-text-primary)'}}>Hakimi</strong> or <strong style={{color:'var(--color-text-primary)'}}>Botola</strong>.</div>)
            :results.map(g=>(
              <div key={g.type}>
                <div style={{padding:'8px 18px 4px',fontFamily:'var(--font-mono)',fontSize:9,letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--color-text-tertiary)'}}>{g.type}</div>
                {g.items.map(item=>{ idx++; const isActive=idx===active; const mi=idx; return (
                  <div key={(item.player?.id||item.club?.id||item.label)+mi} onMouseEnter={()=>setActive(mi)} onClick={()=>select(item)}
                    style={{display:'flex',alignItems:'center',gap:12,padding:'9px 18px',cursor:'pointer',
                      background:isActive?'var(--color-surface-2)':'transparent',
                      borderInlineStart:`2px solid ${isActive?'var(--color-red)':'transparent'}`}}>
                    {item.kind==='player'&&<><PlayerPhoto player={item.player} size={28}/><span style={{flex:1,fontSize:13,fontWeight:500}}>{item.player.name}</span><span style={{fontSize:11,color:'var(--color-text-secondary)'}}>{item.player.club?.shortName}·{item.player.pos}</span></>}
                    {item.kind==='club'&&<><ClubLogo club={item.club} size={22}/><span style={{flex:1,fontSize:13}}>{item.club.name}</span></>}
                    {item.kind==='page'&&<><span style={{width:22,textAlign:'center',color:'var(--color-text-secondary)'}}>→</span><span style={{flex:1,fontSize:13}}>{item.label}</span><span style={{fontSize:11,color:'var(--color-text-tertiary)'}}>{item.hint}</span></>}
                  </div>
                ); })}
              </div>
          ))}
        </div>
        <div style={{display:'flex',gap:14,padding:'10px 18px',borderTop:'1px solid var(--color-border)',fontSize:10,color:'var(--color-text-tertiary)',fontFamily:'var(--font-mono)',letterSpacing:'0.06em'}}>
          <span><kbd style={kbdStyle}>↑↓</kbd> navigate</span><span><kbd style={kbdStyle}>↵</kbd> open</span><span><kbd style={kbdStyle}>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

function LanguageSwitcher({ locale, setLocale }) {
  return (
    <div style={{display:'inline-flex',gap:4,padding:3,background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'var(--radius-full)'}}>
      {['AR','FR','EN'].map(L=>{
        const code=L.toLowerCase(), active=locale===code;
        return (
          <button key={L} onClick={()=>setLocale(code)}
            style={{ padding:'4px 10px',fontSize:11,fontFamily:'var(--font-mono)',fontWeight:600,letterSpacing:'0.06em',
              background:active?'var(--color-red)':'transparent',color:active?'#fff':'var(--color-text-secondary)',
              border:0,borderRadius:'var(--radius-full)',cursor:'pointer',transition:'all 150ms ease' }}>
            {L}
          </button>
        );
      })}
    </div>
  );
}

export default function Navbar() {
  const { t, locale, setLocale } = useT();
  const { path, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(()=>{
    const onKey = e=>{ if((e.metaKey||e.ctrlKey)&&(e.key==='k'||e.key==='K')){ e.preventDefault(); setPaletteOpen(o=>!o); } };
    document.addEventListener('keydown',onKey);
    return ()=>document.removeEventListener('keydown',onKey);
  },[]);

  const links = [
    {to:'/',label:t('nav.home')},{to:'/best-xi',label:t('nav.bestxi')},{to:'/players',label:t('nav.players')},
    {to:'/fixtures',label:t('nav.fixtures')},{to:'/compare',label:t('nav.compare')},{to:'/methodology',label:t('nav.methodology')},
  ];
  const isActive = to => to==='/'?path==='/':path.startsWith(to);

  return (
    <nav style={{ position:'fixed',top:0,insetInlineStart:0,insetInlineEnd:0,height:'var(--nav-h)',zIndex:50,
      background:'rgba(13,15,14,0.78)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',
      borderBottom:'1px solid var(--color-border)',display:'flex',alignItems:'center',justifyContent:'space-between',paddingInline:'24px' }}>
      <Link to="/" style={{display:'flex',alignItems:'center',gap:10}}>
        <AtlasLogo size={26}/>
        <div style={{lineHeight:1}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:20,letterSpacing:'0.04em'}}>ATLAS&nbsp;LIONS</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:8.5,letterSpacing:'0.22em',color:'var(--color-text-secondary)',marginTop:2}}>ANALYTICS</div>
        </div>
      </Link>

      <div style={{display:'flex',alignItems:'center',gap:22}} className="nav-center">
        {links.map(l=>(
          <a key={l.to} href={'#'+l.to} onClick={e=>{e.preventDefault();navigate(l.to);}}
            style={{ fontSize:12,fontWeight:500,letterSpacing:'0.06em',textTransform:'uppercase',
              color:isActive(l.to)?'var(--color-text-primary)':'var(--color-text-secondary)',
              borderBottom:`2px solid ${isActive(l.to)?'var(--color-red)':'transparent'}`,
              padding:'4px 0',transition:'all 150ms ease' }}>{l.label}</a>
        ))}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <button onClick={()=>setPaletteOpen(true)} aria-label="Search" style={{
          display:'inline-flex',alignItems:'center',gap:8,height:32,padding:'0 10px 0 12px',
          background:'var(--color-surface)',border:'1px solid var(--color-border-2)',borderRadius:'var(--radius-full)',
          color:'var(--color-text-secondary)',fontSize:12,cursor:'pointer',transition:'all 150ms ease' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
          <span className="cmdk-label">Search</span>
          <kbd style={{...kbdStyle,fontSize:9}}>⌘K</kbd>
        </button>
        <LanguageSwitcher locale={locale} setLocale={setLocale}/>
        <button className="nav-mobile-btn" onClick={()=>setMobileOpen(true)} aria-label="Menu"
          style={{display:'none',width:36,height:36,borderRadius:6,border:'1px solid var(--color-border)',background:'transparent',color:'var(--color-text-primary)',alignItems:'center',justifyContent:'center'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>

      <CommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)}/>

      {mobileOpen&&(
        <div onClick={()=>setMobileOpen(false)} style={{position:'fixed',inset:0,top:'var(--nav-h)',background:'rgba(13,15,14,0.96)',backdropFilter:'blur(20px)',padding:'24px',zIndex:60,display:'flex',flexDirection:'column',gap:8}}>
          {links.map(l=>(
            <a key={l.to} href={'#'+l.to} onClick={e=>{e.preventDefault();navigate(l.to);setMobileOpen(false);}} style={{
              padding:'16px 4px',fontFamily:'var(--font-display)',fontSize:24,letterSpacing:'0.02em',
              borderBottom:'1px solid var(--color-border)',color:isActive(l.to)?'var(--color-red)':'var(--color-text-primary)' }}>{l.label}</a>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 1080px) { .nav-center { display: none !important; } .nav-mobile-btn { display: inline-flex !important; } .cmdk-label { display: none !important; } }
      `}</style>
    </nav>
  );
}
