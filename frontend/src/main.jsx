import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/theme.css';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { RouterProvider } from './context/RouterContext.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <RouterProvider>
        <App />
      </RouterProvider>
    </LanguageProvider>
  </StrictMode>
);
