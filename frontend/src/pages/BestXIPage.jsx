import { useState, useMemo, useEffect, useRef } from 'react';
import { useT } from '../context/LanguageContext.jsx';
import { Button, Card, Checkbox, Slider, Spinner } from '../components/ui/index.jsx';
import { PitchView, SubstitutesList } from '../components/bestxi/PitchView.jsx';
import { getBestXI } from '../api/index.js';

// Slot coordinates for mini formation preview cards
const FORMATION_COORDS = {
  '4-3-3':   [{x:340,y:430},{x:120,y:340},{x:260,y:355},{x:420,y:355},{x:560,y:340},{x:200,y:240},{x:340,y:255},{x:480,y:240},{x:140,y:120},{x:340,y:90},{x:540,y:120}],
  '4-4-2':   [{x:340,y:430},{x:120,y:340},{x:260,y:355},{x:420,y:355},{x:560,y:340},{x:130,y:230},{x:270,y:250},{x:410,y:250},{x:550,y:230},{x:260,y:110},{x:420,y:110}],
  '4-2-3-1': [{x:340,y:430},{x:120,y:340},{x:260,y:355},{x:420,y:355},{x:560,y:340},{x:260,y:260},{x:420,y:260},{x:140,y:160},{x:340,y:180},{x:540,y:160},{x:340,y:80}],
  '3-5-2':   [{x:340,y:430},{x:180,y:355},{x:340,y:360},{x:500,y:355},{x:90,y:250},{x:230,y:260},{x:340,y:280},{x:450,y:260},{x:590,y:250},{x:260,y:110},{x:420,y:110}],
  '3-4-3':   [{x:340,y:430},{x:180,y:355},{x:340,y:360},{x:500,y:355},{x:90,y:255},{x:260,y:260},{x:420,y:260},{x:590,y:255},{x:160,y:120},{x:340,y:90},{x:520,y:120}],
  '5-4-1':   [{x:340,y:430},{x:90,y:340},{x:220,y:360},{x:340,y:365},{x:460,y:360},{x:590,y:340},{x:140,y:240},{x:270,y:260},{x:410,y:260},{x:540,y:240},{x:340,y:100}],
  '5-3-2':   [{x:340,y:430},{x:80,y:330},{x:215,y:360},{x:340,y:365},{x:465,y:360},{x:600,y:330},{x:230,y:240},{x:340,y:258},{x:450,y:240},{x:265,y:105},{x:415,y:105}],
  '4-1-4-1': [{x:340,y:430},{x:120,y:345},{x:260,y:358},{x:420,y:358},{x:560,y:345},{x:340,y:285},{x:120,y:185},{x:270,y:200},{x:410,y:200},{x:560,y:185},{x:340,y:90}],
};
const FORMATION_NAMES = Object.keys(FORMATION_COORDS);
const ALL_BUCKETS = ['big5','other_europe','botola','mena','americas','world'];

function statusMeta(status, t) {
  const map = {
    doubtful:  { label: t('bestxi.status_doubtful'),  color:'var(--color-gold)' },
    injured:   { label: t('bestxi.status_injured'),   color:'#E05252' },
    suspended: { label: t('bestxi.status_suspended'), color:'#E05252' },
  };
  return map[status] || { label: t('bestxi.status_unknown'), color: 'var(--color-text-secondary)' };
}

const miniLinkStyle = {
  background:'transparent', border:0, cursor:'pointer', padding:0,
  fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, letterSpacing:'0.08em',
  textTransform:'uppercase', color:'var(--color-text-secondary)',
};

function FormationCard({ formation, active, onClick }) {
  const slots = FORMATION_COORDS[formation] || [];
  return (
    <button onClick={onClick} style={{
      padding:'10px 6px 8px', border:`1.5px solid ${active ? 'var(--color-red)' : 'var(--color-border)'}`,
      background: active ? 'var(--color-red-soft)' : 'var(--color-surface-2)',
      borderRadius:6, cursor:'pointer', transition:'all 150ms ease',
      boxShadow: active ? '0 0 0 3px rgba(193,18,31,0.18)' : 'none',
    }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:18, color: active ? '#fff' : 'var(--color-text-primary)', letterSpacing:'0.04em' }}>{formation}</div>
      <svg viewBox="0 0 60 80" width="100%" height="40" style={{ marginTop:2 }}>
        <rect x="2" y="2" width="56" height="76" rx="3" fill="none" stroke="var(--color-pitch-line)" strokeWidth="0.6"/>
        <line x1="2" y1="40" x2="58" y2="40" stroke="var(--color-pitch-line)" strokeWidth="0.5"/>
        {slots.map((s, i) => (
          <circle key={i} cx={2 + (s.x / 680) * 56} cy={2 + (s.y / 480) * 76} r="2"
            fill={active ? 'var(--color-red)' : 'var(--color-text-secondary)'}/>
        ))}
      </svg>
    </button>
  );
}

function MethodOption({ active, onClick, title, subtitle }) {
  return (
    <button onClick={onClick} style={{
      padding:'12px 12px', textAlign:'start',
      background: active ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
      border: `1.5px solid ${active ? 'var(--color-red)' : 'var(--color-border)'}`,
      borderRadius:6, cursor:'pointer', transition:'all 150ms ease',
    }}>
      <div style={{ fontSize:13, fontWeight:600, color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{title}</div>
      <div style={{ fontSize:10.5, color:'var(--color-text-tertiary)', marginTop:3, fontFamily:'var(--font-mono)', letterSpacing:'0.04em' }}>{subtitle}</div>
    </button>
  );
}

function Detail({ label, value, mono = true }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom:3, fontSize:9 }}>{label}</div>
      <div style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)', fontSize:13, fontWeight:600, color:'var(--color-text-primary)', textTransform: mono ? 'none' : 'capitalize' }}>{value}</div>
    </div>
  );
}

export default function BestXIPage() {
  const { t } = useT();
  const [formation, setFormation] = useState('4-3-3');
  const [window_, setWindow_] = useState(30);
  const [buckets, setBuckets] = useState(['big5','other_europe','botola','mena']);
  const [method, setMethod] = useState('commercial');
  const [minMinutes, setMinMinutes] = useState(90);
  const [activeSlot, setActiveSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState(0);
  const [apiResult, setApiResult] = useState(null);
  const [lineup, setLineup] = useState(null);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef(null);

  // Fetch from API whenever any parameter changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActiveSlot(null);

    getBestXI({
      formation,
      window: window_,
      buckets: buckets.join(','),
      ratingMethod: method,
      minMinutes,
    })
      .then(res => {
        if (!cancelled) {
          setApiResult(res.data);
          setLineup(null);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('[Atlas] getBestXI error', err);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [formation, window_, buckets, method, minMinutes, seed]);

  const baseXI = apiResult?.data?.startingXI || [];
  const xi = lineup || baseXI;

  const edited = useMemo(() => {
    if (!lineup || !baseXI.length) return false;
    return lineup.some((s, i) => (s.player?.slug ?? null) !== (baseXI[i]?.player?.slug ?? null));
  }, [lineup, baseXI]);

  const regenerate = () => setSeed(s => s + 1);

  const autoFill = () => { setLineup(null); setActiveSlot(null); };

  const exportPNG = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const node = exportRef.current;
      node.style.display = 'block';
      await new Promise(r => setTimeout(r, 120));
      const dataUrl = await toPng(node, { pixelRatio:2, backgroundColor:'#0D0F0E', cacheBust:true, skipFonts:true });
      node.style.display = 'none';
      const a = document.createElement('a');
      a.download = `atlas-lions-best-xi-${formation}-${window_}d.png`;
      a.href = dataUrl; a.click();
    } catch (err) {
      console.error('[Atlas] export failed', err);
      if (exportRef.current) exportRef.current.style.display = 'none';
    } finally {
      setExporting(false);
    }
  };

  const handleSwap = (newPlayer) => {
    if (activeSlot == null) return;
    setLineup(prev => {
      const cur = (prev || baseXI).map(s => ({ ...s }));
      const existingIdx = cur.findIndex(s => s.player?.slug === newPlayer.slug);
      const displaced = cur[activeSlot].player;
      cur[activeSlot] = { ...cur[activeSlot], player: newPlayer };
      if (existingIdx >= 0 && existingIdx !== activeSlot) {
        cur[existingIdx] = { ...cur[existingIdx], player: displaced };
      }
      return cur;
    });
  };

  const heuristicWarning = method === 'custom' && (buckets.includes('botola') || buckets.includes('mena'));

  // Subs come from the API's original slot data; filter out whoever is currently the starter
  const activeSlotData = useMemo(() => {
    if (activeSlot == null || !xi.length) return null;
    const base = xi[activeSlot];
    const originalSubs = apiResult?.data?.startingXI?.[activeSlot]?.subs || [];
    const currentStarterId = base.player?.slug;
    const subs = originalSubs.filter(p => p.slug !== currentStarterId);
    return { ...base, subs };
  }, [activeSlot, xi, apiResult]);

  const unavailableStarters = useMemo(
    () => xi.filter(s => s.player?.status && s.player.status !== 'available'),
    [xi]
  );

  const meanRating = xi.length
    ? (xi.reduce((s, x) => s + (x.player?.avgRating || 0), 0) / 11).toFixed(2)
    : '—';
  const eventCount = xi.filter(x => x.player?.dataQuality === 'event').length;
  const candidateCount = apiResult?.meta?.candidateCount ?? '—';

  return (
    <div className="fade-up">
      <div style={{ marginBottom:28 }}>
        <div className="eyebrow" style={{ marginBottom:6, color:'var(--color-red)' }}>{t('bestxi.flagship')}</div>
        <h1 style={{ fontSize:56, lineHeight:1, marginBottom:12 }}>{t('bestxi.page_title')}</h1>
        <p style={{ fontSize:15, color:'var(--color-text-secondary)', maxWidth:680 }}>
          {t('bestxi.description')}
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:24 }} className="best-xi-grid">

        {/* CONTROLS */}
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <Card padding={18}>
            <div className="eyebrow" style={{ marginBottom:12 }}>{t('bestxi.formation')}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
              {FORMATION_NAMES.map(f => (
                <FormationCard key={f} formation={f} active={formation === f} onClick={() => setFormation(f)}/>
              ))}
            </div>
          </Card>

          <Card padding={18}>
            <div className="eyebrow" style={{ marginBottom:12 }}>{t('bestxi.window')}</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:6 }}>
              {[15,30,45,60,75,90].map(d => (
                <button key={d} onClick={() => setWindow_(d)} style={{
                  padding:'10px 4px', border:0, borderRadius:6, cursor:'pointer',
                  background: window_ === d ? 'var(--color-red)' : 'var(--color-surface-2)',
                  color: window_ === d ? '#fff' : 'var(--color-text-primary)',
                  transition:'all 150ms ease',
                }}>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.01em' }}>{d}</div>
                  <div style={{ fontSize:9, color: window_ === d ? 'rgba(255,255,255,0.85)' : 'var(--color-text-tertiary)', fontFamily:'var(--font-mono)', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:1 }}>
                    {d <= 15 ? t('bestxi.window_2mw') : d <= 30 ? t('bestxi.window_1mo') : d <= 60 ? t('bestxi.window_2mo') : t('bestxi.window_3mo')}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card padding={18}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div className="eyebrow">{t('bestxi.league_filter')}</div>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => setBuckets([...ALL_BUCKETS])} style={miniLinkStyle}>{t('bestxi.bucket_all')}</button>
                <span style={{ color:'var(--color-border-2)' }}>·</span>
                <button onClick={() => setBuckets(['big5'])} style={miniLinkStyle}>{t('bestxi.bucket_clear')}</button>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { k:'big5',         l:'Big 5 🏆',   n:9 },
                { k:'other_europe', l:'Other EU',   n:7 },
                { k:'botola',       l:'Botola 🇲🇦', n:6 },
                { k:'mena',         l:'MENA',       n:5 },
                { k:'americas',     l:'Americas',   n:2 },
                { k:'world',        l:'Rest',       n:1 },
              ].map(b => {
                const only = buckets.length === 1 && buckets[0] === b.k;
                return (
                  <Checkbox key={b.k}
                    checked={buckets.includes(b.k)}
                    disabled={only}
                    onChange={(v) => setBuckets(v ? [...buckets, b.k] : (buckets.length > 1 ? buckets.filter(x => x !== b.k) : buckets))}
                    label={<span>{b.l} <span style={{ color:'var(--color-text-tertiary)', fontFamily:'var(--font-mono)', fontSize:11 }}>{b.n}</span></span>}
                  />
                );
              })}
            </div>
          </Card>

          <Card padding={18}>
            <div className="eyebrow" style={{ marginBottom:12 }}>{t('bestxi.rating_method')}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <MethodOption active={method === 'commercial'} onClick={() => setMethod('commercial')} title={t('bestxi.method_commercial_title')} subtitle={t('bestxi.method_commercial_sub')}/>
              <MethodOption active={method === 'custom'} onClick={() => setMethod('custom')} title={t('bestxi.method_custom_title')} subtitle={t('bestxi.method_custom_sub')}/>
            </div>
            {heuristicWarning && (
              <div style={{ marginTop:12, padding:'10px 12px', background:'var(--color-gold-soft)', border:'1px solid rgba(212,175,55,0.35)', borderRadius:6, fontSize:11.5, color:'#E2C24A', lineHeight:1.5 }}>
                <strong>⚡</strong> {t('bestxi.heuristic_warning')}
              </div>
            )}
          </Card>

          <Card padding={18}>
            <Slider min={45} max={180} step={45} value={minMinutes} onChange={setMinMinutes} label={t('bestxi.min_minutes')} unit="′"/>
            <div style={{ fontSize:11, color:'var(--color-text-tertiary)', marginTop:6 }}>{t('bestxi.min_minutes_note')}</div>
          </Card>

          <Button variant="primary" size="lg" loading={loading} onClick={regenerate} style={{ width:'100%' }}>
            {loading ? t('bestxi.optimising') : t('bestxi.generate')}
          </Button>
        </div>

        {/* PITCH */}
        <div>
          {unavailableStarters.length > 0 && (
            <div style={{ marginBottom:16, padding:'12px 16px', background:'var(--color-gold-soft)', border:'1px solid rgba(212,175,55,0.4)', borderRadius:'var(--radius-md)', display:'flex', alignItems:'center', gap:12 }} className="fade-up">
              <span style={{ fontSize:18 }}>⚠</span>
              <div style={{ flex:1, fontSize:13, color:'var(--color-text-primary)', lineHeight:1.5 }}>
                {unavailableStarters.map((s, i) => {
                  const meta = statusMeta(s.player.status, t);
                  const lastName = (s.player.fullName || s.player.name || '').split(' ').slice(-1)[0];
                  return (
                    <span key={s.player.slug || i}>
                      {i > 0 && <span style={{ color:'var(--color-text-tertiary)' }}> · </span>}
                      <strong>{lastName}</strong>{' '}
                      {t('bestxi.player_status_alert').replace('{slot}', s.slot).replace('{status}', meta.label.toLowerCase())}
                    </span>
                  );
                })}
                <span style={{ color:'var(--color-text-secondary)' }}> — {t('bestxi.click_swap')}.</span>
              </div>
            </div>
          )}

          <Card padding={0} style={{ overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--color-border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div>
                  <div className="eyebrow">{edited ? t('bestxi.manually_edited') : t('bestxi.optimised')}</div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.02em', display:'flex', alignItems:'center', gap:10 }}>
                    {formation} · {window_}D · {candidateCount} {t('bestxi.eligible')}
                    {edited && <span style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, letterSpacing:'0.1em', color:'var(--color-gold)', background:'var(--color-gold-soft)', border:'1px solid rgba(212,175,55,0.4)', padding:'2px 7px', borderRadius:4 }}>EDITED</span>}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <Button variant={edited ? 'secondary' : 'green'} size="sm" onClick={autoFill} icon={<span>{edited ? '↺' : '⚡'}</span>}>{edited ? t('bestxi.reset_optimal') : t('bestxi.autofill')}</Button>
                <Button variant="secondary" size="sm" loading={exporting} onClick={exportPNG} icon={<span>↓</span>}>{t('bestxi.export_png')}</Button>
                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => alert('Link copied'))} iconRight={<span>↗</span>}>{t('bestxi.share_xi')}</Button>
              </div>
            </div>
            {loading ? (
              <div style={{ aspectRatio:'680 / 480', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--color-pitch-grass)' }}>
                <Spinner size="lg"/>
              </div>
            ) : (
              <PitchView formation={formation} startingXI={xi} activeSlot={activeSlot} onSlotClick={(i) => setActiveSlot(i)}/>
            )}
          </Card>

          <Card padding={18} style={{ marginTop:16 }}>
            <details>
              <summary style={{ cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--color-text-primary)', userSelect:'none' }}>
                {t('bestxi.optimiser_details')}
              </summary>
              <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, fontSize:12 }}>
                <Detail label={t('bestxi.detail_formation')} value={formation}/>
                <Detail label={t('bestxi.detail_window')} value={`${window_} ${t('bestxi.detail_days')}`}/>
                <Detail label={t('bestxi.detail_method')} value={method === 'commercial' ? 'Sofascore' : 'xT/VAEP'}/>
                <Detail label={t('bestxi.detail_min_minutes')} value={`${minMinutes}′`}/>
                <Detail label={t('bestxi.detail_buckets')} value={buckets.join(', ')} mono={false}/>
                <Detail label={t('bestxi.detail_pool')} value={String(candidateCount)}/>
                <Detail label={t('bestxi.detail_mean_rating')} value={meanRating}/>
                <Detail label={t('bestxi.detail_data_quality')} value={`${eventCount}/11`}/>
              </div>
              <div style={{ marginTop:16, padding:'10px 12px', background:'var(--color-surface-2)', borderInlineStart:'3px solid var(--color-gold)', borderRadius:4, fontSize:11.5, color:'var(--color-text-secondary)', fontStyle:'italic' }}>
                <strong style={{ color:'var(--color-gold)' }}>{t('bestxi.caveat_label')}:</strong> {t('bestxi.caveat')} {t('bestxi.caveat_suffix')}
              </div>
            </details>
          </Card>
        </div>
      </div>

      {/* Off-screen export view */}
      <div ref={exportRef} style={{ display:'none', position:'fixed', insetInlineStart:-99999, top:0, width:760, background:'var(--color-bg)', padding:28, zIndex:-1 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:26, letterSpacing:'0.04em', color:'var(--color-text-primary)' }}>ATLAS LIONS — BEST XI</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.14em', color:'var(--color-text-secondary)', marginTop:2 }}>{formation} · LAST {window_} DAYS</div>
          </div>
          <div style={{ textAlign:'end' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:34, color:'var(--color-gold)', lineHeight:1 }}>{meanRating}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.12em', color:'var(--color-text-tertiary)' }}>MEAN RATING</div>
          </div>
        </div>
        <PitchView formation={formation} startingXI={xi} compact/>
        <div style={{ marginTop:18, paddingTop:14, borderTop:'1px solid var(--color-border)', display:'flex', justifyContent:'space-between', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.08em', color:'var(--color-text-tertiary)' }}>
          <span>ATLAS LIONS ANALYTICS · {formation} · LAST {window_} DAYS</span>
          <span>GENERATED {new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase()}</span>
        </div>
      </div>

      <SubstitutesList
        open={activeSlot != null}
        slot={activeSlotData?.slot}
        starter={activeSlotData?.player}
        subs={activeSlotData?.subs || []}
        onClose={() => setActiveSlot(null)}
        onSwap={handleSwap}
      />

      <style>{`
        @media (max-width: 1100px) { .best-xi-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
