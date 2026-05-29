import { useRouter } from '../context/RouterContext.jsx';
import { Button } from '../components/ui/index.jsx';

export default function NotFoundPage() {
  const { navigate } = useRouter();
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', textAlign:'center', padding:'48px 24px' }}>
      <div style={{ fontFamily:'var(--font-display)', fontSize:120, lineHeight:1, color:'var(--color-border)', letterSpacing:'-0.02em' }}>404</div>
      <h1 style={{ fontFamily:'var(--font-display)', fontSize:36, marginTop:16, marginBottom:12 }}>PAGE NOT FOUND</h1>
      <p style={{ fontSize:15, color:'var(--color-text-secondary)', maxWidth:400, marginBottom:32, lineHeight:1.55 }}>
        The page you're looking for doesn't exist. It may have been moved, or the URL might be wrong.
      </p>
      <div style={{ display:'flex', gap:12 }}>
        <Button variant="primary" onClick={() => navigate('/')} iconRight={<span>→</span>}>Go home</Button>
        <Button variant="secondary" onClick={() => navigate('/players')}>Browse players</Button>
      </div>
    </div>
  );
}
