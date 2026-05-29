import { useT } from '../context/LanguageContext.jsx';
import { Card } from '../components/ui/index.jsx';
import { Link } from '../context/RouterContext.jsx';

const NT_STATS = {
  year: 2026,
  internationalsPlayed: 22,
  formLast10: ['W','W','D','L','W','W','D','W','W','W'],
  kpis: {
    goalsScored:   { value: 41, prev: 36 },
    goalsConceded: { value: 12, prev: 17 },
    cleanSheets:   { value: 13, prev: 10 },
    winRate:       { value: 68, prev: 61 },
  },
  perMatch: [
    { gf:2, ga:1, xg:1.80 }, { gf:3, ga:0, xg:2.30 }, { gf:1, ga:1, xg:1.20 },
    { gf:0, ga:2, xg:0.90 }, { gf:2, ga:0, xg:1.95 }, { gf:3, ga:1, xg:2.60 },
    { gf:1, ga:1, xg:1.40 }, { gf:4, ga:0, xg:3.10 }, { gf:2, ga:0, xg:1.75 },
    { gf:1, ga:0, xg:1.30 }, { gf:3, ga:1, xg:2.40 }, { gf:0, ga:1, xg:0.80 },
    { gf:2, ga:2, xg:2.10 }, { gf:1, ga:0, xg:1.50 }, { gf:3, ga:0, xg:2.80 },
    { gf:2, ga:1, xg:1.90 }, { gf:1, ga:1, xg:1.35 }, { gf:4, ga:1, xg:3.50 },
    { gf:2, ga:0, xg:2.05 }, { gf:3, ga:0, xg:2.20 },
  ],
};

const TOP_CONTRIBUTORS = [
  { slug:'diaz',       name:'Brahim Díaz',        pos:'CAM', club:'Real Madrid',   caps:12, goals:6, assists:5, avg:7.9 },
  { slug:'hakimi',     name:'Achraf Hakimi',       pos:'RB',  club:'PSG',           caps:13, goals:3, assists:6, avg:7.8 },
  { slug:'ennesyri',   name:'Youssef En-Nesyri',   pos:'ST',  club:'Fenerbahçe',    caps:14, goals:9, assists:2, avg:7.7 },
  { slug:'saibari',    name:'Ismael Saibari',       pos:'CAM', club:'PSV',           caps:10, goals:4, assists:4, avg:7.5 },
  { slug:'bounou',     name:'Yassine Bounou',       pos:'GK',  club:'Al-Hilal',      caps:13, goals:0, assists:0, avg:7.5 },
  { slug:'kaabi',      name:'Ayoub El Kaabi',       pos:'ST',  club:'Olympiacos',    caps:11, goals:7, assists:1, avg:7.4 },
  { slug:'aguerd',     name:'Nayef Aguerd',         pos:'CB',  club:'Real Sociedad', caps:11, goals:1, assists:0, avg:7.4 },
  { slug:'ounahi',     name:'Azzedine Ounahi',      pos:'CM',  club:'Girona',        caps:12, goals:2, assists:3, avg:7.3 },
  { slug:'amrabat',    name:'Sofyan Amrabat',       pos:'CDM', club:'Fenerbahçe',    caps:12, goals:0, assists:1, avg:7.2 },
  { slug:'ezzalzouli', name:'Abde Ezzalzouli',      pos:'LW',  club:'Real Betis',    caps:9,  goals:3, assists:3, avg:7.2 },
];

const RECENT_RESULTS = [
  { date:'2026-03-25', opp:'Tunisia',   comp:'FIFA Friendly',   score:[2,1], result:'W', scorers:['En-Nesyri','Díaz'] },
  { date:'2026-03-21', opp:'Zambia',    comp:'AFCON Qualifier', score:[3,0], result:'W', scorers:['Kaabi 2','Hakimi'] },
  { date:'2025-11-18', opp:'Gabon',     comp:'WC Qualifier',    score:[1,1], result:'D', scorers:['En-Nesyri'] },
  { date:'2025-11-14', opp:'Congo',     comp:'WC Qualifier',    score:[2,0], result:'W', scorers:['Díaz','Saibari'] },
  { date:'2025-10-14', opp:'Spain',     comp:'FIFA Friendly',   score:[1,2], result:'L', scorers:['Ezzalzouli'] },
  { date:'2025-10-10', opp:'Tanzania',  comp:'AFCON Qualifier', score:[4,0], result:'W', scorers:['Kaabi 2','En-Nesyri','Ounahi'] },
  { date:'2025-09-09', opp:'Comoros',   comp:'AFCON Qualifier', score:[2,0], result:'W', scorers:['Díaz','Hakimi'] },
  { date:'2025-09-05', opp:'Eritrea',   comp:'WC Qualifier',    score:[3,1], result:'W', scorers:['En-Nesyri 2','Saibari'] },
];

function formColor(r) {
  if (r === 'W') return '#39B57A';
  if (r === 'L') return '#E84856';
  return 'var(--color-gold)';
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' });
}

function GoalsChart({ data }) {
  const W = 460, H = 200, P = { t:14, r:14, b:24, l:28 };
  const iW = W - P.l - P.r, iH = H - P.t - P.b;
  const maxG = Math.max(4, ...data.map(d => d.gf));
  const xAt = i => P.l + (i / (data.length - 1)) * iW;
  const yAt = v => P.t + (1 - v / maxG) * iH;
  const pathD = data.map((d, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)} ${yAt(d.gf).toFixed(1)}`).join(' ');
  const area = `${pathD} L${xAt(data.length-1)} ${P.t+iH} L${P.l} ${P.t+iH}Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display:'block' }}>
      <defs>
        <linearGradient id="nt-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,122,61,0.4)"/>
          <stop offset="100%" stopColor="rgba(0,122,61,0)"/>
        </linearGradient>
      </defs>
      {[0,1,2,3,4].filter(v => v <= maxG).map(v => (
        <g key={v}>
          <line x1={P.l} x2={P.l+iW} y1={yAt(v)} y2={yAt(v)} stroke="var(--color-border)" strokeWidth="0.5"/>
          <text x={P.l-6} y={yAt(v)+3} fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-text-tertiary)" textAnchor="end">{v}</text>
        </g>
      ))}
      <path d={area} fill="url(#nt-g)"/>
      <path d={pathD} stroke="var(--color-green)" strokeWidth="2" fill="none"/>
      {data.map((d, i) => (
        <circle key={i} cx={xAt(i)} cy={yAt(d.gf)} r="2.5" fill="var(--color-green)" stroke="var(--color-bg)" strokeWidth="1"/>
      ))}
    </svg>
  );
}

function XGChart({ data }) {
  const W = 460, H = 200, P = { t:14, r:14, b:30, l:28 };
  const iW = W - P.l - P.r, iH = H - P.t - P.b;
  const maxV = Math.max(4, ...data.map(d => Math.max(d.gf, d.xg)));
  const bw = iW / data.length;
  const yAt = v => P.t + (1 - v / maxV) * iH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display:'block' }}>
      {[0,1,2,3,4].filter(v => v <= maxV).map(v => (
        <g key={v}>
          <line x1={P.l} x2={P.l+iW} y1={yAt(v)} y2={yAt(v)} stroke="var(--color-border)" strokeWidth="0.5"/>
          <text x={P.l-6} y={yAt(v)+3} fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-text-tertiary)" textAnchor="end">{v}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = P.l + i * bw;
        return (
          <g key={i}>
            <rect x={x + bw*0.18} y={yAt(d.gf)} width={bw*0.36} height={P.t+iH-yAt(d.gf)} fill="var(--color-red)" rx="1"/>
            <rect x={x + bw*0.5}  y={yAt(d.xg)} width={bw*0.36} height={P.t+iH-yAt(d.xg)} fill="rgba(212,175,55,0.55)" rx="1"/>
          </g>
        );
      })}
      <g transform={`translate(${P.l},${H-8})`}>
        <rect width="9" height="9" rx="2" fill="var(--color-red)"/>
        <text x="13" y="8" fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-text-secondary)">Goals</text>
        <rect x="56" width="9" height="9" rx="2" fill="rgba(212,175,55,0.55)"/>
        <text x="69" y="8" fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-text-secondary)">xG</text>
      </g>
    </svg>
  );
}

function RatingBadge({ avg }) {
  const color = avg >= 8 ? '#39B57A' : avg >= 7 ? 'var(--color-gold)' : 'var(--color-text-secondary)';
  return (
    <span style={{
      display:'inline-block', minWidth:36, padding:'2px 7px', borderRadius:4, textAlign:'center',
      fontFamily:'var(--font-mono)', fontWeight:700, fontSize:12,
      color: '#fff', background: color,
    }}>{avg.toFixed(1)}</span>
  );
}

export default function StatsPage() {
  const { t } = useT();
  const S = NT_STATS;

  const kpis = [
    { k:'goalsScored',   label:'Goals scored',   better:'up' },
    { k:'goalsConceded', label:'Goals conceded', better:'down' },
    { k:'cleanSheets',   label:'Clean sheets',   better:'up' },
    { k:'winRate',       label:'Win rate',       better:'up', suffix:'%' },
  ];

  return (
    <div className="fade-up">
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
        <span style={{ fontSize:26 }}>🇲🇦</span>
        <div className="eyebrow" style={{ color:'var(--color-red)' }}>
          National Team · {S.year} · {S.internationalsPlayed} internationals
        </div>
      </div>
      <h1 style={{ fontSize:48, lineHeight:1, marginBottom:24 }}>MOROCCO — ATLAS LIONS</h1>

      {/* Form strip */}
      <Card padding={18} style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
          <div className="eyebrow">Form · last 10</div>
          <div style={{ display:'flex', gap:6 }}>
            {S.formLast10.map((r, i) => (
              <span key={i} style={{
                width:30, height:30, borderRadius:6, display:'inline-flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--font-display)', fontSize:16,
                color: r === 'D' ? '#0D0F0E' : '#fff',
                background: formColor(r),
                opacity: 0.55 + (i / S.formLast10.length) * 0.45,
              }}>{r}</span>
            ))}
          </div>
        </div>
      </Card>

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14, marginBottom:24 }} className="stats-kpi-grid">
        {kpis.map(kp => {
          const data = S.kpis[kp.k];
          const delta = data.value - data.prev;
          const positive = kp.better === 'up' ? delta > 0 : delta < 0;
          return (
            <Card key={kp.k} padding={18}>
              <div className="eyebrow" style={{ marginBottom:8 }}>{kp.label}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:46, lineHeight:1, letterSpacing:'-0.01em' }}>
                {data.value}{kp.suffix || ''}
              </div>
              <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:6, fontSize:12, fontFamily:'var(--font-mono)' }}>
                <span style={{ color: positive ? 'var(--color-green)' : '#E84856' }}>
                  {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}{kp.suffix || ''}
                </span>
                <span style={{ color:'var(--color-text-tertiary)' }}>vs {S.year - 1}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }} className="stats-chart-grid">
        <Card padding={20}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, letterSpacing:'0.02em', marginBottom:4 }}>Goals per match</h3>
          <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:14 }}>Last 20 internationals</div>
          <GoalsChart data={S.perMatch}/>
        </Card>
        <Card padding={20}>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, letterSpacing:'0.02em', marginBottom:4 }}>xG vs goals scored</h3>
          <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:14 }}>Finishing vs expected · last 20</div>
          <XGChart data={S.perMatch}/>
        </Card>
      </div>

      {/* Top contributors + recent results */}
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:24 }} className="stats-bottom-grid">

        <Card padding={0}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--color-border)' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, letterSpacing:'0.02em' }}>Top contributors</h3>
            <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:2 }}>Morocco-only ratings · last 365 days</div>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr style={{ background:'var(--color-surface-2)' }}>
                {['#','Player','Caps','G','A','Avg'].map(h => (
                  <th key={h} style={{
                    padding:'8px 14px', fontFamily:'var(--font-mono)', fontSize:9,
                    letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--color-text-secondary)',
                    textAlign: h === 'Player' ? 'start' : 'center',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOP_CONTRIBUTORS.map((c, i) => (
                <tr key={c.slug} style={{ borderTop:'1px solid var(--color-border)', cursor:'pointer', transition:'background 100ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => window.location.hash = `/players/${c.slug}`}>
                  <td style={{ padding:'9px 14px', textAlign:'center', fontFamily:'var(--font-mono)', color:'var(--color-gold)', fontWeight:600 }}>{i+1}</td>
                  <td style={{ padding:'9px 14px' }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div>
                      <div style={{ fontSize:10, color:'var(--color-text-tertiary)', fontFamily:'var(--font-mono)' }}>{c.club} · {c.pos}</div>
                    </div>
                  </td>
                  <td style={{ padding:'9px 14px', textAlign:'center', fontFamily:'var(--font-mono)' }}>{c.caps}</td>
                  <td style={{ padding:'9px 14px', textAlign:'center', fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--color-green)' }}>{c.goals}</td>
                  <td style={{ padding:'9px 14px', textAlign:'center', fontFamily:'var(--font-mono)' }}>{c.assists}</td>
                  <td style={{ padding:'9px 14px', textAlign:'center' }}><RatingBadge avg={c.avg}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card padding={0}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--color-border)' }}>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, letterSpacing:'0.02em' }}>Recent results</h3>
          </div>
          <div>
            {RECENT_RESULTS.map((r, i) => (
              <div key={i} style={{
                padding:'12px 18px', borderTop: i === 0 ? 'none' : '1px solid var(--color-border)',
                display:'flex', alignItems:'center', gap:12,
              }}>
                <span style={{
                  width:24, height:24, borderRadius:5, flexShrink:0,
                  display:'inline-flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'var(--font-display)', fontSize:13,
                  color: r.result === 'D' ? '#0D0F0E' : '#fff',
                  background: formColor(r.result),
                }}>{r.result}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>
                    MAR {r.score[0]}–{r.score[1]} {r.opp}
                  </div>
                  <div style={{ fontSize:10.5, color:'var(--color-text-tertiary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {r.comp} · {r.scorers.join(', ')}
                  </div>
                </div>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--color-text-tertiary)', whiteSpace:'nowrap' }}>
                  {fmtDate(r.date)}
                </span>
              </div>
            ))}
          </div>
        </Card>

      </div>

      <style>{`
        @media (max-width: 980px) {
          .stats-kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-chart-grid, .stats-bottom-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
