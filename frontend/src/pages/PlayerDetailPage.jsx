import { useState, useMemo } from 'react';
import { useRouter, Link } from '../context/RouterContext.jsx';
import { Button, Card, PositionBadge, EligibilityBadge, DataQualityBadge, Flag, RatingChip, ClubLogo, PlayerPhoto, Tabs, EmptyState, StatusPill } from '../components/ui/index.jsx';
import { RatingHistoryChart, FormHeatmap, MarketValueChart, CompareRadar } from '../components/player/Charts.jsx';
import { PLAYERS, genRatingHistory, genMarketHistory, fmtDate, fmtMV } from '../data.js';

function Stat({ label, value }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom:2 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:600 }}>{value}</div>
    </div>
  );
}

export default function PlayerDetailPage() {
  const { path, navigate } = useRouter();
  const id = path.split('/').pop();
  const player = PLAYERS.find(p => p.id === id || p.slug === id);

  const [tab, setTab] = useState('performance');
  const [window_, setWindow_] = useState(90);
  const [compType, setCompType] = useState('all');

  const allRatings = useMemo(() => player ? genRatingHistory(player, window_) : [], [player, window_]);
  const ratings = useMemo(() => {
    if (compType === 'all') return allRatings;
    if (compType === 'national') return allRatings.filter(r => r.competitionType === 'national');
    return allRatings.filter(r => r.competitionType !== 'national');
  }, [allRatings, compType]);

  const compCounts = useMemo(() => ({
    all: allRatings.length,
    national: allRatings.filter(r => r.competitionType === 'national').length,
    club: allRatings.filter(r => r.competitionType !== 'national').length,
  }), [allRatings]);

  const yearRatings = useMemo(() => player ? genRatingHistory(player, 365) : [], [player]);
  const market = useMemo(() => player ? genMarketHistory(player) : [], [player]);

  if (!player) return (
    <EmptyState icon="?" title="Player not found" description="Check the URL or browse the directory."
      action={<Button variant="secondary" onClick={() => navigate('/players')}>Back to players</Button>}/>
  );

  const radarData = {
    [player.id]: {
      r: player.rating,
      a: 0.72, p: 0.58, d: 0.34, b: 0.81, x: 0.65,
    }
  };

  return (
    <div className="fade-up">
      {/* Breadcrumb */}
      <div style={{ display:'flex', gap:8, fontSize:11, color:'var(--color-text-tertiary)', marginBottom:18, fontFamily:'var(--font-mono)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
        <Link to="/" style={{ color:'inherit' }}>Home</Link>
        <span>›</span>
        <Link to="/players" style={{ color:'inherit' }}>Players</Link>
        <span>›</span>
        <span style={{ color:'var(--color-text-secondary)' }}>{player.name}</span>
      </div>

      {/* Hero card */}
      <Card padding={0} style={{ overflow:'hidden', marginBottom:24, background:`linear-gradient(120deg, ${player.club.color}22, var(--color-surface))` }}>
        <div style={{ display:'grid', gridTemplateColumns:'200px 1fr auto', gap:24, padding:'28px 32px', alignItems:'center' }} className="player-hero-grid">
          <PlayerPhoto player={player} size={160}/>
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap', alignItems:'center' }}>
              <PositionBadge position={player.pos}/>
              <EligibilityBadge eligibility={player.elig}/>
              <StatusPill player={player} size="lg"/>
              {player.nat.map(n => <Flag key={n} country={n}/>)}
            </div>
            <h1 style={{ fontSize:48, lineHeight:1, letterSpacing:0 }}>{player.name.toUpperCase()}</h1>
            <div style={{ fontFamily:'var(--font-arabic)', fontSize:22, color:'var(--color-text-secondary)', marginTop:4 }}>{player.nameAr}</div>
            <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:10 }}>
              <ClubLogo club={player.club} size={26}/>
              <span style={{ fontSize:14, fontWeight:600 }}>{player.club.name}</span>
              <span style={{ color:'var(--color-text-tertiary)' }}>·</span>
              <span style={{ fontSize:13, color:'var(--color-text-secondary)' }}>{player.club.leagueName}</span>
            </div>
            <div style={{ marginTop:16, display:'flex', gap:24, flexWrap:'wrap', fontSize:12 }}>
              <Stat label="Age" value={`${player.age}y`}/>
              <Stat label="Height" value={`${player.height}cm`}/>
              <Stat label="Foot" value={player.foot === 'L' ? 'Left' : 'Right'}/>
              <Stat label="Market value" value={fmtMV(player.mvEur)}/>
              <Stat label="Minutes (90d)" value={player.minutes.toLocaleString()}/>
            </div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div className="eyebrow" style={{ marginBottom:6 }}>Form rating</div>
            <RatingChip rating={player.rating} size="lg"/>
            <div style={{ marginTop:14, padding:'5px 10px', background:'var(--color-gold-soft)', border:'1px solid rgba(212,175,55,0.4)', borderRadius:4, fontFamily:'var(--font-mono)', fontSize:9.5, letterSpacing:'0.12em', textTransform:'uppercase', color:'#E2C24A' }}>{player.archetype}</div>
            <Button variant="secondary" size="sm" style={{ marginTop:14 }} onClick={() => navigate(`/compare?players=${player.id}`)}>Compare →</Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div style={{ marginBottom:24 }}>
        <Tabs tabs={[
          { id:'performance', label:'Performance' },
          { id:'history',     label:'History' },
          { id:'value',       label:'Transfer value' },
          { id:'archetype',   label:'Archetype' },
        ]} activeTab={tab} onTabChange={setTab}/>
      </div>

      {tab === 'performance' && (
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
          <Card>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:12 }}>
              <div>
                <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.02em' }}>Rating history</h3>
                <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:2 }}>
                  {ratings.length} matches · <DataQualityBadge quality={player.dataQ}/>
                </div>
              </div>
              <Tabs variant="pill" tabs={[30,60,90,180].map(d => ({id:d, label:`${d}D`}))} activeTab={window_} onTabChange={setWindow_}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <Tabs variant="pill" tabs={[
                {id:'all',      label:`All matches · ${compCounts.all}`},
                {id:'national', label:`National team · ${compCounts.national}`},
                {id:'club',     label:`Club only · ${compCounts.club}`},
              ]} activeTab={compType} onTabChange={setCompType}/>
            </div>
            {ratings.length === 0
              ? <EmptyState icon="◌" title="No matches" description={compType === 'national' ? 'No international matches in this window.' : 'No matches in this window.'}/>
              : <RatingHistoryChart ratings={ratings} label={player.dataQ === 'event' ? 'Custom xT/VAEP' : 'Sofascore rating'}/>}
          </Card>

          <Card>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.02em', marginBottom:14 }}>Form heatmap · Last 365 days</h3>
            <FormHeatmap ratings={yearRatings}/>
          </Card>

          <Card padding={0}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--color-border)' }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.02em' }}>Recent matches</h3>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'var(--color-surface-2)' }}>
                  {['Date','Opponent','Comp','Min','Rating','Quality'].map(h => (
                    <th key={h} style={{ padding:'8px 14px', textAlign:'start', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ratings.slice(-8).reverse().map((r, i) => (
                  <tr key={i} style={{ borderTop:'1px solid var(--color-border)' }}>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)', color:'var(--color-text-secondary)' }}>{fmtDate(r.date)}</td>
                    <td style={{ padding:'10px 14px' }}>{r.matchLabel}</td>
                    <td style={{ padding:'10px 14px', color:'var(--color-text-secondary)' }}>{player.club.leagueName}</td>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-mono)' }}>{r.minutes}′</td>
                    <td style={{ padding:'10px 14px' }}><RatingChip rating={r.rating} size="sm"/></td>
                    <td style={{ padding:'10px 14px' }}><DataQualityBadge quality={r.dataQuality}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {tab === 'value' && (
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14 }}>
            <div>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.02em' }}>Market value · Transfermarkt</h3>
              <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:2 }}>Last updated 11 May 2026</div>
            </div>
            <div style={{ textAlign:'end' }}>
              <div className="eyebrow">Current</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:42, color:'var(--color-green)', letterSpacing:'0.01em', lineHeight:1, marginTop:4 }}>{fmtMV(player.mvEur)}</div>
            </div>
          </div>
          <MarketValueChart history={market}/>
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, letterSpacing:'0.02em', marginBottom:18 }}>Career timeline</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:0, position:'relative', paddingInlineStart:24 }}>
            <div style={{ position:'absolute', insetInlineStart:6, top:8, bottom:8, width:2, background:'var(--color-border)' }}/>
            {[
              { year:'2026', club:player.club, role:'Senior team', desc:'Current club · '+player.minutes+' min this season' },
              { year:'2024', club:player.club, role:'Joined', desc:'Permanent transfer · '+fmtMV(player.mvEur*0.6) },
              { year:'2022', club:{name:'Previous club', color:'#3a3a3a', shortName:'PRV'}, role:'Loan return', desc:'Returned from loan spell' },
              { year:'2020', club:{name:'Youth academy', color:'#2a2a2a', shortName:'YTH'}, role:'Promoted', desc:'Senior debut at 18' },
            ].map((e, i) => (
              <div key={i} style={{ display:'flex', gap:14, padding:'14px 0', borderTop: i === 0 ? 'none' : '1px solid var(--color-border)', position:'relative' }}>
                <div style={{ position:'absolute', insetInlineStart:-23, top:18, width:14, height:14, borderRadius:'50%', background: i === 0 ? 'var(--color-red)' : 'var(--color-surface-3)', border:'3px solid var(--color-bg)' }}/>
                <div style={{ width:60, fontFamily:'var(--font-display)', fontSize:22, color:'var(--color-gold)', letterSpacing:'0.02em' }}>{e.year}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:600 }}>
                    {e.club.color && <ClubLogo club={e.club} size={16}/>} {e.club.name} <span style={{ color:'var(--color-text-tertiary)', fontWeight:400 }}>· {e.role}</span>
                  </div>
                  <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:4 }}>{e.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'archetype' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:24 }} className="player-archetype-grid">
          <Card>
            <div className="eyebrow" style={{ marginBottom:6 }}>Archetype</div>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:42, letterSpacing:'0.02em', color:'var(--color-gold)' }}>{player.archetype.toUpperCase()}</h2>
            <p style={{ fontSize:14, color:'var(--color-text-secondary)', marginTop:14, lineHeight:1.6 }}>
              Players classified as <strong style={{ color:'var(--color-text-primary)' }}>{player.archetype}</strong> typically rank above-average on progressive carries, ball receptions in the half-spaces, and shot creation per touch. Cluster derived from a 12-axis profile compared to peers in the same position across 200,000 matches.
            </p>
            <div style={{ marginTop:18, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              <Stat label="xT / 90"       value="0.62"/>
              <Stat label="Carries → box" value="3.1"/>
              <Stat label="Take-on %"     value="58%"/>
            </div>
          </Card>
          <Card>
            <CompareRadar
              players={[player]}
              metrics={[
                {key:'r', label:'Rating', max:10},
                {key:'a', label:'Attack', max:1},
                {key:'p', label:'Passing', max:1},
                {key:'d', label:'Defence', max:1},
                {key:'b', label:'Dribble', max:1},
                {key:'x', label:'xT/90', max:1},
              ]}
              data={radarData}
            />
          </Card>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .player-hero-grid { grid-template-columns: 100px 1fr !important; }
          .player-hero-grid > div:last-child { grid-column: 1 / -1; text-align: start !important; }
          .player-archetype-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
