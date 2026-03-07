// frontend/src/pages/AppAssignments.jsx
// Shows only entitlement-enabled apps.
// Selecting an app reveals three tabs:
//   1. App Labels   — assign/unassign labels on the app itself
//   2. Entitlements — list entitlements for the app
//   3. (inline)     — select an entitlement to assign/unassign labels on it

import React, { useEffect, useMemo, useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import AssignLabelForm from '../components/AssignLabelForm';
import LabelGroups from '../components/LabelGroups';

const OKTA_PARTITION = import.meta.env.VITE_OKTA_PARTITION || 'oktapreview';
const OKTA_ORG_ID    = import.meta.env.VITE_OKTA_ORG_ID    || '00ou52nw1BecRJ5jB1d6';

function buildAppOrn(appId, appType) {
  const t = String(appType || 'generic').toLowerCase();
  return `orn:${OKTA_PARTITION}:idp:${OKTA_ORG_ID}:apps:${t}:${appId}`;
}
function buildEntitlementOrn(entitlementId) {
  return `orn:${OKTA_PARTITION}:governance:${OKTA_ORG_ID}:entitlements:${entitlementId}`;
}

// ── Small helpers ──────────────────────────────────────
const Tab = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '8px 16px',
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
      borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
      background: 'transparent',
      color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
      transition: 'color 0.15s',
    }}
  >
    {label}
  </button>
);

const EmptyState = ({ title, subtitle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', border: '1.5px dashed var(--color-border)', borderRadius: 12, background: 'var(--color-bg)' }}>
    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{title}</div>
    {subtitle && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{subtitle}</div>}
  </div>
);

const ORNBlock = ({ orn }) => (
  <div className="card" style={{ marginBottom: 16 }}>
    <div className="card-header">
      <div><div className="card-title">Resource ORN</div><div className="help">Used for governance label assignments.</div></div>
    </div>
    <div className="card-body">
      <code style={{ display: 'block', padding: '10px 14px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, fontFamily: "'DM Mono', monospace", wordBreak: 'break-all' }}>
        {orn}
      </code>
    </div>
  </div>
);

// ── App list item ──────────────────────────────────────
const AppListItem = ({ app, isSelected, onSelect }) => {
  const name    = app?.label || app?.name || 'Unnamed app';
  const status  = app?.status || '';
  const logoUrl = app?._links?.logo?.[0]?.href;
  return (
    <button
      type="button"
      onClick={() => onSelect(app)}
      style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: '10px 16px', width: '100%', textAlign: 'left', cursor: 'pointer',
        background: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
        borderBottom: '1px solid var(--color-border-subtle)',
        transition: 'background 0.1s',
      }}
    >
      {logoUrl
        ? <img src={logoUrl} alt="" style={{ height: 36, width: 36, flexShrink: 0, borderRadius: 8, objectFit: 'contain', border: '1px solid var(--color-border)', background: 'white' }} />
        : <span className="avatar" style={{ fontSize: 11, flexShrink: 0 }}>{name.slice(0, 2).toUpperCase()}</span>
      }
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{app.id}</div>
      </div>
      {status && <span className={status === 'ACTIVE' ? 'pill-success' : 'pill'} style={{ fontSize: 11, flexShrink: 0 }}>{status}</span>}
    </button>
  );
};

// ── Label assignment panel (reused for app and entitlement) ──
const LabelPanel = ({ orn, assignments, isLoading, error, allLabels, onAssign, onUnassign, isBusy }) => {
  const [showForm, setShowForm] = useState(false);
  const hasAssignments = Array.isArray(assignments) && assignments.length > 0;

  const handleSave   = (id) => { onAssign(orn, id); setShowForm(false); };
  const handleDelete = (_gid, id) => onUnassign(orn, id);

  return (
    <div>
      <ORNBlock orn={orn} />
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">Assigned labels</div><div className="help">Assign or unassign governance label values.</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(isLoading || isBusy) && <span className="pill">{isBusy ? 'Working…' : 'Loading…'}</span>}
            <button type="button" className={showForm ? 'btn-secondary' : 'btn-primary'} onClick={() => setShowForm(v => !v)} disabled={isLoading}>
              {showForm ? 'Cancel' : 'Assign label'}
            </button>
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="error"><strong>Error:</strong> {error}</div>}
          {!showForm && (
            isLoading ? <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading…</div>
            : !hasAssignments ? <EmptyState title="No labels assigned" subtitle='Click "Assign label" to add a governance label.' />
            : <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}><LabelGroups data={assignments} onDeleteValue={handleDelete} /></div>
          )}
          {showForm && (
            <div style={{ borderRadius: 8, padding: 16, border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 12, color: 'var(--color-text-primary)' }}>Select a label value to assign</div>
              <AssignLabelForm allLabels={allLabels} onSave={handleSave} onCancel={() => setShowForm(false)} isLoading={isBusy} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Accordion row shared component ────────────────────
const AccordionRow = ({ label, sublabel, isOpen, isSelected, onClick, badge, chevronRight }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 16px', width: '100%', textAlign: 'left', cursor: 'pointer',
      background: isOpen ? 'var(--color-accent-subtle)' : isSelected ? 'var(--color-bg)' : 'transparent',
      borderBottom: '1px solid var(--color-border-subtle)',
      transition: 'background 0.1s',
    }}
  >
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        color: isOpen ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
        {label}
      </div>
      {sublabel && (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {sublabel}
        </div>
      )}
    </div>
    {badge && <span className="pill" style={{ fontSize: 11, flexShrink: 0 }}>{badge}</span>}
    <span style={{ fontSize: 12, color: isOpen ? 'var(--color-accent)' : 'var(--color-text-muted)', flexShrink: 0, transition: 'transform 0.15s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</span>
  </button>
);

// ── Entitlements tab — full accordion ──────────────────
// Level 1: entitlement categories (always visible)
// Level 2: values within a category (expands inline under category row)
// Level 3: label panel for a selected value (expands inline under value row)
const EntitlementsTab = ({ app, allLabels, getToken }) => {
  const [categories, setCategories]   = useState(null);
  const [loadingCats, setLoadingCats] = useState(false);
  const [catsError, setCatsError]     = useState(null);

  // Map of categoryId -> { values, loading, error }
  const [catData, setCatData] = useState({});

  // Which category is open
  const [openCatId, setOpenCatId] = useState(null);
  // Which value is open (globally unique since value IDs are unique)
  const [openValueId, setOpenValueId] = useState(null);

  // Load categories on mount
  useEffect(() => {
    if (!app?.id) return;
    setOpenCatId(null); setOpenValueId(null); setCatData({});
    setCategories(null); setCatsError(null); setLoadingCats(true);
    const load = async () => {
      try {
        const token = getToken();
        const res   = await fetch(`/api/apps/${app.id}/entitlements`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(await res.text());
        setCategories(await res.json());
      } catch (err) { setCatsError(err?.message || 'Failed to load entitlements.'); }
      finally { setLoadingCats(false); }
    };
    load();
  }, [app?.id]);

  const toggleCategory = async (cat) => {
    const isOpening = openCatId !== cat.id;
    setOpenCatId(isOpening ? cat.id : null);
    setOpenValueId(null);

    // Fetch values if not already loaded
    if (isOpening && !catData[cat.id]) {
      setCatData(prev => ({ ...prev, [cat.id]: { values: null, loading: true, error: null } }));
      try {
        const token = getToken();
        const res   = await fetch(`/api/entitlements/${cat.id}/values`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(await res.text());
        const values = await res.json();
        setCatData(prev => ({ ...prev, [cat.id]: { values, loading: false, error: null } }));
      } catch (err) {
        setCatData(prev => ({ ...prev, [cat.id]: { values: null, loading: false, error: err?.message || 'Failed to load values.' } }));
      }
    }
  };

  if (loadingCats) return <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', padding: 8 }}>Loading entitlements…</div>;
  if (catsError)   return <div className="error"><strong>Error:</strong> {catsError}</div>;
  if (!categories || categories.length === 0) return <EmptyState title="No entitlements found" subtitle="No entitlements are configured for this application." />;

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="card-header">
        <div><div className="card-title">Entitlement categories</div><div className="help">Expand a category to browse values and assign labels.</div></div>
        <span className="pill">{categories.length} categories</span>
      </div>

      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {categories.map(cat => {
          const cd       = catData[cat.id] || {};
          const isOpen   = openCatId === cat.id;

          return (
            <li key={cat.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>

              {/* ── Level 1: category row ── */}
              <AccordionRow
                label={cat.name}
                sublabel={`ID: ${cat.id}`}
                isOpen={isOpen}
                onClick={() => toggleCategory(cat)}
              />

              {/* ── Level 2: values (expanded inline) ── */}
              {isOpen && (
                <div style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border-subtle)' }}>
                  {cd.loading && (
                    <div style={{ padding: '10px 16px 10px 32px', fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading values…</div>
                  )}
                  {cd.error && (
                    <div style={{ padding: '10px 16px 10px 32px' }}><div className="error">{cd.error}</div></div>
                  )}
                  {cd.values && cd.values.length === 0 && (
                    <div style={{ padding: '10px 16px 10px 32px', fontSize: 13, color: 'var(--color-text-muted)' }}>No values configured for this category.</div>
                  )}
                  {cd.values && cd.values.map(val => {
                    const isValueOpen = openValueId === val.id;
                    return (
                      <div key={val.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>

                        {/* ── Level 2 row: value ── */}
                        <div style={{ paddingLeft: 24 }}>
                          <AccordionRow
                            label={val.name}
                            sublabel={val.externalValue || null}
                            isOpen={isValueOpen}
                            onClick={() => setOpenValueId(isValueOpen ? null : val.id)}
                          />
                        </div>

                        {/* ── Level 3: label panel (expanded inline) ── */}
                        {isValueOpen && (
                          <div style={{ paddingLeft: 48, paddingRight: 16, paddingTop: 16, paddingBottom: 16, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border-subtle)' }}>
                            <EntitlementValuePanel
                              key={val.id}
                              value={val}
                              allLabels={allLabels}
                              getToken={getToken}
                            />
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ── Entitlement value label panel ─────────────────────
const EntitlementValuePanel = ({ value, allLabels, getToken }) => {
  const [assignments, setAssignments] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [isBusy, setIsBusy]           = useState(false);

  const orn = value?.orn || buildEntitlementOrn(value?.id);

  useEffect(() => {
    if (!value?.id) return;
    setLoading(true); setError(null); setAssignments(null);
    const load = async () => {
      try {
        const token = getToken();
        const res   = await fetch(`/api/assigned-labels?orn=${encodeURIComponent(orn)}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(await res.text());
        setAssignments(await res.json());
      } catch (err) { setError(err?.message || 'Failed to load labels.'); }
      finally { setLoading(false); }
    };
    load();
  }, [value?.id]);

  const handleAssign = async (o, labelValueId) => {
    setIsBusy(true); setError(null);
    try {
      const token = getToken();
      const res   = await fetch('/api/assignments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orn: o, labelValueId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const r2 = await fetch(`/api/assigned-labels?orn=${encodeURIComponent(o)}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setAssignments(await r2.json());
    } catch (err) { setError(err?.message || 'Failed to assign label.'); }
    finally { setIsBusy(false); }
  };

  const handleUnassign = async (o, labelValueId) => {
    if (!window.confirm('Unassign this label?')) return;
    setIsBusy(true); setError(null);
    try {
      const token = getToken();
      const res   = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orn: o, labelValueId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const r2 = await fetch(`/api/assigned-labels?orn=${encodeURIComponent(o)}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setAssignments(await r2.json());
    } catch (err) { setError(err?.message || 'Failed to unassign label.'); }
    finally { setIsBusy(false); }
  };

  return (
    <LabelPanel
      orn={orn}
      assignments={assignments}
      isLoading={loading}
      error={error}
      allLabels={allLabels}
      onAssign={handleAssign}
      onUnassign={handleUnassign}
      isBusy={isBusy}
    />
  );
};

// ── App detail panel ───────────────────────────────────
const AppDetail = ({ app, allLabels, getToken }) => {
  const [activeTab, setActiveTab]     = useState('labels');
  const [assignments, setAssignments] = useState(null);
  const [loadingAssign, setLoading]   = useState(false);
  const [assignError, setError]       = useState(null);
  const [isBusy, setIsBusy]           = useState(false);

  const orn = useMemo(() => buildAppOrn(app?.id, app?.signOnMode), [app?.id, app?.signOnMode]);

  // Load app label assignments whenever app changes
  useEffect(() => {
    if (!app?.id) return;
    setActiveTab('labels');
    setAssignments(null);
    setError(null);
    setLoading(true);
    const load = async () => {
      try {
        const token = getToken();
        const res   = await fetch(`/api/assigned-labels?orn=${encodeURIComponent(orn)}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(await res.text());
        setAssignments(await res.json());
      } catch (err) { setError(err?.message || 'Failed to load assigned labels.'); }
      finally { setLoading(false); }
    };
    load();
  }, [app?.id]);

  const handleAssign = async (orn, labelValueId) => {
    setIsBusy(true); setError(null);
    try {
      const token = getToken();
      const res   = await fetch('/api/assignments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orn, labelValueId }),
      });
      if (!res.ok) throw new Error(await res.text());
      // Refresh
      const r2 = await fetch(`/api/assigned-labels?orn=${encodeURIComponent(orn)}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setAssignments(await r2.json());
    } catch (err) { setError(err?.message || 'Failed to assign label.'); }
    finally { setIsBusy(false); }
  };

  const handleUnassign = async (orn, labelValueId) => {
    if (!window.confirm('Unassign this label from the application?')) return;
    setIsBusy(true); setError(null);
    try {
      const token = getToken();
      const res   = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orn, labelValueId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const r2 = await fetch(`/api/assigned-labels?orn=${encodeURIComponent(orn)}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      setAssignments(await r2.json());
    } catch (err) { setError(err?.message || 'Failed to unassign label.'); }
    finally { setIsBusy(false); }
  };

  const name    = app?.label || app?.name || 'Unnamed app';
  const logoUrl = app?._links?.logo?.[0]?.href;

  return (
    <div>
      {/* App identity header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        {logoUrl
          ? <img src={logoUrl} alt="" style={{ height: 48, width: 48, flexShrink: 0, borderRadius: 12, objectFit: 'contain', border: '1px solid var(--color-border)', background: 'white' }} />
          : <span className="avatar" style={{ height: 48, width: 48, fontSize: 13, borderRadius: 12, flexShrink: 0 }}>{name.slice(0, 2).toUpperCase()}</span>
        }
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em', margin: 0 }}>{name}</h2>
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span className={app?.status === 'ACTIVE' ? 'pill-success' : 'pill'}>{app?.status}</span>
            {app?.signOnMode && <span className="pill">{app.signOnMode}</span>}
            <span className="pill-blue">Entitlement management enabled</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 20 }}>
        <Tab label="App Labels"    active={activeTab === 'labels'}       onClick={() => setActiveTab('labels')} />
        <Tab label="Entitlements"  active={activeTab === 'entitlements'} onClick={() => setActiveTab('entitlements')} />
      </div>

      {/* Tab content */}
      {activeTab === 'labels' && (
        <LabelPanel
          orn={orn}
          assignments={assignments}
          isLoading={loadingAssign}
          error={assignError}
          allLabels={allLabels}
          onAssign={handleAssign}
          onUnassign={handleUnassign}
          isBusy={isBusy}
        />
      )}

      {activeTab === 'entitlements' && (
        <EntitlementsTab app={app} allLabels={allLabels} getToken={getToken} />
      )}
    </div>
  );
};

// ── Main page ──────────────────────────────────────────
const AppAssignments = () => {
  const { authState, oktaAuth } = useOktaAuth();

  const [apps, setApps]             = useState(null);
  const [loadingApps, setLoading]   = useState(true);
  const [appsError, setAppsError]   = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [allLabels, setAllLabels]     = useState([]);

  const getToken = () => oktaAuth.getAccessToken();

  useEffect(() => {
    if (!authState?.isAuthenticated) return;
    const load = async () => {
      setLoading(true); setAppsError(null);
      try {
        const token = getToken();
        const [appsRes, labelsRes] = await Promise.all([
          fetch('/api/apps/entitlement-enabled', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/governance-labels',         { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!appsRes.ok)   throw new Error(`Failed to fetch apps: ${await appsRes.text()}`);
        if (!labelsRes.ok) throw new Error(`Failed to fetch labels: ${await labelsRes.text()}`);
        setApps(await appsRes.json());
        const ld = await labelsRes.json();
        setAllLabels(ld?.data || []);
      } catch (err) { setAppsError(err?.message || 'Failed to load.'); }
      finally { setLoading(false); }
    };
    load();
  }, [authState]);

  const filteredApps = useMemo(() => {
    if (!apps) return [];
    const q = searchTerm.trim().toLowerCase();
    return q ? apps.filter(a => String(a?.label || a?.name || '').toLowerCase().includes(q)) : apps;
  }, [apps, searchTerm]);

  if (!authState?.isAuthenticated) return <div className="card" style={{ padding: 16, fontSize: 13 }}>Please sign in.</div>;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

      {/* Left — app list */}
      <section className="lg:col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="label" style={{ display: 'block', marginBottom: 8 }}>Applications</div>
          <input type="text" className="input" placeholder="Filter by name…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {apps && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>{filteredApps.length} of {apps.length} apps</div>}
        </div>

        {loadingApps && <div className="card" style={{ padding: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading apps…</div>}
        {appsError   && <div className="error"><strong>Error:</strong> {appsError}</div>}

        {!loadingApps && apps && (
          <div className="card" style={{ overflow: 'hidden' }}>
            {filteredApps.length === 0
              ? <div style={{ padding: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {apps.length === 0 ? 'No apps with entitlement management enabled found.' : 'No apps match your search.'}
                </div>
              : <ul>{filteredApps.map(app => (
                  <li key={app.id}>
                    <AppListItem app={app} isSelected={selectedApp?.id === app.id} onSelect={setSelectedApp} />
                  </li>
                ))}</ul>
            }
          </div>
        )}
      </section>

      {/* Right — app detail */}
      <section className="lg:col-span-8">
        {!selectedApp
          ? <div className="card" style={{ padding: 48 }}><EmptyState title="No application selected" subtitle="Select an app on the left to manage its labels and entitlements." /></div>
          : <div className="card" style={{ padding: 24 }}>
              <AppDetail app={selectedApp} allLabels={allLabels} getToken={getToken} />
            </div>
        }
      </section>

    </div>
  );
};

export default AppAssignments;
