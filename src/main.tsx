import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes } from 'react-router-dom';
import './index.css';
import { renderRoutes } from '@/routes';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider } from './hooks/useAuth';
import { GlobalNotificationProvider } from './hooks/useGlobalNotification';
import GlobalNotification from './components/common/GlobalNotification';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="neuPortalTheme">
        <GlobalNotificationProvider>
          <Router>
            <Routes>
              {renderRoutes()}
            </Routes>
          </Router>
          <GlobalNotification />
        </GlobalNotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>
);
