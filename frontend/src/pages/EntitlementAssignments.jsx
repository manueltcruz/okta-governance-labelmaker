// frontend/src/pages/EntitlementAssignments.jsx
// Three-level drill-down: App → Entitlement → Label assignments

import React, { useEffect, useMemo, useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import AssignLabelForm from '../components/AssignLabelForm';
import LabelGroups from '../components/LabelGroups';

const OKTA_PARTITION = import.meta.env.VITE_OKTA_PARTITION || 'oktapreview';
const OKTA_ORG_ID    = import.meta.env.VITE_OKTA_ORG_ID    || '00ou52nw1BecRJ5jB1d6';

function buildEntitlementOrn(appId, entitlementId) {
  return `orn:${OKTA_PARTITION}:governance:${OKTA_ORG_ID}:entitlements:${entitlementId}`;
}

// ── Shared list item ───────────────────────────────────
const ListItem = ({ primary, secondary, badge, badgeVariant = 'pill', isSelected, onClick, logoUrl }) => {
  const initials = String(primary || '??').slice(0, 2).toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: '10px 16px', width: '100%', textAlign: 'left', cursor: 'pointer',
        background: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
        borderBottom: '1px solid var(--color-border-subtle)',
        transition: 'background 0.1s',
      }}
    >
      {logoUrl ? (
        <img src={logoUrl} alt="" style={{ height: 36, width: 36, flexShrink: 0, borderRadius: 8, objectFit: 'contain', border: '1px solid var(--color-border)', background: 'white' }} />
      ) : (
        <span className="avatar" style={{ fontSize: 11, flexShrink: 0 }}>{initials}</span>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{primary}</div>
        {secondary && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{secondary}</div>}
      </div>
      {badge && <span className={badgeVariant} style={{ fontSize: 11, flexShrink: 0 }}>{badge}</span>}
    </button>
  );
};

// ── Empty state ────────────────────────────────────────
const EmptyState = ({ title, subtitle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', border: '1.5px dashed var(--color-border)', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg)' }}>
    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{title}</div>
    {subtitle && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{subtitle}</div>}
  </div>
);

// ── Breadcrumb ─────────────────────────────────────────
const Breadcrumb = ({ app, entitlement, onClickApp }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 20 }}>
    <button type="button" onClick={onClickApp} style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12 }}>
      {app?.label || app?.name}
    </button>
    {entitlement && (
      <>
        <span>›</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>{entitlement?.displayName || entitlement?.name}</span>
      </>
    )}
  </div>
);

// ── Entitlement detail panel ───────────────────────────
const EntitlementDetail = ({ app, entitlement, assignments, isLoading, error, allLabels, onAssign, onUnassign, isBusy, onBack }) => {
  const [showAssignForm, setShowAssignForm] = useState(false);

  const orn  = useMemo(() => buildEntitlementOrn(app?.id, entitlement?.id), [app?.id, entitlement?.id]);
  const name = entitlement?.displayName || entitlement?.name || 'Unnamed entitlement';
  const hasAssignments = Array.isArray(assignments) && assignments.length > 0;

  const handleSave   = (labelValueId) => { onAssign(orn, labelValueId); setShowAssignForm(false); };
  const handleDelete = (_gid, labelValueId) => onUnassign(orn, labelValueId);

  return (
    <div className="space-y-5">
      <Breadcrumb app={app} entitlement={entitlement} onClickApp={onBack} />

      {/* Identity */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
          <span className="avatar" style={{ height: 48, width: 48, fontSize: 13, borderRadius: 'var(--radius-lg)', flexShrink: 0 }}>
            {name.slice(0, 2).toUpperCase()}
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</h2>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {entitlement?.type && <span className="pill">{entitlement.type}</span>}
              <span className="pill-blue">{app?.label || app?.name}</span>
              {entitlement?.id && <span className="pill">ID: {entitlement.id}</span>}
            </div>
          </div>
        </div>
        <button type="button" className={showAssignForm ? 'btn-secondary' : 'btn-primary'} onClick={() => setShowAssignForm(v => !v)} disabled={isLoading} style={{ flexShrink: 0 }}>
          {showAssignForm ? 'Cancel' : 'Assign label'}
        </button>
      </div>

      {/* ORN */}
      <div className="card">
        <div className="card-header"><div><div className="card-title">Resource ORN</div><div className="help">Used when assigning governance labels to this entitlement.</div></div></div>
        <div className="card-body">
          <code style={{ display: 'block', padding: '10px 14px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
            {orn}
          </code>
        </div>
      </div>

      {/* Details */}
      <div className="card">
        <div className="card-header"><div><div className="card-title">Details</div><div className="help">Metadata for the selected entitlement.</div></div></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><div className="label" style={{ marginBottom: 4 }}>Display name</div><div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{name}</div></div>
            <div><div className="label" style={{ marginBottom: 4 }}>Type</div><div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{entitlement?.type || '—'}</div></div>
            <div><div className="label" style={{ marginBottom: 4 }}>Application</div><div style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{app?.label || app?.name || '—'}</div></div>
            <div><div className="label" style={{ marginBottom: 4 }}>Entitlement ID</div><div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: 'var(--color-text-secondary)' }}>{entitlement?.id || '—'}</div></div>
          </div>
        </div>
      </div>

      {/* Label assignments */}
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">Assigned labels</div><div className="help">Assign or unassign governance label values for this entitlement.</div></div>
          {(isLoading || isBusy) && <span className="pill">{isBusy ? 'Working…' : 'Loading…'}</span>}
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div className="error"><strong>Error:</strong> {error}</div>}
          {!showAssignForm && (
            isLoading ? <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading assignments…</div>
            : !hasAssignments ? <EmptyState title="No labels assigned" subtitle='Use "Assign label" to add governance labels to this entitlement.' />
            : <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)' }}><LabelGroups data={assignments} onDeleteValue={handleDelete} /></div>
          )}
          {showAssignForm && (
            <div style={{ borderRadius: 8, padding: 16, border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 12 }}>Assign a label value</div>
              <AssignLabelForm allLabels={allLabels} onSave={handleSave} onCancel={() => setShowAssignForm(false)} isLoading={isBusy} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── App detail panel (shows entitlements list) ─────────
const AppEntitlements = ({ app, entitlements, isLoading, error, onSelectEntitlement, selectedEntId }) => (
  <div className="space-y-4">
    <Breadcrumb app={app} entitlement={null} onClickApp={() => {}} />

    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      {app?._links?.logo?.[0]?.href ? (
        <img src={app._links.logo[0].href} alt="" style={{ height: 48, width: 48, flexShrink: 0, borderRadius: 12, objectFit: 'contain', border: '1px solid var(--color-border)', background: 'white' }} />
      ) : (
        <span className="avatar" style={{ height: 48, width: 48, fontSize: 13, borderRadius: 'var(--radius-lg)', flexShrink: 0 }}>
          {String(app?.label || app?.name || '??').slice(0, 2).toUpperCase()}
        </span>
      )}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.01em', margin: 0 }}>{app?.label || app?.name}</h2>
        <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
          <span className="pill-success">Entitlement management enabled</span>
          {app?.signOnMode && <span className="pill">{app.signOnMode}</span>}
        </div>
      </div>
    </div>

    <div className="card overflow-hidden">
      <div className="card-header">
        <div><div className="card-title">Entitlements</div><div className="help">Select an entitlement to manage its governance label assignments.</div></div>
        {isLoading && <span className="pill">Loading…</span>}
        {!isLoading && entitlements && <span className="pill">{entitlements.length} found</span>}
      </div>

      {error && <div className="card-body"><div className="error"><strong>Error:</strong> {error}</div></div>}

      {!isLoading && !error && (
        !entitlements || entitlements.length === 0 ? (
          <div className="card-body"><EmptyState title="No entitlements found" subtitle="This app has entitlement management enabled but no entitlements have been configured yet." /></div>
        ) : (
          <ul>
            {entitlements.map(ent => (
              <li key={ent.id}>
                <ListItem
                  primary={ent.displayName || ent.name}
                  secondary={ent.id}
                  badge={ent.type}
                  isSelected={selectedEntId === ent.id}
                  onClick={() => onSelectEntitlement(ent)}
                />
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  </div>
);

// ── Main page ──────────────────────────────────────────
const EntitlementAssignments = () => {
  const { authState, oktaAuth } = useOktaAuth();

  // App list
  const [apps, setApps]               = useState(null);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appsError, setAppsError]     = useState(null);
  const [searchTerm, setSearchTerm]   = useState('');

  // Selected app + its entitlements
  const [selectedApp, setSelectedApp]           = useState(null);
  const [entitlements, setEntitlements]         = useState(null);
  const [loadingEnts, setLoadingEnts]           = useState(false);
  const [entsError, setEntsError]               = useState(null);

  // Selected entitlement + its label assignments
  const [selectedEnt, setSelectedEnt]               = useState(null);
  const [assignments, setAssignments]               = useState(null);
  const [loadingAssign, setLoadingAssign]           = useState(false);
  const [assignError, setAssignError]               = useState(null);
  const [isBusy, setIsBusy]                         = useState(false);

  // All governance labels (for assign form)
  const [allLabels, setAllLabels] = useState([]);

  // Load entitlement-enabled apps + all labels on mount
  useEffect(() => {
    if (!authState?.isAuthenticated) return;
    const load = async () => {
      setLoadingApps(true);
      setAppsError(null);
      try {
        const token = oktaAuth.getAccessToken();
        const [appsRes, labelsRes] = await Promise.all([
          fetch('/api/apps/entitlement-enabled', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/governance-labels',         { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (!appsRes.ok)   throw new Error(`Failed to fetch apps: ${await appsRes.text()}`);
        if (!labelsRes.ok) throw new Error(`Failed to fetch labels: ${await labelsRes.text()}`);
        setApps(await appsRes.json());
        const labelsData = await labelsRes.json();
        setAllLabels(labelsData?.data || []);
      } catch (err) {
        setAppsError(err?.message || 'Failed to load apps.');
      } finally {
        setLoadingApps(false);
      }
    };
    load();
  }, [authState, oktaAuth]);

  // Fetch entitlements when an app is selected
  const handleSelectApp = async (app) => {
    setSelectedApp(app);
    setSelectedEnt(null);
    setEntitlements(null);
    setLoadingEnts(true);
    setEntsError(null);
    try {
      const token = oktaAuth.getAccessToken();
      const res   = await fetch(`/api/apps/${app.id}/entitlements`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed to fetch entitlements: ${await res.text()}`);
      setEntitlements(await res.json());
    } catch (err) {
      setEntsError(err?.message || 'Failed to load entitlements.');
    } finally {
      setLoadingEnts(false);
    }
  };

  // Fetch label assignments when an entitlement is selected
  const handleSelectEnt = async (ent) => {
    setSelectedEnt(ent);
    setAssignments(null);
    setLoadingAssign(true);
    setAssignError(null);
    try {
      const token = oktaAuth.getAccessToken();
      const orn   = buildEntitlementOrn(selectedApp?.id, ent.id);
      const res   = await fetch(`/api/assigned-labels?orn=${encodeURIComponent(orn)}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Failed to fetch assigned labels: ${await res.text()}`);
      setAssignments(await res.json());
    } catch (err) {
      setAssignError(err?.message || 'Failed to load assigned labels.');
    } finally {
      setLoadingAssign(false);
    }
  };

  const handleAssign = async (orn, labelValueId) => {
    setIsBusy(true); setAssignError(null);
    try {
      const token = oktaAuth.getAccessToken();
      const res   = await fetch('/api/assignments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orn, labelValueId }),
      });
      if (!res.ok) throw new Error(await res.text());
      if (selectedEnt) handleSelectEnt(selectedEnt);
    } catch (err) { setAssignError(err?.message || 'Failed to assign label.'); }
    finally { setIsBusy(false); }
  };

  const handleUnassign = async (orn, labelValueId) => {
    if (!window.confirm('Unassign this label from the entitlement?')) return;
    setIsBusy(true); setAssignError(null);
    try {
      const token = oktaAuth.getAccessToken();
      const res   = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orn, labelValueId }),
      });
      if (!res.ok) throw new Error(await res.text());
      if (selectedEnt) handleSelectEnt(selectedEnt);
    } catch (err) { setAssignError(err?.message || 'Failed to unassign label.'); }
    finally { setIsBusy(false); }
  };

  const filteredApps = useMemo(() => {
    if (!apps) return [];
    const q = searchTerm.trim().toLowerCase();
    return q ? apps.filter(a => String(a?.label || a?.name || '').toLowerCase().includes(q)) : apps;
  }, [apps, searchTerm]);

  if (!authState?.isAuthenticated) {
    return <div className="card p-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Please sign in to continue.</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="lg:grid-cols-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* LEFT — app list */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="lg:col-span-4">
          <div className="card" style={{ padding: 16 }}>
            <div className="label" style={{ display: 'block', marginBottom: 8 }}>Apps with entitlement management</div>
            <input type="text" className="input" placeholder="Filter by name…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            {apps && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                {filteredApps.length} of {apps.length} apps
              </div>
            )}
          </div>

          {loadingApps && <div className="card" style={{ padding: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading apps…</div>}
          {appsError   && <div className="error"><strong>Error:</strong> {appsError}</div>}

          {!loadingApps && apps && (
            <div className="card" style={{ overflow: 'hidden' }}>
              {filteredApps.length === 0 ? (
                <div style={{ padding: 16, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {apps.length === 0 ? 'No apps have entitlement management enabled.' : 'No apps match your search.'}
                </div>
              ) : (
                <ul>
                  {filteredApps.map(app => (
                    <li key={app.id}>
                      <ListItem
                        primary={app.label || app.name}
                        secondary={app.id}
                        badge={app.status}
                        badgeVariant={app.status === 'ACTIVE' ? 'pill-success' : 'pill'}
                        isSelected={selectedApp?.id === app.id}
                        logoUrl={app?._links?.logo?.[0]?.href}
                        onClick={() => handleSelectApp(app)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* RIGHT — entitlements list or entitlement detail */}
        <section className="lg:col-span-8">
          {!selectedApp ? (
            <div className="card" style={{ padding: 48 }}>
              <EmptyState title="No app selected" subtitle="Choose an app on the left to browse its entitlements." />
            </div>
          ) : selectedEnt ? (
            <EntitlementDetail
              app={selectedApp}
              entitlement={selectedEnt}
              assignments={assignments}
              isLoading={loadingAssign}
              error={assignError}
              allLabels={allLabels}
              onAssign={handleAssign}
              onUnassign={handleUnassign}
              isBusy={isBusy}
              onBack={() => setSelectedEnt(null)}
            />
          ) : (
            <AppEntitlements
              app={selectedApp}
              entitlements={entitlements}
              isLoading={loadingEnts}
              error={entsError}
              onSelectEntitlement={handleSelectEnt}
              selectedEntId={selectedEnt?.id}
            />
          )}
        </section>

      </div>
    </div>
  );
};

export default EntitlementAssignments;
