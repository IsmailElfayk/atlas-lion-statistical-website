import { useState, useMemo } from 'react';
import { useRouter } from '../context/RouterContext.jsx';
import { useT } from '../context/LanguageContext.jsx';
import { Button, Card, PositionBadge, RatingChip, ClubLogo, PlayerPhoto, Modal } from '../components/ui/index.jsx';
import { CompareRadar } from '../components/player/Charts.jsx';
import { PLAYERS, fmtMV } from '../data.js';

function PlayerSearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position:'relative', width:'100%' }}>
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

const SLOT_COLORS = ['#C1121F','#007A3D','#D4AF37','#9FB0CC'];

export default function ComparePage() {
  const { params } = useRouter();
  const { t } = useT();
  const initial = (params?.players || '').split(',').filter(Boolean);
  const [selected, setSelected] = useState(initial.length ? initial : ['hakimi', 'mazraoui']);
  const [pickerOpen, setPickerOpen] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const METRICS = [
    {key:'rating',  label:t('compare.metric_rating'),  max:10},
    {key:'offence', label:t('compare.metric_attack'),  max:1},
    {key:'defence', label:t('compare.metric_defence'), max:1},
    {key:'passing', label:t('compare.metric_passing'), max:1},
    {key:'dribble', label:t('compare.metric_dribble'), max:1},
    {key:'minutes', label:t('compare.metric_minutes'), max:2000},
    {key:'value',   label:t('compare.metric_value'),   max:100_000_000},
    {key:'xt',      label:t('compare.metric_xt'),      max:1},
  ];

  const players = selected.map(id => PLAYERS.find(p => p.id === id)).filter(Boolean);

  const data = useMemo(() => {
    const out = {};
    players.forEach(p => {
      const h = Array.from(p.id).reduce((a,c) => a + c.charCodeAt(0), 0);
      out[p.id] = {
        rating:  p.rating,
        offence: ((h % 71) / 100) + 0.3,
        defence: ((h % 53) / 100) + 0.2,
        passing: ((h % 61) / 100) + 0.3,
        dribble: ((h % 47) / 100) + 0.35,
        minutes: p.minutes,
        value:   p.mvEur,
        xt:      ((h % 37) / 100) + 0.4,
      };
    });
    return out;
  }, [players]);

  function addPlayer(id) { setSelected([...selected, id]); setPickerOpen(null); setPickerSearch(''); }
  function removePlayer(id) { setSelected(selected.filter(p => p !== id)); }

  const formatVal = (metric, v) => {
    if (metric.key === 'value') return fmtMV(v);
    if (metric.key === 'minutes') return v.toLocaleString();
    return v.toFixed(2);
  };

  return (
    <div className="fade-up">
      <div className="eyebrow" style={{ marginBottom:6 }}>{t('compare.eyebrow')}</div>
      <h1 style={{ fontSize:48, lineHeight:1, marginBottom:24 }}>{t('compare.title')}</h1>

      {/* Slots */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:28 }} className="compare-slots">
        {[0,1,2,3].map(i => {
          const p = players[i];
          if (p) return (
            <Card key={i} padding={16}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <PositionBadge position={p.pos} size="sm"/>
                <button onClick={() => removePlayer(p.id)} style={{ width:22, height:22, border:0, background:'var(--color-surface-2)', borderRadius:4, color:'var(--color-text-secondary)', cursor:'pointer' }}>×</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                <PlayerPhoto player={p} size={64} ring={SLOT_COLORS[i]}/>
                <div style={{ fontWeight:600, fontSize:13, textAlign:'center' }}>{p.name}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--color-text-secondary)' }}>
                  <ClubLogo club={p.club} size={12}/>{p.club.shortName}
                </div>
                <RatingChip rating={p.rating} size="md"/>
              </div>
            </Card>
          );
          if (i > players.length) return <div key={i}/>;
          return (
            <button key={i} onClick={() => setPickerOpen(i)} style={{
              minHeight:180, border:'1.5px dashed var(--color-border-2)', background:'transparent', borderRadius:'var(--radius-lg)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
              color:'var(--color-text-secondary)', cursor:'pointer', transition:'all 150ms ease',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-red)'; e.currentTarget.style.background = 'var(--color-red-soft)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ fontSize:32, color:'var(--color-text-tertiary)' }}>+</div>
              <div style={{ fontSize:12, letterSpacing:'0.04em' }}>{t('compare.add_player')}</div>
            </button>
          );
        })}
      </div>

      {players.length >= 2 && (
        <div style={{ display:'grid', gridTemplateColumns:'460px 1fr', gap:24 }} className="compare-grid">
          <Card>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.02em', marginBottom:14 }}>{t('compare.radar_title')}</h3>
            <CompareRadar players={players} metrics={METRICS.slice(0,7)} data={data}/>
          </Card>
          <Card padding={0}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--color-border)' }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.02em' }}>{t('compare.sidebyside_title')}</h3>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'var(--color-surface-2)' }}>
                  <th style={{ padding:'10px 14px', textAlign:'start', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--color-text-secondary)' }}>{t('compare.metric')}</th>
                  {players.map((p, i) => (
                    <th key={p.id} style={{ padding:'10px 14px', textAlign:'center', fontSize:12 }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                        <span style={{ width:8, height:8, borderRadius:'50%', background:SLOT_COLORS[i], flexShrink:0 }}/>
                        {p.name.split(' ').slice(-1)[0]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map(m => {
                  const vals = players.map(p => data[p.id]?.[m.key] || 0);
                  const best = Math.max(...vals);
                  return (
                    <tr key={m.key} style={{ borderTop:'1px solid var(--color-border)' }}>
                      <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)', fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.06em', textTransform:'uppercase' }}>{m.label}</td>
                      {players.map((p, i) => {
                        const v = vals[i];
                        const isBest = v === best && players.length > 1;
                        return (
                          <td key={p.id} style={{ padding:'10px 14px', textAlign:'center', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:600, color: isBest ? 'var(--color-gold)' : 'var(--color-text-primary)' }}>
                            {formatVal(m, v)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding:'12px 20px', borderTop:'1px solid var(--color-border)', fontSize:11, color:'var(--color-text-tertiary)', fontStyle:'italic' }}>
              {t('compare.footnote')}
            </div>
          </Card>
        </div>
      )}

      {players.length < 2 && (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'var(--color-text-secondary)', fontSize:14 }}>
          {t('compare.need_two')}
        </div>
      )}

      <Modal isOpen={pickerOpen !== null} onClose={() => setPickerOpen(null)} title={t('compare.add_player')} subtitle={t('compare.picker_subtitle')} size="md">
        <div style={{ padding:'14px 20px' }}>
          <PlayerSearchBar value={pickerSearch} onChange={setPickerSearch} placeholder={t('common.search')}/>
        </div>
        <div style={{ maxHeight:'48vh', overflowY:'auto' }}>
          {PLAYERS.filter(p => !selected.includes(p.id) && (!pickerSearch || p.name.toLowerCase().includes(pickerSearch.toLowerCase()))).slice(0, 20).map(p => (
            <div key={p.id} onClick={() => addPlayer(p.id)} style={{ padding:'10px 24px', display:'flex', alignItems:'center', gap:12, cursor:'pointer', borderTop:'1px solid var(--color-border)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <PlayerPhoto player={p} size={32}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
                <div style={{ fontSize:11, color:'var(--color-text-secondary)' }}>{p.club.name} · {p.club.leagueName}</div>
              </div>
              <PositionBadge position={p.pos} size="sm"/>
              <RatingChip rating={p.rating} size="sm"/>
            </div>
          ))}
        </div>
      </Modal>

      <style>{`
        @media (max-width: 900px) {
          .compare-slots { grid-template-columns: repeat(2, 1fr) !important; }
          .compare-grid  { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
