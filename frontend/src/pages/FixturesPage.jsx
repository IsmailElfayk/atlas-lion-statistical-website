import { useState, useMemo } from 'react';
import { Card, Tabs, Toggle, EmptyState } from '../components/ui/index.jsx';
import { FixtureCard } from './HomePage.jsx';
import { FIXTURES, fmtDateLong } from '../data.js';

function compMeta(f) {
  const c = f.competition;
  if (c.includes('FIFA') || c.includes('AFCON') || c.includes('World Cup') || f.home.id === 'mar') return { type:'International', color:'#E84856' };
  if (c.includes('Champions') || c.includes('Europa') || c.includes('Conference') || c.includes('CAF')) return { type:'Continental', color:'var(--color-gold)' };
  if (c.includes('Cup') || c.includes('Copa') || c.includes('Final')) return { type:'Cup', color:'#48A89C' };
  return { type:'League', color:'#94B0D6' };
}

const calNavStyle = {
  padding:'8px 16px', borderRadius:'var(--radius-full)', border:'1px solid var(--color-border-2)',
  background:'var(--color-surface)', color:'var(--color-text-primary)', fontSize:12, fontWeight:600, cursor:'pointer',
};

const selectStyle = {
  height:38, padding:'0 32px 0 14px', appearance:'none', WebkitAppearance:'none',
  background:'var(--color-surface) url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 12 12\' width=\'12\' height=\'12\'><path d=\'M2 4l4 4 4-4\' stroke=\'%239EA89F\' stroke-width=\'1.5\' fill=\'none\'/></svg>") no-repeat right 12px center',
  border:'1px solid var(--color-border-2)', borderRadius:6, color:'var(--color-text-primary)', fontSize:13, fontWeight:500, cursor:'pointer',
};

function FixtureCalendar({ fixtures, month, setMonth, openDay, setOpenDay }) {
  const y = month.getFullYear(), m = month.getMonth();
  const first = new Date(y, m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const byDate = {};
  fixtures.forEach(f => { (byDate[f.date] = byDate[f.date] || []).push(f); });

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ d, iso, fixtures: byDate[iso] || [] });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = first.toLocaleDateString('en-GB', { month:'long', year:'numeric' });
  const today = new Date().toISOString().split('T')[0];
  const openFixtures = openDay ? (byDate[openDay] || []) : [];

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <button onClick={() => { setMonth(new Date(y, m - 1, 1)); setOpenDay(null); }} style={calNavStyle}>‹ Prev</button>
        <h3 style={{ fontFamily:'var(--font-display)', fontSize:26, letterSpacing:'0.02em' }}>{monthName}</h3>
        <button onClick={() => { setMonth(new Date(y, m + 1, 1)); setOpenDay(null); }} style={calNavStyle}>Next ›</button>
      </div>
      <Card padding={0} style={{ overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)' }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} style={{ padding:'10px 0', textAlign:'center', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.12em', color:'var(--color-text-tertiary)', borderBottom:'1px solid var(--color-border)', background:'var(--color-surface-2)' }}>{d.toUpperCase()}</div>
          ))}
          {cells.map((c, i) => (
            <div key={i} onClick={() => c && c.fixtures.length && setOpenDay(openDay === c.iso ? null : c.iso)}
              style={{
                minHeight:84, padding:'8px', borderInlineEnd: (i % 7 !== 6) ? '1px solid var(--color-border)' : 'none',
                borderBottom:'1px solid var(--color-border)',
                background: c && c.iso === openDay ? 'var(--color-surface-2)' : 'transparent',
                cursor: c && c.fixtures.length ? 'pointer' : 'default', position:'relative',
                opacity: c ? 1 : 0.35,
              }}>
              {c && (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color: c.iso === today ? 'var(--color-red)' : 'var(--color-text-secondary)' }}>{c.d}</span>
                    {c.iso === today && <span style={{ fontSize:8, fontFamily:'var(--font-mono)', letterSpacing:'0.1em', color:'var(--color-red)' }}>TODAY</span>}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:8 }}>
                    {c.fixtures.slice(0,6).map(f => {
                      const cm = compMeta(f);
                      return <span key={f.id} title={f.competition} style={{ width:7, height:7, borderRadius:'50%', background:cm.color }}/>;
                    })}
                  </div>
                  {c.fixtures.length > 0 && <div style={{ position:'absolute', bottom:6, insetInlineEnd:8, fontFamily:'var(--font-mono)', fontSize:9, color:'var(--color-text-tertiary)' }}>{c.fixtures.length}</div>}
                </>
              )}
            </div>
          ))}
        </div>
      </Card>
      {openDay && openFixtures.length > 0 && (
        <div style={{ marginTop:18 }} className="fade-up">
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, letterSpacing:'0.02em' }}>{fmtDateLong(openDay)}</h3>
            <div style={{ flex:1, height:1, background:'var(--color-border)' }}/>
            <button onClick={() => setOpenDay(null)} style={{ ...calNavStyle, padding:'4px 10px' }}>Close ×</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {openFixtures.map(f => <FixtureCard key={f.id} fixture={f}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

const BUCKETS = [
  { k:'all',          l:'All' },
  { k:'big5',         l:'Big 5' },
  { k:'other_europe', l:'Other EU' },
  { k:'botola',       l:'Botola' },
  { k:'mena',         l:'MENA' },
  { k:'international',l:'International' },
];

export default function FixturesPage() {
  const [bucket, setBucket] = useState('all');
  const [marOnly, setMarOnly] = useState(false);
  const [view, setView] = useState('list');
  const [sortBy, setSortBy] = useState('date');
  const [calMonth, setCalMonth] = useState(new Date('2026-05-01'));
  const [openDay, setOpenDay] = useState(null);

  const filtered = useMemo(() => {
    return FIXTURES.filter(f => {
      const isInternational = f.competition.includes('FIFA') || f.competition.includes('AFCON') || f.home.id === 'mar';
      if (bucket === 'international' && !isInternational) return false;
      if (bucket !== 'all' && bucket !== 'international') {
        if (f.home.league !== bucket && f.away.league !== bucket) return false;
      }
      if (marOnly && (!f.homePlayers?.length && !f.awayPlayers?.length)) return false;
      return true;
    });
  }, [bucket, marOnly]);

  const grouped = useMemo(() => {
    if (sortBy === 'competition') {
      const map = {};
      filtered.forEach(f => { (map[f.competition] = map[f.competition] || []).push(f); });
      return Object.entries(map).sort(([a],[b]) => a.localeCompare(b));
    }
    if (sortBy === 'players') {
      const sorted = [...filtered].sort((a,b) =>
        ((b.homePlayers?.length||0)+(b.awayPlayers?.length||0)) - ((a.homePlayers?.length||0)+(a.awayPlayers?.length||0))
      );
      return [['By Atlas Lions involved', sorted]];
    }
    const map = {};
    filtered.forEach(f => { (map[f.date] = map[f.date] || []).push(f); });
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b));
  }, [filtered, sortBy]);

  const groupLabel = (key) => sortBy === 'date' ? fmtDateLong(key) : key;
  const liveCount = filtered.filter(f => f.status === 'live').length;

  return (
    <div className="fade-up">
      <div className="eyebrow" style={{ marginBottom:6 }}>Match Centre</div>
      <h1 style={{ fontSize:48, lineHeight:1, marginBottom:24 }}>FIXTURES</h1>

      {liveCount > 0 && (
        <Card padding={14} style={{ marginBottom:18, background:'linear-gradient(90deg, var(--color-red-soft), transparent)', borderColor:'rgba(193,18,31,0.4)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--color-red)' }} className="pulse-red"/>
            <strong style={{ fontFamily:'var(--font-mono)', letterSpacing:'0.16em', fontSize:12, color:'#E84856' }}>{liveCount} LIVE NOW</strong>
            <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>· Real Sociedad 1-2 Real Madrid · 73′ (Brahim Díaz)</span>
          </div>
        </Card>
      )}

      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {BUCKETS.map(b => (
            <button key={b.k} onClick={() => setBucket(b.k)} style={{
              padding:'6px 14px', borderRadius:'var(--radius-full)',
              background: bucket === b.k ? 'var(--color-red)' : 'var(--color-surface)',
              color: bucket === b.k ? '#fff' : 'var(--color-text-secondary)',
              border: `1px solid ${bucket === b.k ? 'var(--color-red)' : 'var(--color-border)'}`,
              fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 120ms ease',
            }}>{b.l}</button>
          ))}
        </div>
        <div style={{ marginInlineStart:'auto', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          {view === 'list' && (
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
              <option value="date">By date</option>
              <option value="competition">By competition</option>
              <option value="players">By Atlas Lions count</option>
            </select>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
            <span style={{ color:'var(--color-text-secondary)' }}>NT only</span>
            <Toggle checked={marOnly} onChange={setMarOnly}/>
          </div>
          <Tabs variant="pill" tabs={[{id:'list', label:'List'},{id:'calendar', label:'Calendar'}]} activeTab={view} onTabChange={setView}/>
        </div>
      </div>

      {/* Importance legend */}
      <div style={{ display:'flex', gap:16, marginBottom:18, flexWrap:'wrap', fontSize:11, color:'var(--color-text-secondary)' }}>
        {[['International','#E84856'],['Continental','var(--color-gold)'],['Cup','#48A89C'],['League','#94B0D6']].map(([l,c]) => (
          <span key={l} style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
            <span style={{ width:9, height:9, borderRadius:'50%', background:c }}/>{l}
          </span>
        ))}
      </div>

      {view === 'calendar' ? (
        <FixtureCalendar fixtures={filtered} month={calMonth} setMonth={setCalMonth} openDay={openDay} setOpenDay={setOpenDay}/>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          {grouped.map(([key, list]) => (
            <div key={key}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.02em' }}>{groupLabel(key)}</h3>
                <div style={{ flex:1, height:1, background:'var(--color-border)' }}/>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--color-text-tertiary)', letterSpacing:'0.1em' }}>{list.length} MATCHES</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {list.map(f => <FixtureCard key={f.id} fixture={f}/>)}
              </div>
            </div>
          ))}
          {grouped.length === 0 && <EmptyState icon="◌" title="No fixtures" description="No matches match the current filters."/>}
        </div>
      )}
    </div>
  );
}
