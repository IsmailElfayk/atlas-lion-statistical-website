import { AtlasLogo } from '../ui/index.jsx';
import { Link } from '../../context/RouterContext.jsx';

export default function Footer() {
  return (
    <footer style={{borderTop:'1px solid var(--color-border)',background:'rgba(13,15,14,0.6)',padding:'40px 32px 32px',marginTop:48}}>
      <div style={{maxWidth:1440,margin:'0 auto',display:'grid',gridTemplateColumns:'1fr 1fr',gap:32}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <AtlasLogo size={24}/>
            <span style={{fontFamily:'var(--font-display)',fontSize:20,letterSpacing:'0.04em'}}>ATLAS LIONS&nbsp;<span style={{color:'var(--color-text-secondary)'}}>ANALYTICS</span></span>
          </div>
          <p style={{color:'var(--color-text-secondary)',fontSize:13,maxWidth:380,marginTop:8}}>
            Data-driven insights for the Atlas Lions — every Moroccan professional, every league, every weekend.
          </p>
          <p style={{color:'var(--color-text-tertiary)',fontSize:11,marginTop:16,maxWidth:380,fontStyle:'italic'}}>
            Rankings reflect recent form only — not a selection recommendation. Not affiliated with FRMF.
          </p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
          <div>
            <div className="eyebrow" style={{marginBottom:12}}>Navigate</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:13,color:'var(--color-text-secondary)'}}>
              <Link to="/best-xi">Best XI</Link>
              <Link to="/players">Players</Link>
              <Link to="/fixtures">Fixtures</Link>
              <Link to="/compare">Compare</Link>
              <Link to="/methodology">Methodology</Link>
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{marginBottom:12}}>Data sources</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:13,color:'var(--color-text-secondary)'}}>
              <span>Sofascore</span>
              <span>API-Football</span>
              <span>Transfermarkt</span>
              <span>Wikidata · StatsBomb</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{maxWidth:1440,margin:'32px auto 0',display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--color-border)',paddingTop:16,color:'var(--color-text-tertiary)',fontSize:11,fontFamily:'var(--font-mono)'}}>
        <span>© 2026 ATLAS LIONS ANALYTICS</span>
        <span>MIT LICENCE · v0.4.1</span>
      </div>
    </footer>
  );
}
