// frontend/src/pages/Landing.jsx

import React, { useEffect } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { useNavigate } from 'react-router-dom';

const IconOkta = () => (
  <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="24" fill="#0057FF"/>
    <circle cx="24" cy="24" r="10" fill="white"/>
    <circle cx="24" cy="24" r="5" fill="#0057FF"/>
  </svg>
);

const Feature = ({ icon, title, desc }) => (
  <div className="flex gap-4">
    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-lg"
      style={{ background: 'var(--color-accent-subtle)', border: '1px solid #c7d7fe' }}>
      {icon}
    </div>
    <div>
      <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-text-primary)' }}>{title}</div>
      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{desc}</div>
    </div>
  </div>
);

const Landing = () => {
  const { authState, oktaAuth } = useOktaAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState?.isAuthenticated) navigate('/app', { replace: true });
  }, [authState, navigate]);

  const handleLogin = async () => {
    await oktaAuth.signInWithRedirect({ originalUri: '/app' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Card */}
        <div className="card overflow-hidden">
          {/* Top accent bar */}
          <div style={{ height: 4, background: 'linear-gradient(90deg, #0057FF 0%, #4f8fff 100%)' }} />

          <div className="px-8 py-8">
            {/* Logo + title */}
            <div className="flex items-center gap-3 mb-8">
              <IconOkta />
              <div>
                <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  IGA Label Manager
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Okta Identity Governance</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-5 mb-8">
              <Feature icon="🏷️" title="Label Manager"       desc="Create and manage governance label categories and values." />
              <Feature icon="👥" title="Group Assignments"   desc="Assign governance labels to Okta directory groups." />
              <Feature icon="⚙️" title="App Assignments"     desc="Assign governance labels to Okta applications." />
              <Feature icon="🔑" title="Entitlement Assignments" desc="Assign governance labels to app entitlements." />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--color-border-subtle)', marginBottom: 24 }} />

            {/* Auth */}
            <button type="button" className="btn-primary w-full justify-center py-2.5 text-base" onClick={handleLogin}>
              Sign in with Okta
            </button>

            {authState && (
              <div className="mt-4 text-center">
                <span className={authState.isAuthenticated ? 'pill-success' : 'pill'}>
                  {authState.isAuthenticated ? '✓ Authenticated' : 'Not signed in'}
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Requires Okta Identity Governance to be enabled on your tenant.
        </p>
      </div>
    </div>
  );
};

export default Landing;
