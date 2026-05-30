import { useT } from '../context/LanguageContext.jsx';
import { Card, DataQualityBadge } from '../components/ui/index.jsx';

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:48 }}>
      <h2 style={{ fontFamily:'var(--font-display)', fontSize:32, letterSpacing:'0.01em', marginBottom:20, lineHeight:1 }}>{title}</h2>
      {children}
    </div>
  );
}

function Callout({ color = 'var(--color-gold)', children }) {
  return (
    <div style={{ padding:'16px 18px', borderInlineStart:`3px solid ${color}`, background:'var(--color-surface-2)', borderRadius:4, fontSize:13, color:'var(--color-text-secondary)', lineHeight:1.65, marginBottom:16 }}>
      {children}
    </div>
  );
}

export default function MethodologyPage() {
  const { t } = useT();

  const ratingTiers = [
    { range:'≥ 8.0', label:t('methodology.tier_exceptional'), color:'var(--color-gold)', bg:'var(--color-gold-soft)', border:'rgba(212,175,55,0.4)' },
    { range:'≥ 6.5', label:t('methodology.tier_good'),        color:'var(--color-text-primary)', bg:'var(--color-surface-2)', border:'var(--color-border)' },
    { range:'< 6.5', label:t('methodology.tier_belowpar'),    color:'#E84856', bg:'var(--color-red-soft)', border:'rgba(193,18,31,0.35)' },
  ];

  const leagueRows = [
    { bucket:'big5',         leagues:'PL, La Liga, Bundesliga, Serie A, Ligue 1', quality:'event', weight:'1.0' },
    { bucket:'other_europe', leagues:'SPL, Eredivisie, Liga Portugal, etc.',      quality:'rating', weight:'0.9' },
    { bucket:'botola',       leagues:'Botola Pro, Ligue 1 Prof.',                 quality:'heuristic', weight:'0.85' },
    { bucket:'mena',         leagues:'UAE Pro League, Qatar Stars, etc.',         quality:'rating', weight:'0.85' },
    { bucket:'americas',     leagues:'MLS, Liga MX, Serie A (BR)',               quality:'rating', weight:'0.85' },
    { bucket:'world',        leagues:'All other leagues',                         quality:'heuristic', weight:'0.8' },
  ];

  const eligRows = [
    { elig:'capped',     label:t('methodology.elig_capped_label'),     desc:t('methodology.elig_capped_desc') },
    { elig:'eligible',   label:t('methodology.elig_eligible_label'),   desc:t('methodology.elig_eligible_desc') },
    { elig:'switchable', label:t('methodology.elig_switchable_label'), desc:t('methodology.elig_switchable_desc') },
    { elig:'prospect',   label:t('methodology.elig_prospect_label'),   desc:t('methodology.elig_prospect_desc') },
  ];

  const sources = [
    { name:'Sofascore',           use:t('methodology.source_sofascore') },
    { name:'API-Football',        use:t('methodology.source_apifootball') },
    { name:'Transfermarkt',       use:t('methodology.source_transfermarkt') },
    { name:'Wikidata',            use:t('methodology.source_wikidata') },
    { name:'StatsBomb Open Data', use:t('methodology.source_statsbomb') },
    { name:'FBREF / Opta',        use:t('methodology.source_fbref') },
  ];

  const caveats = [
    t('methodology.caveat1'),
    t('methodology.caveat2'),
    t('methodology.caveat3'),
    t('methodology.caveat4'),
    t('methodology.caveat5'),
  ];

  return (
    <div className="fade-up" style={{ maxWidth:780 }}>
      <div className="eyebrow" style={{ marginBottom:6 }}>{t('methodology.eyebrow')}</div>
      <h1 style={{ fontSize:56, lineHeight:1, marginBottom:12 }}>{t('methodology.title')}</h1>
      <p style={{ fontSize:17, color:'var(--color-text-secondary)', marginBottom:48, lineHeight:1.55 }}>
        {t('methodology.intro')}
      </p>

      <Section title={t('methodology.rating_scale_title')}>
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7, marginBottom:16 }}>
          {t('methodology.rating_scale_body')}
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:16 }}>
          {ratingTiers.map(tier => (
            <Card key={tier.range} padding={14} style={{ borderColor:tier.border, background:tier.bg }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:26, color:tier.color, letterSpacing:'0.02em' }}>{tier.range}</div>
              <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:4 }}>{tier.label}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={t('methodology.quality_title')}>
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7, marginBottom:16 }}>
          {t('methodology.quality_body')}
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Card padding={16}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              <DataQualityBadge quality="event"/>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>{t('methodology.event_title')}</div>
                <p style={{ fontSize:13, color:'var(--color-text-secondary)', lineHeight:1.6, margin:0 }}>
                  {t('methodology.event_body')}
                </p>
              </div>
            </div>
          </Card>
          <Card padding={16}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              <DataQualityBadge quality="rating"/>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>{t('methodology.commercial_title')}</div>
                <p style={{ fontSize:13, color:'var(--color-text-secondary)', lineHeight:1.6, margin:0 }}>
                  {t('methodology.commercial_body')}
                </p>
              </div>
            </div>
          </Card>
          <Card padding={16}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              <DataQualityBadge quality="heuristic"/>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>{t('methodology.heuristic_title')}</div>
                <p style={{ fontSize:13, color:'var(--color-text-secondary)', lineHeight:1.6, margin:0 }}>
                  {t('methodology.heuristic_body')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section title={t('methodology.bestxi_title')}>
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7, marginBottom:16 }}>
          {t('methodology.bestxi_body')}
        </p>
        <Callout>
          <strong style={{ color:'var(--color-gold)' }}>Algorithm: </strong>{t('methodology.bestxi_callout')}
        </Callout>
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7 }}>
          {t('methodology.bestxi_body2')}
        </p>
      </Section>

      <Section title={t('methodology.league_weighting_title')}>
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7, marginBottom:16 }}>
          {t('methodology.league_weighting_body')}
        </p>
        <Card padding={0} style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--color-surface-2)' }}>
                {[t('methodology.col_bucket'), t('methodology.col_leagues'), t('methodology.col_quality'), t('methodology.col_weight')].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'start', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--color-text-secondary)', borderBottom:'1px solid var(--color-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leagueRows.map(row => (
                <tr key={row.bucket} style={{ borderBottom:'1px solid var(--color-border)' }}>
                  <td style={{ padding:'10px 16px', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600 }}>{row.bucket}</td>
                  <td style={{ padding:'10px 16px', color:'var(--color-text-secondary)' }}>{row.leagues}</td>
                  <td style={{ padding:'10px 16px' }}><DataQualityBadge quality={row.quality}/></td>
                  <td style={{ padding:'10px 16px', fontFamily:'var(--font-mono)', fontSize:12 }}>{row.weight}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      <Section title={t('methodology.eligibility_title')}>
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7, marginBottom:16 }}>
          {t('methodology.eligibility_body')}
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {eligRows.map(e => (
            <Card key={e.elig} padding={14}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                <div style={{ marginTop:2 }}>
                  {e.elig === 'capped'      && <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:4, background:'rgba(193,18,31,0.15)', border:'1px solid rgba(193,18,31,0.3)', fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, letterSpacing:'0.1em', color:'#E84856' }}>CAPPED</span>}
                  {e.elig === 'eligible'    && <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:4, background:'rgba(57,181,122,0.12)', border:'1px solid rgba(57,181,122,0.3)', fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, letterSpacing:'0.1em', color:'#39B57A' }}>ELIGIBLE</span>}
                  {e.elig === 'switchable'  && <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:4, background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)', fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, letterSpacing:'0.1em', color:'#D4AF37' }}>SWITCHABLE</span>}
                  {e.elig === 'prospect'    && <span style={{ display:'inline-block', padding:'3px 8px', borderRadius:4, background:'rgba(150,150,180,0.12)', border:'1px solid rgba(150,150,180,0.3)', fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, letterSpacing:'0.1em', color:'#9696B4' }}>PROSPECT</span>}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{e.label}</div>
                  <div style={{ fontSize:13, color:'var(--color-text-secondary)', lineHeight:1.55 }}>{e.desc}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={t('methodology.caveats_title')}>
        <Callout color="var(--color-red)">
          <strong style={{ color:'#E84856' }}>{t('methodology.caveats_callout')}</strong>
        </Callout>
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7, marginBottom:12 }}>
          {t('methodology.caveats_body')}
        </p>
        <ul style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.9, paddingInlineStart:20 }}>
          {caveats.map((c, i) => <li key={i}>{c}</li>)}
        </ul>
      </Section>

      <Section title={t('methodology.sources_title')}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
          {sources.map(s => (
            <Card key={s.name} padding={14}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{s.name}</div>
              <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{s.use}</div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
