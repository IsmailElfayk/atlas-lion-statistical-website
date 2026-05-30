import { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext.jsx';
import { useT } from '../context/LanguageContext.jsx';
import { Button, Card, DataQualityBadge, PlayerPhoto, ClubLogo, PositionBadge, RatingChip } from '../components/ui/index.jsx';
import { PitchView } from '../components/bestxi/PitchView.jsx';
import { PLAYERS, FIXTURES, TRENDING, buildBestXI } from '../data.js';

function Counter({ value, label, suffix }) {
  return (
    <div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:48, lineHeight:1, letterSpacing:'-0.01em' }}>
        {value.toLocaleString()}<span style={{ color:'var(--color-red)' }}>{suffix}</span>
      </div>
      <div className="eyebrow" style={{ marginTop:6 }}>{label}</div>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, gap:16 }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom:4 }}>{eyebrow}</div>}
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:32, letterSpacing:'0.01em', lineHeight:1 }}>{title}</h2>
        {subtitle && <div style={{ fontSize:13, color:'var(--color-text-secondary)', marginTop:6 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

function TrendingCard({ player }) {
  const { navigate } = useRouter();
  return (
    <Card interactive padding={14} onClick={() => navigate(`/players/${player.id}`)}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
        <PlayerPhoto player={player} size={44}/>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{player.name}</div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--color-text-secondary)', marginTop:2 }}>
            <ClubLogo club={player.club} size={12}/>
            <span style={{ whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{player.club.shortName}</span>
            <PositionBadge position={player.pos} size="sm"/>
          </div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid var(--color-border)' }}>
        <RatingChip rating={player.rating} size="sm"/>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color:'var(--color-green)' }}>↑ +{player.ratingDelta}</span>
      </div>
    </Card>
  );
}

export function FixtureCard({ fixture }) {
  const { t } = useT();
  const f = fixture;
  const live = f.status === 'live';
  const finished = f.status === 'finished';
  return (
    <Card padding={0} style={{ overflow:'hidden', borderColor: live ? 'rgba(193,18,31,0.4)' : 'var(--color-border)' }}>
      <div style={{ padding:'14px 18px', display:'grid', gridTemplateColumns:'1fr 140px 1fr', gap:16, alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'flex-end' }}>
          <div style={{ textAlign:'end' }}>
            <div style={{ fontSize:13, fontWeight:600 }}>{f.home.name}</div>
            <div style={{ fontSize:10, color:'var(--color-text-tertiary)' }}>{f.home.country}</div>
          </div>
          <ClubLogo club={f.home} size={32}/>
        </div>
        <div style={{ textAlign:'center' }}>
          {live && <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 8px', borderRadius:4, background:'var(--color-red-soft)', color:'#E84856', fontSize:10, fontWeight:700, letterSpacing:'0.16em' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--color-red)' }} className="pulse-red"/>{t('fixtures.live_now')}
          </div>}
          <div style={{ fontFamily:'var(--font-display)', fontSize:30, letterSpacing:'0.04em', lineHeight:1, marginTop: live ? 6 : 0 }}>
            {finished || live
              ? <span>{f.score[0]}<span style={{ color:'var(--color-text-tertiary)', margin:'0 8px' }}>:</span>{f.score[1]}</span>
              : <span>{f.time}</span>}
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9.5, color:'var(--color-text-secondary)', marginTop:6, letterSpacing:'0.08em' }}>{f.competition.toUpperCase()}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <ClubLogo club={f.away} size={32}/>
          <div>
            <div style={{ fontSize:13, fontWeight:600 }}>{f.away.name}</div>
            <div style={{ fontSize:10, color:'var(--color-text-tertiary)' }}>{f.away.country}</div>
          </div>
        </div>
      </div>
      {(f.homePlayers?.length || f.awayPlayers?.length) > 0 && (
        <div style={{ padding:'10px 18px', borderTop:'1px solid var(--color-border)', background:'var(--color-bg)', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:11, color:'var(--color-text-secondary)' }}>
          <PlayerStack ids={f.homePlayers} reverse/>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase' }}>{t('home.atlas_on_pitch')}</span>
          <PlayerStack ids={f.awayPlayers}/>
        </div>
      )}
    </Card>
  );
}

function PlayerStack({ ids = [], reverse }) {
  const players = ids.map(id => PLAYERS.find(p => p.id === id)).filter(Boolean).slice(0, 5);
  return (
    <div style={{ display:'flex', flexDirection: reverse ? 'row-reverse' : 'row' }}>
      {players.map((p, i) => (
        <div key={p.id} style={{ marginInlineStart: i === 0 ? 0 : -8, zIndex: players.length - i }} title={p.name}>
          <PlayerPhoto player={p} size={22}/>
        </div>
      ))}
      {ids.length > 5 && (
        <span style={{ marginInlineStart:-8, width:22, height:22, borderRadius:'50%', background:'var(--color-surface-2)', border:'1px solid var(--color-border)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:9, fontFamily:'var(--font-mono)', color:'var(--color-text-secondary)' }}>+{ids.length - 5}</span>
      )}
    </div>
  );
}

export default function HomePage() {
  const { navigate } = useRouter();
  const { t } = useT();
  const [counts, setCounts] = useState({ players: 0, leagues: 0, matches: 0 });

  useEffect(() => {
    const targets = { players: 1247, leagues: 42, matches: 8893 };
    const start = Date.now(); const dur = 1200;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      setCounts({
        players: Math.round(targets.players * ease),
        leagues: Math.round(targets.leagues * ease),
        matches: Math.round(targets.matches * ease),
      });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const featuredXI = useMemo(() => buildBestXI('4-3-3', PLAYERS), []);
  const upcomingNT = FIXTURES.filter(f => f.competition.includes('AFCON') || f.competition.includes('FIFA Friendly')).slice(0, 2);

  return (
    <div className="fade-up">
      {/* HERO */}
      <section style={{
        position:'relative', overflow:'hidden',
        borderRadius:'var(--radius-xl)', border:'1px solid var(--color-border)',
        padding:'72px 56px',
        background:'radial-gradient(ellipse at 80% 20%, rgba(193,18,31,0.18), transparent 60%), radial-gradient(ellipse at 10% 90%, rgba(0,122,61,0.14), transparent 60%), var(--color-surface)',
        marginBottom:48,
      }}>
        <div style={{ position:'absolute', inset:0, opacity:0.06, pointerEvents:'none',
          background:`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><g fill='none' stroke='%23D4AF37' stroke-width='0.5'><polygon points='40,4 48,22 68,22 52,34 58,56 40,44 22,56 28,34 12,22 32,22'/><circle cx='40' cy='40' r='28'/></g></svg>")`,
          backgroundSize:'160px 160px' }}/>
        <div style={{ position:'relative', display:'grid', gridTemplateColumns:'1fr auto', gap:48, alignItems:'center' }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 12px', borderRadius:'var(--radius-full)', background:'var(--color-red-soft)', border:'1px solid rgba(193,18,31,0.3)', marginBottom:24 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--color-red)' }} className="pulse-red"/>
              <span className="eyebrow" style={{ color:'#E84856', fontSize:10 }}>{t('home.hero_eyebrow')}</span>
            </div>
            <h1 style={{ fontSize:'clamp(48px, 7vw, 88px)', lineHeight:0.92, letterSpacing:'-0.005em', marginBottom:18 }}>
              {t('home.hero_title1')}<br/>
              <span style={{ color:'var(--color-red)' }}>{t('home.hero_title2')}</span>
            </h1>
            <p style={{ fontSize:17, color:'var(--color-text-secondary)', maxWidth:540, marginBottom:36, lineHeight:1.55 }}>
              {t('home.hero_body')}
            </p>
            <div style={{ display:'flex', gap:12 }}>
              <Button variant="primary" size="lg" onClick={() => navigate('/best-xi')} iconRight={<span>→</span>}>{t('home.btn_build')}</Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/players')}>{t('home.btn_browse')}</Button>
            </div>
          </div>
          <div style={{ width:320, opacity:0.95 }} className="hero-pitch-hide">
            <PitchView formation="4-3-3" startingXI={featuredXI} compact/>
          </div>
        </div>

        <div style={{ position:'relative', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:32, marginTop:56, paddingTop:32, borderTop:'1px solid var(--color-border)' }}>
          <Counter value={counts.players} label={t('home.counter_players')} suffix="+"/>
          <Counter value={counts.leagues} label={t('home.counter_leagues')} suffix="+"/>
          <Counter value={counts.matches} label={t('home.counter_matches')} suffix=""/>
        </div>
      </section>

      {/* FEATURED BEST XI */}
      <section style={{ marginBottom:56 }}>
        <SectionHeader
          eyebrow={t('home.form_guide')}
          title={t('home.current_xi_title')}
          subtitle={t('home.current_xi_subtitle')}
          action={<Button variant="ghost" onClick={() => navigate('/best-xi')} iconRight={<span>→</span>}>{t('home.customise')}</Button>}
        />
        <Card padding={0} style={{ overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:0 }} className="best-xi-preview-grid">
            <div style={{ padding:0 }}>
              <PitchView formation="4-3-3" startingXI={featuredXI}/>
            </div>
            <div style={{ padding:'24px 26px', borderInlineStart:'1px solid var(--color-border)' }}>
              <div className="eyebrow" style={{ marginBottom:14 }}>{t('home.starting_xi_label')}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {featuredXI.slice(0, 7).map(s => (
                  <div key={s.player?.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <PositionBadge position={s.slot} size="sm"/>
                    <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{s.player?.name}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color: s.player?.rating >= 7.5 ? 'var(--color-gold)' : 'var(--color-text-secondary)' }}>{(s.player?.rating||0).toFixed(1)}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:18, paddingTop:14, borderTop:'1px solid var(--color-border)', fontSize:11, color:'var(--color-text-tertiary)', fontStyle:'italic' }}>
                {t('home.more_click')}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* TRENDING */}
      <section style={{ marginBottom:56 }}>
        <SectionHeader eyebrow={t('home.rising_eyebrow')} title={t('home.rising_title')} subtitle={t('home.rising_subtitle')}/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:14 }}>
          {TRENDING.map(p => <TrendingCard key={p.id} player={p}/>)}
        </div>
      </section>

      {/* FIXTURES + METHODOLOGY */}
      <section style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:24, marginBottom:48 }} className="home-dual-grid">
        <div>
          <SectionHeader eyebrow={t('home.nt_eyebrow')} title={t('home.nt_title')}/>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {upcomingNT.length > 0
              ? upcomingNT.map(f => <FixtureCard key={f.id} fixture={f}/>)
              : <Card padding={24} style={{ textAlign:'center', color:'var(--color-text-secondary)', fontSize:13 }}>{t('home.no_fixtures')}</Card>}
          </div>
        </div>
        <Card style={{ background:'linear-gradient(160deg, rgba(193,18,31,0.12), transparent 60%), var(--color-surface)' }}>
          <div className="eyebrow" style={{ marginBottom:8 }}>{t('home.method_eyebrow')}</div>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:26, letterSpacing:'0.01em', marginBottom:10, lineHeight:1.05 }}>{t('home.method_title')}</h3>
          <p style={{ fontSize:13, color:'var(--color-text-secondary)', lineHeight:1.55, marginBottom:16 }}>
            {t('home.method_body')}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
            <DataQualityBadge quality="event"/>
            <DataQualityBadge quality="rating"/>
            <DataQualityBadge quality="heuristic"/>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate('/methodology')} iconRight={<span>→</span>}>{t('home.method_btn')}</Button>
        </Card>
      </section>

      <style>{`
        @media (max-width: 980px) {
          .hero-pitch-hide, .best-xi-preview-grid > div:last-child { display: none !important; }
          .best-xi-preview-grid { grid-template-columns: 1fr !important; }
          .home-dual-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
