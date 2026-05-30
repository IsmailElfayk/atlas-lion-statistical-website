import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext.jsx';
import { useT } from '../context/LanguageContext.jsx';
import { Button, Card, Badge, PositionBadge, EligibilityBadge, DataQualityBadge, Flag, RatingChip, ClubLogo, PlayerPhoto, Checkbox, Tabs, Slider, EmptyState } from '../components/ui/index.jsx';
import { statusMeta } from '../data.js';
import { getPlayers } from '../api/index.js';

const POS_DISPLAY = { CDM: 'DM', CAM: 'AM', LWB: 'LB', RWB: 'RB', LM: 'CM', RM: 'CM', SS: 'ST', WB: 'CB' };

function adaptPlayer(p) {
  const club = p.currentClub || {};
  const league = club.league || {};
  return {
    id:      p.slug || String(p._id),
    name:    p.fullName,
    pos:     POS_DISPLAY[p.primaryPosition] || p.primaryPosition || 'CM',
    elig:    p.moroccoEligibility || 'eligible',
    rating:  p.latestRating ?? null,
    mvEur:   p.marketValueEur || 0,
    minutes: p.minutesCurrent || 0,
    dataQ:   p.dataQuality || 'none',
    bucket:  league.bucket || 'other_europe',
    age:     p.age || 0,
    foot:    p.preferredFoot || 'Right',
    status:  p.status || 'available',
    photoUrl: p.photoUrl,
    club: {
      name:       club.name || '',
      shortName:  club.shortName || (club.name || '').slice(0, 3).toUpperCase() || 'UNK',
      leagueName: league.name || '',
      country:    league.country || club.country || '',
      color:      club.color || '#444',
    },
  };
}

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

function PlayerSearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position:'relative', flex:1, minWidth:240, maxWidth:520 }}>
      <span style={{ position:'absolute', insetInlineStart:14, top:'50%', transform:'translateY(-50%)', color:'var(--color-text-tertiary)' }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
      </span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
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

function PlayerTable({ players, onRowClick, t }) {
  const headers = [
    t('players.col_player'), t('players.col_pos'), t('players.col_club'),
    t('players.col_league'), t('players.col_rating'), t('players.col_mv'),
    t('players.col_min'), t('players.col_data'), t('players.col_elig'),
  ];
  return (
    <Card padding={0} style={{ overflow:'hidden' }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--color-surface-2)', textAlign:'start' }}>
              {headers.map(h => (
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
  const { t } = useT();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    getPlayers({ limit: 200 })
      .then(res => setPlayers((res.data?.data || []).map(adaptPlayer)))
      .catch(err => console.error('[PlayersPage] fetch failed:', err?.response?.status, err?.message))
      .finally(() => setLoading(false));
  }, []);

  const rising = lens === 'rising';

  const countries = useMemo(() => {
    const counts = {};
    players.forEach(p => { counts[p.club.country] = (counts[p.club.country] || 0) + 1; });
    return Object.entries(counts).sort((a,b) => b[1]-a[1]).map(([c]) => c);
  }, [players]);

  const filtered = useMemo(() => {
    let list = players.filter(p => {
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
  }, [players, search, posFilter, bucketFilter, ageMax, qualityFilter, sort, rising, risingAge, eligFilter, countryFilter]);

  const toggleCompare = (id) => setCompareSel(sel => sel.includes(id) ? sel.filter(x => x !== id) : (sel.length >= 4 ? sel : [...sel, id]));
  const cardClick = (p) => { if (compareMode) toggleCompare(p.id); else navigate(`/players/${p.id}`); };

  const hasActiveFilters = posFilter || bucketFilter.length || qualityFilter.length || ageMax < 35;

  const lensOptions = [
    { k:'all', l: t('players.lens_all') },
    { k:'rising', l: t('players.lens_rising') },
  ];

  const eligOptions = [
    { k:'all', l: t('players.all') },
    { k:'eligible', l: t('players.eligible') },
    { k:'switchable', l: t('players.switchable') },
    { k:'capped', l: t('players.capped') },
  ];

  const bucketOptions = [
    { k:'big5', l: t('players.bucket_big5') },
    { k:'other_europe', l: t('players.bucket_other_eu') },
    { k:'botola', l: t('players.bucket_botola') },
    { k:'mena', l: t('players.bucket_mena') },
  ];

  return (
    <div className="fade-up">
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:16 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom:6, color: rising ? 'var(--color-gold)' : 'var(--color-text-secondary)' }}>
            {rising ? t('players.next_gen') : t('players.active_profiles').replace('{n}', players.length)}
          </div>
          <h1 style={{ fontSize:48, lineHeight:1 }}>{t('players.title')}</h1>
        </div>
      </div>

      {/* Lens switcher */}
      <div style={{ display:'flex', gap:6, marginBottom:18, borderBottom:'1px solid var(--color-border)' }}>
        {lensOptions.map(opt => (
          <button key={opt.k} onClick={() => setLens(opt.k)} style={{
            padding:'10px 4px', marginInlineEnd:18, fontSize:13, fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase',
            background:'transparent', border:0, cursor:'pointer',
            color: lens === opt.k ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            borderBottom: `2px solid ${lens === opt.k ? (opt.k === 'rising' ? 'var(--color-gold)' : 'var(--color-red)') : 'transparent'}`,
            marginBottom:-1, transition:'all 150ms ease',
          }}>{opt.l}</button>
        ))}
      </div>

      {rising && (
        <>
          <p style={{ fontSize:14, color:'var(--color-text-secondary)', maxWidth:680, marginBottom:18 }}>
            {t('players.rising_desc').replace('{age}', risingAge)}
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
              {eligOptions.map(e => (
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
                <strong style={{ color:'var(--color-gold)' }}>{t('players.article9_title')}</strong>{' '}
                <span style={{ color:'var(--color-text-secondary)', fontSize:13 }}>{t('players.article9_body')}</span>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Search + controls */}
      <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
        <PlayerSearchBar value={search} onChange={setSearch} placeholder={t('common.search')}/>
        <Button variant="secondary" onClick={() => setFiltersOpen(!filtersOpen)} icon={<span>⚙</span>}>
          {t('players.filters')} {hasActiveFilters ? <span style={{ marginInlineStart:6, padding:'1px 6px', background:'var(--color-red)', color:'#fff', borderRadius:4, fontSize:10 }}>●</span> : null}
        </Button>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectStyle}>
          <option value="rating">{t('players.sort_rating')}</option>
          <option value="mv">{t('players.sort_mv')}</option>
          <option value="age">{t('players.sort_age')}</option>
          <option value="minutes">{t('players.sort_minutes')}</option>
          <option value="name">{t('players.sort_name')}</option>
        </select>
        <Button variant={compareMode ? 'primary' : 'secondary'} onClick={() => { setCompareMode(m => !m); setCompareSel([]); }} icon={<span>⚖</span>}>
          {compareMode ? t('players.cancel_compare') : t('players.compare')}
        </Button>
        <Tabs variant="pill" tabs={[{id:'grid', label:t('players.grid')},{id:'table', label:t('players.table')}]} activeTab={view} onTabChange={setView}/>
      </div>

      {/* Country-of-club filter */}
      <div style={{ display:'flex', gap:6, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <span className="eyebrow" style={{ marginInlineEnd:4 }}>{t('players.club_country')}</span>
        <PosPill active={countryFilter === null} onClick={() => setCountryFilter(null)}>{t('players.all')}</PosPill>
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
              <div className="eyebrow" style={{ marginBottom:10 }}>{t('players.filter_position')}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                <PosPill active={posFilter === null} onClick={() => setPosFilter(null)}>{t('players.all')}</PosPill>
                {POSITIONS.map(p => <PosPill key={p} active={posFilter === p} onClick={() => setPosFilter(p)}>{p}</PosPill>)}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom:10 }}>{t('players.filter_bucket')}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {bucketOptions.map(b => (
                  <Checkbox key={b.k} checked={bucketFilter.includes(b.k)} onChange={(v) => setBucketFilter(v ? [...bucketFilter, b.k] : bucketFilter.filter(x => x !== b.k))} label={b.l}/>
                ))}
              </div>
            </div>
            <div>
              {!rising && <Slider min={18} max={40} value={ageMax} onChange={setAgeMax} label={t('players.filter_age_max')} unit="y"/>}
              {rising && <div style={{ fontSize:11, color:'var(--color-text-tertiary)', lineHeight:1.5 }}>{t('players.age_controlled')}</div>}
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom:10 }}>{t('players.filter_quality')}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {['event','rating','heuristic'].map(q => (
                  <Checkbox key={q} checked={qualityFilter.includes(q)} onChange={(v) => setQualityFilter(v ? [...qualityFilter, q] : qualityFilter.filter(x => x !== q))} label={<DataQualityBadge quality={q}/>}/>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:14 }}>
            <Button variant="ghost" size="sm" onClick={() => { setPosFilter(null); setBucketFilter([]); setQualityFilter([]); setAgeMax(35); }}>{t('players.reset_filters')}</Button>
          </div>
        </Card>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, fontSize:12, color:'var(--color-text-secondary)' }}>
        <span>{t('players.showing').replace('{count}', filtered.length).replace('{total}', players.length)}</span>
      </div>

      {loading ? (
        <EmptyState icon="◌" title={t('players.loading')} description={t('common.loading')}/>
      ) : filtered.length === 0 ? (
        <EmptyState icon="◌" title={t('players.no_match')} description={t('players.no_match_desc')}
          action={<Button variant="secondary" onClick={() => { setSearch(''); setPosFilter(null); setBucketFilter([]); setQualityFilter([]); setAgeMax(35); setCountryFilter(null); }}>{t('players.reset_all')}</Button>}/>
      ) : view === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:14, paddingBottom: compareMode ? 72 : 0 }}>
          {filtered.map(p => <PlayerCardCompact key={p.id} player={p} onClick={() => cardClick(p)} selectable={compareMode} selected={compareSel.includes(p.id)}/>)}
        </div>
      ) : (
        <PlayerTable players={filtered} onRowClick={(p) => cardClick(p)} t={t}/>
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
              const pl = players.find(p => p.id === id);
              return <div key={id} style={{ marginInlineStart: i===0?0:-8, zIndex:4-i }}><PlayerPhoto player={pl} size={28}/></div>;
            })}
          </div>
          <span style={{ fontSize:13, color:'var(--color-text-secondary)' }}>
            <strong style={{ color:'var(--color-text-primary)' }}>{compareSel.length}</strong> {compareSel.length < 2 ? `· ${t('players.selected_min2')}` : ''}
          </span>
          <Button variant="primary" size="sm" disabled={compareSel.length < 2} onClick={() => navigate(`/compare?players=${compareSel.join(',')}`)} iconRight={<span>→</span>}>
            {t('players.compare_n').replace('{n}', compareSel.length)}
          </Button>
        </div>
      )}

      <style>{`@media (max-width: 900px) { .filters-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
