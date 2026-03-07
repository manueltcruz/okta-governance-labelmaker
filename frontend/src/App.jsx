// frontend/src/App.jsx

import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { LoginCallback, useOktaAuth } from '@okta/okta-react';

import Landing from './pages/Landing';
import MainLayout from './pages/MainLayout';
import RequiredAuth from './components/RequiredAuth';

const App = () => {
  const navigate = useNavigate();
  const { oktaAuth } = useOktaAuth();

  // Ensure Okta sends users back to where they intended to go (e.g., /app)
  // after /login/callback completes.
  const restoreOriginalUri = async (_oktaAuth, originalUri) => {
    // originalUri might be absolute; keep only path+query+hash.
    const url = originalUri ? new URL(originalUri, window.location.origin) : null;
    const relative = url ? `${url.pathname}${url.search}${url.hash}` : '/app';
    navigate(relative, { replace: true });
  };

  return (
    <Routes>
      {/* Public landing page */}
      <Route path="/" element={<Landing />} />

      {/* Okta redirect callback */}
      <Route
        path="/login/callback"
        element={<LoginCallback oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri} />}
      />

      {/* Protected application */}
      <Route
        path="/app"
        element={
          <RequiredAuth>
            <MainLayout />
          </RequiredAuth>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
