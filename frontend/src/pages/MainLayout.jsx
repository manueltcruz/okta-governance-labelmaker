// frontend/src/pages/MainLayout.jsx
// Redesigned: left sidebar navigation + polished header

import React, { useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import ProfileDropdown from '../components/ProfileDropdown';
import LabelManager from './LabelManager';
import GroupAssignments from './GroupAssignments';
import AppAssignments from './AppAssignments';
import LabelSearch from './LabelSearch';

// ── Icons ──────────────────────────────────────────────
const IconTag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const IconApp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);



// ── Nav config ─────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'labels',        label: 'Label Manager',  icon: <IconTag />,    description: 'Categories & values',  section: 'Manage' },
  { id: 'groups',        label: 'Groups',          icon: <IconUsers />,  description: 'Directory groups',     section: 'Manage' },
  { id: 'apps',          label: 'Applications',    icon: <IconApp />,    description: 'Okta applications',    section: 'Manage' },
  { id: 'label-search',  label: 'Label Search',    icon: <IconSearch />, description: 'Find resources by label', section: 'Explore' },
];

// ── Sidebar ────────────────────────────────────────────
const Sidebar = ({ activePage, onNavigate, userName, onLogout }) => {
  const sections = ['Manage', 'Explore'];
  return (
    <aside className="flex h-screen w-64 flex-none flex-col border-r" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      {/* Logo */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
        <img
          src="https://companieslogo.com/img/orig/OKTA_BIG-6b340944.png?t=1720244493"
          alt="Okta"
          style={{ height: 20, width: 'auto', display: 'block', marginBottom: 6 }}
        />
        <div className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
          OIG Manager
        </div>
        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Governance Labels</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {sections.map(section => {
          const items = NAV_ITEMS.filter(i => i.section === section);
          return (
            <div key={section} style={{ marginBottom: 12 }}>
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
                {section}
              </div>
              {items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`nav-item w-full text-left ${activePage === item.id ? 'active' : ''}`}
                >
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-md" style={{
                    background: activePage === item.id ? 'var(--color-accent-subtle)' : 'var(--color-bg)',
                    border: `1px solid ${activePage === item.id ? '#c7d7fe' : 'var(--color-border)'}`,
                    color: activePage === item.id ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  }}>
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm leading-tight">{item.label}</div>
                    <div className="truncate text-xs" style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
        <ProfileDropdown userName={userName} onLogout={onLogout} />
      </div>
    </aside>
  );
};

// ── Page header ────────────────────────────────────────
const PageHeader = ({ page }) => {
  const item = NAV_ITEMS.find(n => n.id === page);
  if (!item) return null;
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{
        background: 'var(--color-accent-subtle)',
        border: '1px solid #c7d7fe',
        color: 'var(--color-accent)',
      }}>
        {item.icon}
      </span>
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
          {item.label}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p>
      </div>
    </div>
  );
};

// ── Main Layout ────────────────────────────────────────
const MainLayout = () => {
  const { authState, oktaAuth } = useOktaAuth();
  const [activePage, setActivePage] = useState('labels');

  if (!authState) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="card p-8 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading…</div>
      </div>
    );
  }

  const userName = authState.idToken?.claims?.name || 'User';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        userName={userName}
        onLogout={async () => oktaAuth.signOut()}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="page">
          <PageHeader page={activePage} />
          {activePage === 'labels'       && <LabelManager />}
          {activePage === 'groups'       && <GroupAssignments />}
          {activePage === 'apps'         && <AppAssignments />}
          {activePage === 'label-search' && <LabelSearch />}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
