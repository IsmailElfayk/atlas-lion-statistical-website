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
  return (
    <div className="fade-up" style={{ maxWidth:780 }}>
      <div className="eyebrow" style={{ marginBottom:6 }}>Transparency</div>
      <h1 style={{ fontSize:56, lineHeight:1, marginBottom:12 }}>METHODOLOGY</h1>
      <p style={{ fontSize:17, color:'var(--color-text-secondary)', marginBottom:48, lineHeight:1.55 }}>
        How Atlas Lions Analytics rates every Moroccan professional footballer and what the numbers actually mean.
      </p>

      <Section title="Rating scale">
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7, marginBottom:16 }}>
          We use the <strong style={{ color:'var(--color-text-primary)' }}>Sofascore 3–10 scale</strong> as our baseline. Sofascore covers 200+ leagues and provides the broadest cross-competition coverage available for professional football. Their rating combines pass success, duels, key passes, goals, assists, and conceded goals (for GKs).
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:16 }}>
          {[
            { range:'≥ 8.0', label:'Exceptional', color:'var(--color-gold)', bg:'var(--color-gold-soft)', border:'rgba(212,175,55,0.4)' },
            { range:'≥ 6.5', label:'Good', color:'var(--color-text-primary)', bg:'var(--color-surface-2)', border:'var(--color-border)' },
            { range:'< 6.5', label:'Below par', color:'#E84856', bg:'var(--color-red-soft)', border:'rgba(193,18,31,0.35)' },
          ].map(t => (
            <Card key={t.range} padding={14} style={{ borderColor:t.border, background:t.bg }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:26, color:t.color, letterSpacing:'0.02em' }}>{t.range}</div>
              <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:4 }}>{t.label}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Data quality tiers">
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7, marginBottom:16 }}>
          Not all ratings are equal. Every player's form rating carries a data-quality badge to indicate how reliable the underlying data is.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Card padding={16}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              <DataQualityBadge quality="event"/>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>Event data — xT/VAEP model</div>
                <p style={{ fontSize:13, color:'var(--color-text-secondary)', lineHeight:1.6, margin:0 }}>
                  Available for Big 5 leagues (Premier League, La Liga, Bundesliga, Serie A, Ligue 1) and the Saudi Pro League. Uses StatsBomb Open Data or licensed feeds to compute expected threat (xT) and value of actions using estimated probabilities (VAEP). Normalised to the 4–9 scale for comparability.
                </p>
              </div>
            </div>
          </Card>
          <Card padding={16}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              <DataQualityBadge quality="rating"/>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>Commercial rating — Sofascore</div>
                <p style={{ fontSize:13, color:'var(--color-text-secondary)', lineHeight:1.6, margin:0 }}>
                  The raw Sofascore match rating, used as-is for leagues outside the Big 5 + SPL. Covers Botola Pro, Ligue 1 Professionnelle, Saudi Division 1, and most other leagues tracked. Subject to Sofascore's own editorial model.
                </p>
              </div>
            </div>
          </Card>
          <Card padding={16}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
              <DataQualityBadge quality="heuristic"/>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>Heuristic — derived estimate</div>
                <p style={{ fontSize:13, color:'var(--color-text-secondary)', lineHeight:1.6, margin:0 }}>
                  For leagues with incomplete Sofascore coverage, we derive a form estimate from available partial data: minutes played, goals, assists, and clean sheets. Treat these as rough guides only — not directly comparable to event or commercial ratings.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section title="The Best XI optimiser">
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7, marginBottom:16 }}>
          The Best XI uses a <strong style={{ color:'var(--color-text-primary)' }}>Hungarian algorithm (Kuhn-Munkres)</strong> — an O(n³) assignment optimiser — to find the globally optimal assignment of players to formation slots. Each slot has a list of eligible positions (e.g., the RB slot accepts RB, WB, RM), and each player has a primary position plus eligible slot list.
        </p>
        <Callout>
          <strong style={{ color:'var(--color-gold)' }}>Algorithm:</strong> We build a cost matrix where cost(player, slot) = 10 − player.formRating if player.pos ∈ slot.eligiblePositions, else ∞. The Hungarian algorithm minimises total cost, which is equivalent to maximising total rating. Ties are broken by data quality (event &gt; rating &gt; heuristic).
        </Callout>
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7 }}>
          If fewer than 11 players meet the minimum-minutes threshold, the system relaxes the threshold to 0 and shows a "Relaxed" warning. The optimiser runs client-side on mock data in this demo; in production it queries the backend API which caches results in Redis with a 1-hour TTL.
        </p>
      </Section>

      <Section title="League weighting">
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7, marginBottom:16 }}>
          Leagues are grouped into buckets. The bucket affects which players are eligible for Best XI calculations and how ratings are weighted in cross-bucket comparisons.
        </p>
        <Card padding={0} style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--color-surface-2)' }}>
                {['Bucket','Leagues','Data quality','Weight'].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'start', fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--color-text-secondary)', borderBottom:'1px solid var(--color-border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { bucket:'big5',         leagues:'PL, La Liga, Bundesliga, Serie A, Ligue 1', quality:'event', weight:'1.0' },
                { bucket:'other_europe', leagues:'SPL, Eredivisie, Liga Portugal, etc.',      quality:'rating', weight:'0.9' },
                { bucket:'botola',       leagues:'Botola Pro, Ligue 1 Prof.',                 quality:'heuristic', weight:'0.85' },
                { bucket:'mena',         leagues:'UAE Pro League, Qatar Stars, etc.',         quality:'rating', weight:'0.85' },
                { bucket:'americas',     leagues:'MLS, Liga MX, Serie A (BR)',               quality:'rating', weight:'0.85' },
                { bucket:'world',        leagues:'All other leagues',                         quality:'heuristic', weight:'0.8' },
              ].map(row => (
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

      <Section title="Eligibility classification">
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7, marginBottom:16 }}>
          Every player is classified into one of four eligibility categories:
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { elig:'capped', label:'Capped', desc:'Has played a competitive senior international for Morocco (or is already locked in for Morocco).' },
            { elig:'eligible', label:'Eligible', desc:'Holds Moroccan nationality and has not been capped by any senior national team. Can play for Morocco immediately.' },
            { elig:'switchable', label:'Switchable', desc:'Currently registered with another national team but has not yet played a competitive match. May switch to Morocco under FIFA Article 9 if they hold Moroccan citizenship.' },
            { elig:'prospect', label:'Prospect', desc:'Has Moroccan heritage but dual nationality is unconfirmed or complex. Community-sourced; verify independently.' },
          ].map(e => (
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

      <Section title="Caveats & limitations">
        <Callout color="var(--color-red)">
          <strong style={{ color:'#E84856' }}>This is not a selection recommendation.</strong> Ratings reflect recent statistical form only. They do not account for tactical fit, team chemistry, psychological factors, or coach preferences. Rankings are provided for analytical entertainment and debate purposes only.
        </Callout>
        <p style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.7, marginBottom:12 }}>
          Additional limitations to be aware of:
        </p>
        <ul style={{ fontSize:14, color:'var(--color-text-secondary)', lineHeight:1.9, paddingInlineStart:20 }}>
          <li>Players with fewer than 90 minutes in the selected window may have unstable ratings due to small sample size.</li>
          <li>Sofascore ratings can be affected by the match context — a player who scores an 88th-minute winner in a 1-0 game may receive a disproportionately high rating.</li>
          <li>Cross-league comparisons should be treated with caution. A 7.5 in the Botola is not the same as a 7.5 in the Premier League.</li>
          <li>Eligibility data is community-sourced and may be out of date. Always verify with the player's club or FRMF before drawing conclusions.</li>
          <li>This platform is not affiliated with FRMF, the Moroccan Football Federation.</li>
        </ul>
      </Section>

      <Section title="Data sources">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12 }}>
          {[
            { name:'Sofascore', use:'Match ratings for 200+ leagues' },
            { name:'API-Football', use:'Live scores, fixtures, lineups' },
            { name:'Transfermarkt', use:'Market values, career history' },
            { name:'Wikidata', use:'Nationality and biographical data' },
            { name:'StatsBomb Open Data', use:'xT/VAEP event data (Big 5)' },
            { name:'FBREF / Opta', use:'Advanced stats for Big 5 leagues' },
          ].map(s => (
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
