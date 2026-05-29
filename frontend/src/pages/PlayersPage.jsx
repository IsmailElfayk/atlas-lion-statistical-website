import { useState, useMemo } from 'react';
import { useRouter } from '../context/RouterContext.jsx';
import { Button, Card, Badge, PositionBadge, EligibilityBadge, DataQualityBadge, Flag, RatingChip, ClubLogo, PlayerPhoto, Checkbox, Tabs, Slider, EmptyState } from '../components/ui/index.jsx';
import { PLAYERS, statusMeta } from '../data.js';

const selectStyle = {
  height:38, padding:'0 32px 0 14px', appearance:'none', WebkitAppearance:'none',
  background:'var(--color-surface) url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 12 12\' width=\'12\' height=\'12\'><path d=\'M2 4l4 4 4-4\' stroke=\'%239EA89F\' stroke-width=\'1.5\' fill=\'none\'/></svg>") no-repeat right 12px center',
  border:'1px solid var(--color-border-2)', borderRadius:6, color:'var(--color-text-primary)', fontSize:13, fontWeight:500, cursor:'pointer',
};

function PosPill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding:'5px 10px', borderRadius:'var(--radius-full)',
      background: active ? 'var(--color-red)' : 'transparent',
      color: active ? '#fff' : 'var(--color-text-secondary)',
      border: `1px solid ${active ? 'var(--color-red)' : 'var(--color-border-2)'}`,
      fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, letterSpacing:'0.04em',
      cursor:'pointer', transition:'all 120ms ease',
    }}>{children}</button>
  );
}

function PlayerSearchBar({ value, onChange }) {
  return (
    <div style={{ position:'relative', flex:1, minWidth:240, maxWidth:520 }}>
      <span style={{ position:'absolute', insetInlineStart:14, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-tertiary)' }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
      </span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search players, clubs…"
        style={{ width:'100%', height:38, paddingInlineStart:38, paddingInlineEnd: value ? 38 : 14, background:'var(--color-surface)', border:'1px solid var(--color-border-2)', borderRadius:6, fontSize:13, transition:'border-color 150ms ease', color:'var(--color-text-primary)' }}
        onFocus={(e) => e.target.style.borderColor = 'var(--color-red)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--color-border-2)'}
      />
      {value && (
        <button onClick={() => onChange('')} style={{ position:'absolute', insetInlineEnd:8, top:'50%', transform:'translateY(-50%)', width:22, height:22, borderRadius:4, border:0, background:'transparent', color:'var(--color-text-secondary)', cursor:'pointer', fontSize:14 }}>×</button>
      )}
    </div>
  );
}

function PlayerCardCompact({ player, onClick, selectable, selected }) {
  const unavailable = player.status && player.status !== 'available';
  const sMeta = unavailable ? statusMeta(player.status) : null;
  return (
    <Card interactive padding={0} onClick={onClick} style={{ overflow:'hidden', position:'relative', borderColor: selected ? 'var(--color-red)' : undefined, boxShadow: selected ? '0 0 0 2px var(--color-red)' : undefined }}>
      {selectable && (
        <div style={{ position:'absolute', top:10, insetInlineEnd:10, zIndex:3, width:22, height:22, borderRadius:'50%',
          background: selected ? 'var(--color-red)' : 'rgba(13,15,14,0.7)', border:`1.5px solid ${selected ? 'var(--color-red)' : 'var(--color-border-2)'}`,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          {selected && <svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M1 5l2.5 2.5L9 1.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
      )}
      <div style={{ position:'relative', aspectRatio:'1/1', background:`linear-gradient(160deg, ${player.club.color}33, var(--color-surface-2))`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ position:'absolute', top:10, insetInlineStart:10, display:'flex', gap:6, alignItems:'center' }}>
          <PositionBadge position={player.pos} size="sm"/>
        </div>
        {!selectable && (
          <div style={{ position:'absolute', top:10, insetInlineEnd:10 }}>
            <RatingChip rating={player.rating} size="md"/>
          </div>
        )}
        <PlayerPhoto player={player} size={130}/>
        <div style={{ position:'absolute', bottom:10, insetInlineStart:10 }}>
          <EligibilityBadge eligibility={player.elig}/>
        </div>
        {unavailable && (
          <div style={{ position:'absolute', bottom:10, insetInlineEnd:10 }}>
            <Badge color={sMeta.color} size="sm" style={{ gap:4 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:sMeta.dot, display:'inline-block' }}/>
              {sMeta.label.toUpperCase()}
            </Badge>
          </div>
        )}
      </div>
      <div style={{ padding:'12px 14px' }}>
        <div style={{ fontWeight:600, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{player.name}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6, fontSize:11.5, color:'var(--color-text-secondary)' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, minWidth:0, flex:1 }}>
            <ClubLogo club={player.club} size={14}/>
            <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{player.club.shortName}</span>
          </span>
          <span style={{ fontFamily:'var(--font-mono)' }}>{player.age}y</span>
        </div>
      </div>
    </Card>
  );
}

function PlayerTable({ players, onRowClick }) {
  return (
    <Card padding={0} style={{ overflow:'hidden' }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--color-surface-2)', textAlign:'start' }}>
              {['Player','Pos','Club','League','Rating','MV','Min','Data','Elig.'].map(h => (
                <th key={h} style={{ padding:'10px 14px', textAlign:'start', fontFamily:'var(--font-mono)', fontSize:9.5, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--color-text-secondary)', borderBottom:'1px solid var(--color-border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map(p => (
              <tr key={p.id} onClick={() => onRowClick(p)} style={{ borderBottom:'1px solid var(--color-border)', cursor:'pointer', transition:'background 120ms ease' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding:'10px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <PlayerPhoto player={p} size={32}/>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
                      <div style={{ fontSize:10, color:'var(--color-text-tertiary)' }}>{p.age}y · {p.foot}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding:'10px 14px' }}><PositionBadge position={p.pos} size="sm"/></td>
                <td style={{ padding:'10px 14px' }}>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12 }}>
                    <ClubLogo club={p.club} size={14}/>{p.club.shortName}
                  </span>
                </td>
                <td style={{ padding:'10px 14px', fontSize:12, color:'var(--color-text-secondary)' }}>{p.club.leagueName}</td>
                <td style={{ padding:'10px 14px' }}><RatingChip rating={p.rating} size="sm"/></td>
                <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', fontSize:12 }}>{p.mvEur >= 1e6 ? `€${(p.mvEur/1e6).toFixed(1)}M` : `€${(p.mvEur/1e3).toFixed(0)}K`}</td>
                <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--color-text-secondary)' }}>{p.minutes}</td>
                <td style={{ padding:'10px 14px' }}><DataQualityBadge quality={p.dataQ}/></td>
                <td style={{ padding:'10px 14px' }}><EligibilityBadge eligibility={p.elig}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const POSITIONS = ['GK','CB','RB','LB','DM','CM','AM','LW','RW','ST'];

export default function PlayersPage() {
  const { navigate } = useRouter();
  const [lens, setLens] = useState('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [posFilter, setPosFilter] = useState(null);
  const [bucketFilter, setBucketFilter] = useState([]);
  const [ageMax, setAgeMax] = useState(35);
  const [qualityFilter, setQualityFilter] = useState([]);
  const [risingAge, setRisingAge] = useState(23);
  const [eligFilter, setEligFilter] = useState('all');
  const [sort, setSort] = useState('rating');
  const [countryFilter, setCountryFilter] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSel, setCompareSel] = useState([]);

  const rising = lens === 'rising';

  const countries = useMemo(() => {
    const counts = {};
    PLAYERS.forEach(p => { counts[p.club.country] = (counts[p.club.country] || 0) + 1; });
    return Object.entries(counts).sort((a,b) => b[1]-a[1]).map(([c]) => c);
  }, []);

  const filtered = useMemo(() => {
    let list = PLAYERS.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.club.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (posFilter && p.pos !== posFilter) return false;
      if (bucketFilter.length && !bucketFilter.includes(p.bucket)) return false;
      if (qualityFilter.length && !qualityFilter.includes(p.dataQ)) return false;
      if (countryFilter && p.club.country !== countryFilter) return false;
      if (rising) {
        if (p.age > risingAge) return false;
        if (eligFilter !== 'all' && p.elig !== eligFilter) return false;
      } else {
        if (p.age > ageMax) return false;
      }
      return true;
    });
    if (sort === 'rating')   list.sort((a,b) => b.rating - a.rating);
    if (sort === 'mv')       list.sort((a,b) => b.mvEur - a.mvEur);
    if (sort === 'age')      list.sort((a,b) => a.age - b.age);
    if (sort === 'minutes')  list.sort((a,b) => b.minutes - a.minutes);
    if (sort === 'name')     list.sort((a,b) => a.name.localeCompare(b.name));
    return list;
  }, [search, posFilter, bucketFilter, ageMax, qualityFilter, sort, rising, risingAge, eligFilter, countryFilter]);

  const toggleCompare = (id) => setCompareSel(sel => sel.includes(id) ? sel.filter(x => x !== id) : (sel.length >= 4 ? sel : [...sel, id]));
  const cardClick = (p) => { if (compareMode) toggleCompare(p.id); else navigate(`/players/${p.id}`); };

  const hasActiveFilters = posFilter || bucketFilter.length || qualityFilter.length || ageMax < 35;

  return (
    <div className="fade-up">
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom:6, color: rising ? 'var(--color-gold)' : 'var(--color-text-secondary)' }}>
            {rising ? '★ The Next Generation' : `${PLAYERS.length} active profiles`}
          </div>
          <h1 style={{ fontSize:48, lineHeight:1 }}>PLAYERS</h1>
        </div>
      </div>

      {/* Lens switcher */}
      <div style={{ display:'flex', gap:6, marginBottom:18, borderBottom:'1px solid var(--color-border)' }}>
        {[{k:'all', l:'All Players'},{k:'rising', l:'★ Rising Stars'}].map(t => (
          <button key={t.k} onClick={() => setLens(t.k)} style={{
            padding:'10px 4px', marginInlineEnd:18, fontSize:13, fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase',
            background:'transparent', border:0, cursor:'pointer',
            color: lens === t.k ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            borderBottom: `2px solid ${lens === t.k ? (t.k === 'rising' ? 'var(--color-gold)' : 'var(--color-red)') : 'transparent'}`,
            marginBottom:-1, transition:'all 150ms ease',
          }}>{t.l}</button>
        ))}
      </div>

      {rising && (
        <>
          <p style={{ fontSize:14, color:'var(--color-text-secondary)', maxWidth:680, marginBottom:18 }}>
            Players under {risingAge} with Morocco-eligible nationality — including <strong style={{ color:'var(--color-gold)' }}>dual nationals potentially switchable under FIFA Article 9</strong>.
          </p>
          <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ display:'flex', gap:6 }}>
              {[19, 21, 23].map(a => (
                <button key={a} onClick={() => setRisingAge(a)} style={{
                  padding:'6px 14px', borderRadius:'var(--radius-full)',
                  background: risingAge === a ? 'var(--color-red)' : 'var(--color-surface)',
                  color: risingAge === a ? '#fff' : 'var(--color-text-secondary)',
                  border: `1px solid ${risingAge === a ? 'var(--color-red)' : 'var(--color-border)'}`,
                  fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, cursor:'pointer',
                }}>U-{a}</button>
              ))}
            </div>
            <div style={{ width:1, height:24, background:'var(--color-border)' }}/>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[{k:'all',l:'All'},{k:'eligible',l:'Eligible'},{k:'switchable',l:'Switchable'},{k:'capped',l:'Capped'}].map(e => (
                <button key={e.k} onClick={() => setEligFilter(e.k)} style={{
                  padding:'6px 14px', borderRadius:'var(--radius-full)',
                  background: eligFilter === e.k ? 'var(--color-surface-3)' : 'transparent',
                  color: eligFilter === e.k ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  border: `1px solid ${eligFilter === e.k ? 'var(--color-border-2)' : 'var(--color-border)'}`,
                  fontSize:12, fontWeight:600, cursor:'pointer',
                }}>{e.l}</button>
              ))}
            </div>
          </div>
          <Card padding={14} style={{ marginBottom:18, background:'linear-gradient(90deg, var(--color-gold-soft), transparent)', borderColor:'rgba(212,175,55,0.35)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ fontSize:22 }}>⚡</div>
              <div style={{ flex:1 }}>
                <strong style={{ color:'var(--color-gold)' }}>FIFA Article 9 · Eligibility data is community-sourced.</strong>{' '}
                <span style={{ color:'var(--color-text-secondary)', fontSize:13 }}>Players who hold Moroccan nationality and have not played a competitive senior match for another association can switch. Always verify with FRMF.</span>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Search + controls */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
        <PlayerSearchBar value={search} onChange={setSearch}/>
        <Button variant="secondary" onClick={() => setFiltersOpen(!filtersOpen)} icon={<span>⚙</span>}>
          Filters {hasActiveFilters ? <span style={{ marginInlineStart:6, padding:'1px 6px', background:'var(--color-red)', color:'#fff', borderRadius:4, fontSize:10 }}>●</span> : null}
        </Button>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectStyle}>
          <option value="rating">Rating ↓</option>
          <option value="mv">Market value ↓</option>
          <option value="age">Age ↑</option>
          <option value="minutes">Minutes ↓</option>
          <option value="name">Name A→Z</option>
        </select>
        <Button variant={compareMode ? 'primary' : 'secondary'} onClick={() => { setCompareMode(m => !m); setCompareSel([]); }} icon={<span>⚖</span>}>
          {compareMode ? 'Cancel compare' : 'Compare'}
        </Button>
        <Tabs variant="pill" tabs={[{id:'grid', label:'Grid'},{id:'table', label:'Table'}]} activeTab={view} onTabChange={setView}/>
      </div>

      {/* Country-of-club filter */}
      <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <span className="eyebrow" style={{ marginInlineEnd:4 }}>Club country</span>
        <PosPill active={countryFilter === null} onClick={() => setCountryFilter(null)}>All</PosPill>
        {countries.map(c => (
          <button key={c} onClick={() => setCountryFilter(countryFilter === c ? null : c)} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', borderRadius:'var(--radius-full)',
            background: countryFilter === c ? 'var(--color-red)' : 'transparent',
            color: countryFilter === c ? '#fff' : 'var(--color-text-secondary)',
            border: `1px solid ${countryFilter === c ? 'var(--color-red)' : 'var(--color-border-2)'}`,
            fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, letterSpacing:'0.04em', cursor:'pointer', transition:'all 120ms ease',
          }}><Flag country={c} size="sm"/>{c}</button>
        ))}
      </div>

      {filtersOpen && (
        <Card padding={18} style={{ marginBottom:18 }} className="fade-up">
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1.4fr 1fr 1fr', gap:24 }} className="filters-grid">
            <div>
              <div className="eyebrow" style={{ marginBottom:10 }}>Position</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                <PosPill active={posFilter === null} onClick={() => setPosFilter(null)}>All</PosPill>
                {POSITIONS.map(p => <PosPill key={p} active={posFilter === p} onClick={() => setPosFilter(p)}>{p}</PosPill>)}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom:10 }}>League bucket</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[{k:'big5', l:'Big 5'},{k:'other_europe', l:'Other EU'},{k:'botola', l:'Botola'},{k:'mena', l:'MENA'}].map(b => (
                  <Checkbox key={b.k} checked={bucketFilter.includes(b.k)} onChange={(v) => setBucketFilter(v ? [...bucketFilter, b.k] : bucketFilter.filter(x => x !== b.k))} label={b.l}/>
                ))}
              </div>
            </div>
            <div>
              {!rising && <Slider min={18} max={40} value={ageMax} onChange={setAgeMax} label="Age max" unit="y"/>}
              {rising && <div style={{ fontSize:11, color:'var(--color-text-tertiary)', lineHeight:1.5 }}>Age is controlled by the U-19/21/23 filter above in Rising Stars view.</div>}
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom:10 }}>Data quality</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {['event','rating','heuristic'].map(q => (
                  <Checkbox key={q} checked={qualityFilter.includes(q)} onChange={(v) => setQualityFilter(v ? [...qualityFilter, q] : qualityFilter.filter(x => x !== q))} label={<DataQualityBadge quality={q}/>}/>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:14 }}>
            <Button variant="ghost" size="sm" onClick={() => { setPosFilter(null); setBucketFilter([]); setQualityFilter([]); setAgeMax(35); }}>Reset filters</Button>
          </div>
        </Card>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, fontSize:12, color:'var(--color-text-secondary)' }}>
        <span>Showing <strong style={{ color:'var(--color-text-primary)' }}>{filtered.length}</strong> of {PLAYERS.length} players</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="◌" title="No players match" description="Try widening filters or clearing the search."
          action={<Button variant="secondary" onClick={() => { setSearch(''); setPosFilter(null); setBucketFilter([]); setQualityFilter([]); setAgeMax(35); setCountryFilter(null); }}>Reset all</Button>}/>
      ) : view === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:14, paddingBottom: compareMode ? 72 : 0 }}>
          {filtered.map(p => <PlayerCardCompact key={p.id} player={p} onClick={() => cardClick(p)} selectable={compareMode} selected={compareSel.includes(p.id)}/>)}
        </div>
      ) : (
        <PlayerTable players={filtered} onRowClick={(p) => cardClick(p)}/>
      )}

      {compareMode && compareSel.length > 0 && (
        <div style={{
          position:'fixed', insetInlineStart:'50%', transform:'translateX(-50%)', bottom:24, zIndex:120,
          display:'flex', alignItems:'center', gap:16, padding:'12px 16px 12px 20px',
          background:'var(--color-surface)', border:'1px solid var(--color-border-2)', borderRadius:'var(--radius-full)',
          boxShadow:'var(--shadow-modal)',
        }} className="fade-up">
          <div style={{ display:'flex', alignItems:'center' }}>
            {compareSel.slice(0,4).map((id, i) => {
              const pl = PLAYERS.find(p => p.id === id);
              return <div key={id} style={{ marginInlineStart: i===0?0:-8, zIndex:4-i }}><PlayerPhoto player={pl} size={28}/></div>;
            })}
          </div>
          <span style={{ fontSize:13, color:'var(--color-text-secondary)' }}>
            <strong style={{ color:'var(--color-text-primary)' }}>{compareSel.length}</strong> selected{compareSel.length < 2 ? ' · pick at least 2' : ''}
          </span>
          <Button variant="primary" size="sm" disabled={compareSel.length < 2} onClick={() => navigate(`/compare?players=${compareSel.join(',')}`)} iconRight={<span>→</span>}>
            Compare {compareSel.length}
          </Button>
        </div>
      )}

      <style>{`@media (max-width: 900px) { .filters-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
