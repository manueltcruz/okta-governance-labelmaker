// frontend/src/pages/Landing.jsx

import React, { useEffect } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { useNavigate } from 'react-router-dom';

const IconTag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const IconApp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconKey = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="M21 2l-9.6 9.6"/>
    <path d="M15.5 7.5l3 3L22 7l-3-3"/>
  </svg>
);

const Feature = ({ icon, title, desc }) => (
  <div className="flex gap-4">
    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl"
      style={{ background: '#f0f0f0', border: '1px solid #ddd', color: '#4b4b4b' }}>
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
          <div style={{ height: 4, background: 'linear-gradient(90deg, #4b4b4b 0%, #36404A 100%)' }} />

          <div className="px-8 py-8">
            {/* Logo + title */}
            <div className="flex items-center gap-4 mb-8">
              <img
                src="https://companieslogo.com/img/orig/OKTA_BIG-6b340944.png?t=1720244493"
                alt="Okta"
                style={{ width: 167, height: 55, objectFit: 'contain', flexShrink: 0 }}
              />
              <div>
                <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  OIG Label Manager
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Okta Identity Governance</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-5 mb-8">
              <Feature icon={<IconTag />}   title="Label Manager"           desc="Create and manage governance label categories and values." />
              <Feature icon={<IconUsers />} title="Group Assignments"        desc="Assign governance labels to Okta directory groups." />
              <Feature icon={<IconApp />}   title="App Assignments"          desc="Assign governance labels to Okta applications." />
              <Feature icon={<IconKey />}   title="Entitlement Assignments"  desc="Assign governance labels to app entitlements." />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--color-border-subtle)', marginBottom: 24 }} />

            {/* Auth */}
            <button
              type="button"
              onClick={handleLogin}
              style={{
                width: '100%',
                padding: '10px 0',
                fontSize: '1rem',
                fontWeight: 500,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: '#6b6b6b',
                color: '#ffffff',
                letterSpacing: '-0.01em',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4b4b4b'}
              onMouseLeave={e => e.currentTarget.style.background = '#6b6b6b'}
            >
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
