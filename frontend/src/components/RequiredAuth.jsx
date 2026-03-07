// frontend/src/components/RequiredAuth.jsx

import React from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { Navigate, useLocation } from 'react-router-dom';

const RequiredAuth = ({ children }) => {
  const { authState } = useOktaAuth();
  const location = useLocation();

  if (!authState) {
    return <div className="p-6 text-sm text-slate-600">Loading authentication…</div>;
  }

  if (!authState.isAuthenticated) {
    // Do NOT auto-redirect to Okta.
    // Send them to the landing page where they can click "Log in".
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default RequiredAuth;
