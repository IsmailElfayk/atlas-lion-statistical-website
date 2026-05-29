import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const RouterContext = createContext({ path: '/', params: {}, navigate: () => {} });

export function RouterProvider({ children }) {
  const [hash, setHash] = useState(window.location.hash || '#/');
  useEffect(() => {
    const onHash = () => { setHash(window.location.hash || '#/'); window.scrollTo({ top: 0, behavior: 'auto' }); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const navigate = useCallback(to => { window.location.hash = to.startsWith('#') ? to : '#' + to; }, []);
  const raw = hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  const params = {};
  if (qs) qs.split('&').forEach(kv => { const [k, v] = kv.split('='); params[k] = decodeURIComponent(v || ''); });
  return <RouterContext.Provider value={{ path, params, navigate, raw }}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);

export function Link({ to, children, className, style, onClick }) {
  const { navigate } = useRouter();
  return (
    <a href={'#' + to} className={className} style={style}
      onClick={e => { e.preventDefault(); navigate(to); onClick?.(e); }}>
      {children}
    </a>
  );
}

export default RouterContext;
