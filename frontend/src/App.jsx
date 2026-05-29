import { useRouter } from './context/RouterContext.jsx';
import { useT } from './context/LanguageContext.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import BestXIPage from './pages/BestXIPage.jsx';
import PlayersPage from './pages/PlayersPage.jsx';
import PlayerDetailPage from './pages/PlayerDetailPage.jsx';
import FixturesPage from './pages/FixturesPage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import MethodologyPage from './pages/MethodologyPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  const { path } = useRouter();
  const { locale } = useT();

  let Page = NotFoundPage;
  if (path === '/') Page = HomePage;
  else if (path === '/best-xi') Page = BestXIPage;
  else if (path === '/players') Page = PlayersPage;
  else if (path.startsWith('/players/')) Page = PlayerDetailPage;
  else if (path === '/fixtures') Page = FixturesPage;
  else if (path === '/compare') Page = ComparePage;
  else if (path === '/methodology') Page = MethodologyPage;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: 1440, margin: '0 auto', width: '100%', padding: 'calc(var(--nav-h) + 40px) 32px 0' }}>
        <Page />
      </main>
      <Footer />
    </div>
  );
}
