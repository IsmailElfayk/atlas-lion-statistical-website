import { useState, useMemo, useEffect } from 'react';
import { useRouter, Link } from '../context/RouterContext.jsx';
import { useT } from '../context/LanguageContext.jsx';
import {
  Button, Card, PositionBadge, EligibilityBadge, DataQualityBadge,
  Flag, RatingChip, ClubLogo, PlayerPhoto, Tabs, EmptyState, StatusPill,
} from '../components/ui/index.jsx';
import { RatingHistoryChart, FormHeatmap } from '../components/player/Charts.jsx';
import { fmtMV, fmtDate, statusMeta } from '../data.js';
import { getPlayer, getPlayerRatings } from '../api/index.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const NATIONAL_RE = /afcon|world.cup|arab.cup|friendly|qualifier|qualification|nations.league|international/i;
const CLUB_RE     = /premier|liga|serie|bundesliga|ligue|eredivisie|botola|super.lig|pro.league/i;

function compType(comp = '') {
  if (NATIONAL_RE.test(comp) && !CLUB_RE.test(comp)) return 'national';
  return 'club';
}

function adaptRating(r) {
  const rating = r.sofascoreRating ?? r.normalisedCustom ?? null;
  if (rating == null) return null;
  const home = r.homeTeam || r.match?.homeClub?.name || '?';
  const away = r.awayTeam || r.match?.awayClub?.name || '?';
  return {
    date        : (r.matchDate || '').toString().slice(0, 10),
    rating,
    matchLabel  : `${home} vs ${away}`,
    competition : r.competition || r.match?.league?.name || '',
    competitionType: compType(r.competition || r.match?.league?.name || ''),
    dataQuality : r.dataQuality || 'none',
    minutes     : r.minutes || 0,
    goals       : r.goals || 0,
    assists     : r.assists || 0,
  };
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600 }}>{value ?? '—'}</div>
    </div>
  );
}

function WindowCard({ days, summary, active, onClick }) {
  const rating = summary?.avgRating;
  const tone = rating == null ? '#9EA89F'
    : rating >= 7.5 ? '#39B57A'
    : rating >= 6.5 ? '#E2C24A'
    : '#E84856';
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 8px', borderRadius: 6, cursor: 'pointer',
      background: active ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
      border: `1.5px solid ${active ? 'var(--color-red)' : 'var(--color-border)'}`,
      transition: 'all 140ms ease', textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: tone, letterSpacing: '0.01em' }}>
        {rating != null ? rating.toFixed(1) : '—'}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
        {days}D
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4 }}>
        {summary?.matchCount ?? 0}G · {summary?.totalMinutes ?? 0}′
      </div>
    </button>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function PlayerDetailPage() {
  const { path, navigate } = useRouter();
  const { t } = useT();
  const id = path.split('/').pop();

  const [player,  setPlayer]  = useState(null);
  const [rawRatings, setRawRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tab,      setTab]     = useState('performance');
  const [window_,  setWindow_] = useState(30);
  const [compFilter, setCompFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getPlayer(id),
      getPlayerRatings(id, {}),
    ])
      .then(([pRes, rRes]) => {
        setPlayer(pRes.data?.data ?? pRes.data ?? null);
        setRawRatings(rRes.data?.data ?? rRes.data ?? []);
      })
      .catch(err => {
        console.error('[PlayerDetail] fetch failed:', err?.response?.status, err?.message);
        setError(err?.response?.status === 404 ? 'not_found' : 'error');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const allRatings = useMemo(
    () => rawRatings.map(adaptRating).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date)),
    [rawRatings]
  );

  const windowSince = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - window_);
    return d.toISOString().slice(0, 10);
  }, [window_]);

  const windowRatings = useMemo(
    () => allRatings.filter(r => r.date >= windowSince),
    [allRatings, windowSince]
  );

  const ratings = useMemo(() => {
    if (compFilter === 'all')      return windowRatings;
    if (compFilter === 'national') return windowRatings.filter(r => r.competitionType === 'national');
    return windowRatings.filter(r => r.competitionType !== 'national');
  }, [windowRatings, compFilter]);

  const compCounts = useMemo(() => ({
    all:      windowRatings.length,
    national: windowRatings.filter(r => r.competitionType === 'national').length,
    club:     windowRatings.filter(r => r.competitionType !== 'national').length,
  }), [windowRatings]);

  if (loading) {
    return <EmptyState icon="◌" title={t('player.loading')} description={t('common.loading')}/>;
  }
  if (error === 'not_found' || !player) {
    return (
      <EmptyState icon="?" title={t('player.not_found')} description={t('player.not_found_desc')}
        action={<Button variant="secondary" onClick={() => navigate('/players')}>{t('player.back')}</Button>}/>
    );
  }

  const club    = player.currentClub || {};
  const league  = club.league || {};
  const nat     = player.nationalities?.length ? player.nationalities : ['Morocco'];
  const wa      = player.windowAverages || {};
  const form30  = wa[30]?.avgRating ?? null;

  const displayPlayer = {
    id       : player.slug || String(player._id),
    name     : player.fullName,
    nameAr   : player.fullNameAr || '',
    pos      : player.primaryPosition || 'CM',
    elig     : player.moroccoEligibility || 'eligible',
    status   : player.status || 'available',
    rating   : form30,
    mvEur    : player.marketValueEur || 0,
    minutes  : player.minutesCurrent || 0,
    age      : player.age || 0,
    height   : player.height || null,
    foot     : player.preferredFoot || 'Right',
    photoUrl : player.photoUrl,
    archetype: player.archetypeLabel || '',
    nat,
    club: {
      name      : club.name || '',
      shortName : club.shortName || (club.name || '').slice(0, 3).toUpperCase() || 'UNK',
      leagueName: league.name || '',
      country   : league.country || club.country || '',
      color     : club.color || '#444',
      logoUrl   : club.logoUrl,
    },
  };

  const bestDataQ = allRatings.length
    ? allRatings.reduce((best, r) => {
        const rank = { event: 3, rating: 2, heuristic: 1, none: 0 };
        return rank[r.dataQuality] > rank[best] ? r.dataQuality : best;
      }, 'none')
    : 'none';

  const tableHeaders = [
    t('player.col_date'), t('player.col_match'), t('player.col_competition'),
    t('player.col_min'), t('player.col_goals'), t('player.col_assists'),
    t('player.col_rating'), t('player.col_quality'),
  ];

  return (
    <div className="fade-up">
      {/* Breadcrumb */}
      <div style={{ display:'flex', gap:8, fontSize:11, color:'var(--color-text-tertiary)', marginBottom:18, fontFamily:'var(--font-mono)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
        <Link to="/" style={{ color:'inherit' }}>{t('player.breadcrumb_home')}</Link>
        <span>›</span>
        <Link to="/players" style={{ color:'inherit' }}>{t('player.breadcrumb_players')}</Link>
        <span>›</span>
        <span style={{ color:'var(--color-text-secondary)' }}>{displayPlayer.name}</span>
      </div>

      {/* Hero card */}
      <Card padding={0} style={{ overflow:'hidden', marginBottom:24, background:`linear-gradient(120deg, ${displayPlayer.club.color}22, var(--color-surface))` }}>
        <div style={{ display:'grid', gridTemplateColumns:'200px 1fr auto', gap:24, padding:'28px 32px', alignItems:'center' }} className="player-hero-grid">
          <PlayerPhoto player={displayPlayer} size={160}/>
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap', alignItems:'center' }}>
              <PositionBadge position={displayPlayer.pos}/>
              <EligibilityBadge eligibility={displayPlayer.elig}/>
              <StatusPill player={displayPlayer} size="lg"/>
              {nat.map(n => <Flag key={n} country={n}/>)}
            </div>
            <h1 style={{ fontSize:48, lineHeight:1, letterSpacing:0 }}>{displayPlayer.name.toUpperCase()}</h1>
            {displayPlayer.nameAr && (
              <div style={{ fontFamily:'var(--font-arabic)', fontSize:22, color:'var(--color-text-secondary)', marginTop:4 }}>{displayPlayer.nameAr}</div>
            )}
            <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:10 }}>
              <ClubLogo club={displayPlayer.club} size={26}/>
              <span style={{ fontSize:14, fontWeight:600 }}>{displayPlayer.club.name}</span>
              {displayPlayer.club.leagueName && <>
                <span style={{ color:'var(--color-text-tertiary)' }}>·</span>
                <span style={{ fontSize:13, color:'var(--color-text-secondary)' }}>{displayPlayer.club.leagueName}</span>
              </>}
            </div>
            <div style={{ marginTop:16, display:'flex', gap:24, flexWrap:'wrap', fontSize:12 }}>
              <Stat label={t('player.stat_age')}        value={displayPlayer.age ? `${displayPlayer.age}y` : null}/>
              <Stat label={t('player.stat_height')}     value={displayPlayer.height ? `${displayPlayer.height}cm` : null}/>
              <Stat label={t('player.stat_foot')}       value={displayPlayer.foot}/>
              <Stat label={t('player.stat_mv')}         value={displayPlayer.mvEur ? fmtMV(displayPlayer.mvEur) : null}/>
              <Stat label={t('player.stat_season_min')} value={displayPlayer.minutes ? displayPlayer.minutes.toLocaleString() + '′' : null}/>
            </div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div className="eyebrow" style={{ marginBottom:6 }}>{t('player.rating_30d')}</div>
            <RatingChip rating={form30} size="lg"/>
            {displayPlayer.archetype && (
              <div style={{ marginTop:14, padding:'5px 10px', background:'var(--color-gold-soft)', border:'1px solid rgba(212,175,55,0.4)', borderRadius:4, fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.12em', textTransform:'uppercase', color:'#E2C24A' }}>
                {displayPlayer.archetype}
              </div>
            )}
            <Button variant="secondary" size="sm" style={{ marginTop:14 }} onClick={() => navigate(`/compare?players=${displayPlayer.id}`)}>{t('player.compare_btn')}</Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ marginBottom:24 }}>
        <Tabs tabs={[
          { id:'performance', label: t('player.tab_performance') },
          { id:'history',     label: t('player.tab_history') },
        ]} activeTab={tab} onTabChange={setTab}/>
      </div>

      {tab === 'performance' && (
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

          {/* Window averages strip */}
          <Card>
            <div className="eyebrow" style={{ marginBottom:12 }}>{t('player.form_averages')}</div>
            <div style={{ display:'flex', gap:8 }}>
              {[15, 30, 45, 60, 75, 90].map(d => (
                <WindowCard
                  key={d}
                  days={d}
                  summary={wa[d]}
                  active={window_ === d}
                  onClick={() => setWindow_(d)}
                />
              ))}
            </div>
            {allRatings.length === 0 && (
              <div style={{ marginTop:12, fontSize:12, color:'var(--color-text-tertiary)' }}>
                {t('player.no_rating_data')}
              </div>
            )}
          </Card>

          {/* Rating history chart */}
          <Card>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:12 }}>
              <div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.02em' }}>
                  {t('player.rating_history').replace('{n}', window_)}
                </h3>
                <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:2 }}>
                  {windowRatings.length} {t('player.matches')} · <DataQualityBadge quality={bestDataQ}/>
                </div>
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <Tabs variant="pill" tabs={[
                { id:'all',      label:`${t('player.filter_all')} · ${compCounts.all}` },
                { id:'national', label:`${t('player.filter_national')} · ${compCounts.national}` },
                { id:'club',     label:`${t('player.filter_club')} · ${compCounts.club}` },
              ]} activeTab={compFilter} onTabChange={setCompFilter}/>
            </div>
            {ratings.length === 0
              ? <EmptyState icon="◌" title={t('player.no_matches_window')} description={t('player.no_matches_window_desc')}/>
              : <RatingHistoryChart ratings={ratings} label={bestDataQ === 'event' ? 'Custom xT/VAEP' : 'Sofascore rating'}/>
            }
          </Card>

          {/* Form heatmap */}
          <Card>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.02em', marginBottom:14 }}>{t('player.heatmap_title')}</h3>
            <FormHeatmap ratings={allRatings.slice(-365)}/>
          </Card>
        </div>
      )}

      {tab === 'history' && (
        <Card padding={0}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--color-border)' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.02em' }}>
              {t('player.all_matches')} ({rawRatings.length})
            </h3>
          </div>
          {rawRatings.length === 0 ? (
            <div style={{ padding:32 }}>
              <EmptyState icon="◌" title={t('player.no_match_data')} description={t('player.no_match_data_desc')}/>
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'var(--color-surface-2)' }}>
                  {tableHeaders.map(h => (
                    <th key={h} style={{ padding:'8px 14px', textAlign:'start', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRatings.slice().reverse().map((r, i) => (
                  <tr key={i} style={{ borderTop:'1px solid var(--color-border)' }}>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', color:'var(--color-text-secondary)', whiteSpace:'nowrap' }}>{fmtDate(r.date)}</td>
                    <td style={{ padding:'10px 14px', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.matchLabel}</td>
                    <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.competition}</td>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)' }}>{r.minutes}′</td>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', color:'var(--color-text-secondary)' }}>{r.goals}</td>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', color:'var(--color-text-secondary)' }}>{r.assists}</td>
                    <td style={{ padding:'10px 14px' }}><RatingChip rating={r.rating} size="sm"/></td>
                    <td style={{ padding:'10px 14px' }}><DataQualityBadge quality={r.dataQuality}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <style>{`
        @media (max-width: 900px) {
          .player-hero-grid { grid-template-columns: 100px 1fr !important; }
          .player-hero-grid > div:last-child { grid-column: 1 / -1; text-align: start !important; }
        }
      `}</style>
    </div>
  );
}
