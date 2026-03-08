// frontend/src/pages/BulkAssign.jsx
// Assign a single label value to many groups, apps, or entitlements in one operation.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { CircularProgress } from '@mui/material';

const OKTA_PARTITION = import.meta.env.VITE_OKTA_PARTITION || 'oktapreview';
const OKTA_ORG_ID    = import.meta.env.VITE_OKTA_ORG_ID    || '00ou52nw1BecRJ5jB1d6';

function buildGroupOrn(id) {
  return `orn:${OKTA_PARTITION}:directory:${OKTA_ORG_ID}:groups:${id}`;
}
function buildAppOrn(id, signOnMode) {
  const t = String(signOnMode || 'generic').toLowerCase();
  return `orn:${OKTA_PARTITION}:idp:${OKTA_ORG_ID}:apps:${t}:${id}`;
}
function buildEntitlementOrn(id) {
  return `orn:${OKTA_PARTITION}:governance:${OKTA_ORG_ID}:entitlements:${id}`;
}

// ── Icons ──────────────────────────────────────────────────────────────────

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const IconApp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconKey = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/>
    <path d="M21 2l-9.6 9.6"/>
    <path d="M15.5 7.5l3 3L22 7l-3-3"/>
  </svg>
);

const IconChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

// ── Step indicator ─────────────────────────────────────────────────────────

const Step = ({ n, label, active, done }) => (
  <div className="flex items-center gap-2">
    <div
      className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold"
      style={{
        background: done ? 'var(--color-success)' : active ? 'var(--color-accent)' : 'var(--color-bg)',
        border: `2px solid ${done ? 'var(--color-success)' : active ? 'var(--color-accent)' : 'var(--color-border)'}`,
        color: done || active ? '#fff' : 'var(--color-text-muted)',
      }}
    >
      {done ? '✓' : n}
    </div>
    <span className="text-sm font-medium" style={{ color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
      {label}
    </span>
  </div>
);

const StepDivider = () => (
  <div className="flex-none" style={{ width: 32, height: 2, background: 'var(--color-border)', margin: '0 4px' }} />
);

// ── Checkbox row ───────────────────────────────────────────────────────────

const CheckRow = ({ id, label, sublabel, checked, onChange, status, indent = 0 }) => {
  const statusColor = status === 'ok' ? 'var(--color-success)' : status === 'error' ? 'var(--color-danger)' : null;
  const statusIcon  = status === 'ok' ? '✓' : status === 'error' ? '✗' : null;

  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 transition-colors"
      style={{
        background: checked ? 'var(--color-accent-subtle)' : 'transparent',
        border: `1px solid ${checked ? 'var(--color-accent-border)' : 'transparent'}`,
        marginBottom: 2,
        paddingLeft: indent ? `${indent * 16 + 12}px` : undefined,
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ width: 15, height: 15, accentColor: 'var(--color-accent)', flexShrink: 0, cursor: 'pointer' }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{label}</div>
        {sublabel && <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{sublabel}</div>}
      </div>
      {statusIcon && (
        <span className="flex-none text-xs font-bold" style={{ color: statusColor }}>{statusIcon}</span>
      )}
      {status === 'running' && <CircularProgress size={12} style={{ flexShrink: 0 }} />}
    </label>
  );
};

// ── Result summary banner ──────────────────────────────────────────────────

const ResultBanner = ({ results, onReset }) => {
  const ok  = results.filter(r => r.status === 'ok').length;
  const err = results.filter(r => r.status === 'error').length;
  return (
    <div className="card overflow-hidden">
      <div style={{ height: 4, background: err === 0 ? 'var(--color-success)' : 'var(--color-danger)' }} />
      <div className="card-body space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Bulk assignment complete
            </div>
            <div className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {ok > 0 && <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{ok} succeeded</span>}
              {ok > 0 && err > 0 && <span style={{ color: 'var(--color-text-muted)' }}> · </span>}
              {err > 0 && <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{err} failed</span>}
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={onReset}>Start over</button>
        </div>
        {err > 0 && (
          <ul className="space-y-1">
            {results.filter(r => r.status === 'error').map(r => (
              <li key={r.id} className="text-sm rounded px-3 py-2"
                style={{ background: 'var(--color-danger-subtle)', border: '1px solid var(--color-danger-border)', color: 'var(--color-danger)' }}>
                <strong>{r.label}</strong> — {r.error}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// ── Entitlement tree (Step 3 for entitlements) ────────────────────────────

const EntitlementTree = ({ selectedIds, onToggle, onToggleAll, getToken, itemStatus }) => {
  const [apps,        setApps]        = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appsError,   setAppsError]   = useState('');
  const [appSearch,   setAppSearch]   = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  // { [appId]: { categories, loading, error } }
  const [catData, setCatData] = useState({});
  // { [catId]: { values, loading, error } }
  const [valData, setValData] = useState({});
  // Which categories are expanded
  const [openCats, setOpenCats] = useState(new Set());

  useEffect(() => {
    setLoadingApps(true);
    fetch('/api/apps/entitlement-enabled', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setApps(Array.isArray(d) ? d : []))
      .catch(e => setAppsError(e.message))
      .finally(() => setLoadingApps(false));
  }, []);

  const filteredApps = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    return q ? apps.filter(a => (a.label || a.name || '').toLowerCase().includes(q)) : apps;
  }, [apps, appSearch]);

  const selectApp = useCallback(async (app) => {
    setSelectedApp(app);
    setOpenCats(new Set());
    if (catData[app.id]) return;
    setCatData(prev => ({ ...prev, [app.id]: { categories: null, loading: true, error: '' } }));
    try {
      const r = await fetch(`/api/apps/${app.id}/entitlements`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (!r.ok) throw new Error(await r.text());
      const cats = await r.json();
      setCatData(prev => ({ ...prev, [app.id]: { categories: cats, loading: false, error: '' } }));
    } catch (e) {
      setCatData(prev => ({ ...prev, [app.id]: { categories: null, loading: false, error: e.message } }));
    }
  }, [catData, getToken]);

  const toggleCat = useCallback(async (cat) => {
    const isOpening = !openCats.has(cat.id);
    setOpenCats(prev => { const n = new Set(prev); isOpening ? n.add(cat.id) : n.delete(cat.id); return n; });
    if (isOpening && !valData[cat.id]) {
      setValData(prev => ({ ...prev, [cat.id]: { values: null, loading: true, error: '' } }));
      try {
        const r = await fetch(`/api/entitlements/${cat.id}/values`, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (!r.ok) throw new Error(await r.text());
        const vals = await r.json();
        setValData(prev => ({ ...prev, [cat.id]: { values: vals, loading: false, error: '' } }));
      } catch (e) {
        setValData(prev => ({ ...prev, [cat.id]: { values: null, loading: false, error: e.message } }));
      }
    }
  }, [openCats, valData, getToken]);

  const toggleCatAll = useCallback((cat) => {
    const vd = valData[cat.id];
    if (!vd?.values?.length) return;
    const ids = vd.values.map(v => v.id || v.labelValueId || v.entitlementValueId);
    const allChecked = ids.every(id => selectedIds.has(id));
    onToggleAll(ids, !allChecked);
  }, [valData, selectedIds, onToggleAll]);

  const appCat     = selectedApp ? (catData[selectedApp.id] || {}) : {};
  const categories = appCat.categories || [];

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: '220px 1fr' }}>

      {/* Left: app list */}
      <div className="flex flex-col gap-2">
        <input type="text" className="input" placeholder="Filter apps…"
          value={appSearch} onChange={e => setAppSearch(e.target.value)} />
        <div className="card overflow-hidden" style={{ maxHeight: 420, overflowY: 'auto' }}>
          {loadingApps && <div className="flex justify-center p-4"><CircularProgress size={20} /></div>}
          {appsError   && <div className="error text-xs p-3">{appsError}</div>}
          {!loadingApps && filteredApps.length === 0 && (
            <div className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>No apps found.</div>
          )}
          {filteredApps.map(app => {
            const isSelected = selectedApp?.id === app.id;
            const logoUrl = app?._links?.logo?.[0]?.href;
            return (
              <button key={app.id} type="button" onClick={() => selectApp(app)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors"
                style={{
                  background: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  borderLeft: isSelected ? '3px solid var(--color-accent)' : '3px solid transparent',
                }}>
                {logoUrl
                  ? <img src={logoUrl} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain', flexShrink: 0, border: '1px solid var(--color-border)', background: '#fff' }} />
                  : <span className="avatar" style={{ width: 24, height: 24, fontSize: 9, borderRadius: 4, flexShrink: 0 }}>{(app.label || app.name || '?').slice(0, 2).toUpperCase()}</span>
                }
                <span className="text-xs font-medium truncate"
                  style={{ color: isSelected ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>
                  {app.label || app.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: category + value tree */}
      <div>
        {!selectedApp && (
          <div className="flex items-center justify-center rounded-xl py-16"
            style={{ border: '1.5px dashed var(--color-border)', background: 'var(--color-bg)' }}>
            <div className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
              Select an app on the left to browse its entitlements
            </div>
          </div>
        )}

        {selectedApp && appCat.loading && <div className="flex justify-center py-8"><CircularProgress size={24} /></div>}
        {selectedApp && appCat.error   && <div className="error">{appCat.error}</div>}
        {selectedApp && !appCat.loading && categories.length === 0 && !appCat.error && (
          <div className="rounded-xl py-10 text-center text-sm"
            style={{ border: '1.5px dashed var(--color-border)', color: 'var(--color-text-muted)' }}>
            No entitlement categories found for this app.
          </div>
        )}

        {selectedApp && categories.length > 0 && (
          <div className="card overflow-hidden" style={{ maxHeight: 420, overflowY: 'auto' }}>
            {categories.map(cat => {
              const isOpen = openCats.has(cat.id);
              const vd     = valData[cat.id] || {};
              const vals   = vd.values || [];
              const catSelectedCount = vals.filter(v => selectedIds.has(v.id || v.labelValueId || v.entitlementValueId)).length;
              const catAllChecked    = vals.length > 0 && catSelectedCount === vals.length;

              return (
                <div key={cat.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  {/* Category header row */}
                  <div className="flex items-center gap-2 px-4 py-3 transition-colors"
                    style={{ background: isOpen ? 'var(--color-bg)' : 'transparent' }}>
                    {isOpen && vals.length > 0 && (
                      <input type="checkbox" checked={catAllChecked} onChange={() => toggleCatAll(cat)}
                        title="Select / deselect all in category"
                        style={{ width: 14, height: 14, accentColor: 'var(--color-accent)', flexShrink: 0, cursor: 'pointer' }} />
                    )}
                    <button type="button" onClick={() => toggleCat(cat)}
                      className="flex flex-1 items-center gap-2 text-left">
                      <IconChevron open={isOpen} />
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {cat.name}
                      </span>
                      {catSelectedCount > 0 && (
                        <span className="pill-blue flex-none text-xs">{catSelectedCount} selected</span>
                      )}
                      {vd.loading && <CircularProgress size={12} style={{ flexShrink: 0 }} />}
                    </button>
                  </div>

                  {/* Values */}
                  {isOpen && (
                    <div style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border-subtle)', paddingLeft: 8 }}>
                      {vd.error && <div className="error text-xs m-3">{vd.error}</div>}
                      {!vd.loading && vals.length === 0 && !vd.error && (
                        <div className="px-6 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>No values in this category.</div>
                      )}
                      {vals.map(v => {
                        const vid = v.id || v.labelValueId || v.entitlementValueId;
                        return (
                          <CheckRow key={vid} id={`ent-${vid}`}
                            label={v.name} sublabel={v.externalValue || vid}
                            checked={selectedIds.has(vid)}
                            onChange={() => onToggle(vid, v)}
                            status={itemStatus[vid]}
                            indent={2} />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

const RESOURCE_TYPES = [
  { id: 'groups',       icon: <IconUsers />, label: 'Groups',       sub: 'Okta directory groups' },
  { id: 'apps',         icon: <IconApp />,   label: 'Applications', sub: 'Entitlement-enabled apps' },
  { id: 'entitlements', icon: <IconKey />,   label: 'Entitlements', sub: 'App entitlement values' },
];

export default function BulkAssign() {
  const { authState, oktaAuth } = useOktaAuth();
  const getToken = useCallback(() => oktaAuth.getAccessToken(), [oktaAuth]);

  const [resourceType,    setResourceType]    = useState('groups');
  const [allLabels,       setAllLabels]        = useState([]);
  const [loadingLabels,   setLoadingLabels]    = useState(true);
  const [labelsError,     setLabelsError]      = useState('');
  const [selectedCatId,   setSelectedCatId]    = useState('');
  const [selectedValueId, setSelectedValueId]  = useState('');
  const [resources,       setResources]        = useState([]);
  const [loadingRes,      setLoadingRes]        = useState(false);
  const [resourcesError,  setResourcesError]   = useState('');
  const [searchTerm,      setSearchTerm]       = useState('');
  const [selectedIds,     setSelectedIds]      = useState(new Set());
  const [entValueMeta,    setEntValueMeta]     = useState({});
  const [step,            setStep]             = useState(1);
  const [running,         setRunning]          = useState(false);
  const [itemStatus,      setItemStatus]       = useState({});
  const [results,         setResults]          = useState(null);

  useEffect(() => {
    if (!authState?.isAuthenticated) return;
    fetch('/api/governance-labels', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setAllLabels(d?.data || d || []))
      .catch(e => setLabelsError(e.message))
      .finally(() => setLoadingLabels(false));
  }, [authState]);

  useEffect(() => {
    if (step !== 3 || resourceType === 'entitlements' || !authState?.isAuthenticated) return;
    // Only fetch if we don't already have resources for this type
    if (resources.length > 0) return;
    setLoadingRes(true); setResourcesError(''); setSelectedIds(new Set());
    const url = resourceType === 'groups' ? '/api/groups' : '/api/apps/entitlement-enabled';
    fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(d => setResources(Array.isArray(d) ? d : d?.data || []))
      .catch(e => setResourcesError(e.message))
      .finally(() => setLoadingRes(false));
  }, [step, resourceType, authState]);

  const selectedCat   = allLabels.find(c => c.id === selectedCatId || c.labelId === selectedCatId);
  const labelValues   = selectedCat?.values || [];
  const selectedValue = labelValues.find(v => (v.labelValueId || v.id) === selectedValueId);
  const isEntitlements = resourceType === 'entitlements';

  const filteredResources = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return resources.filter(r => {
      const name = resourceType === 'groups' ? (r?.profile?.name || '') : (r?.label || r?.name || '');
      return !q || name.toLowerCase().includes(q);
    });
  }, [resources, searchTerm, resourceType]);

  const allChecked = filteredResources.length > 0 && filteredResources.every(r => selectedIds.has(r.id));

  const toggleAll = () => {
    if (allChecked) {
      setSelectedIds(prev => { const n = new Set(prev); filteredResources.forEach(r => n.delete(r.id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); filteredResources.forEach(r => n.add(r.id)); return n; });
    }
  };

  const toggleOne = (id) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleEntitlement = useCallback((vid, v) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(vid) ? n.delete(vid) : n.add(vid); return n; });
    setEntValueMeta(prev => ({ ...prev, [vid]: { name: v.name, orn: v.orn || buildEntitlementOrn(vid) } }));
  }, []);

  const toggleEntitlementAll = useCallback((ids, select) => {
    setSelectedIds(prev => { const n = new Set(prev); ids.forEach(id => select ? n.add(id) : n.delete(id)); return n; });
  }, []);

  const runBulk = async () => {
    if (!selectedValueId || selectedIds.size === 0) return;
    setRunning(true); setItemStatus({});
    const targets = isEntitlements
      ? Array.from(selectedIds).map(vid => ({ id: vid, orn: entValueMeta[vid]?.orn || buildEntitlementOrn(vid), label: entValueMeta[vid]?.name || vid }))
      : resources.filter(r => selectedIds.has(r.id)).map(r => ({
          id: r.id,
          orn: resourceType === 'groups' ? buildGroupOrn(r.id) : buildAppOrn(r.id, r.signOnMode),
          label: resourceType === 'groups' ? (r?.profile?.name || r.id) : (r?.label || r?.name || r.id),
        }));

    const out = [];
    for (const t of targets) {
      setItemStatus(prev => ({ ...prev, [t.id]: 'running' }));
      try {
        const r = await fetch('/api/assignments', {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ orn: t.orn, labelValueId: selectedValueId }),
        });
        if (!r.ok && r.status !== 409) throw new Error(await r.text());
        setItemStatus(prev => ({ ...prev, [t.id]: 'ok' }));
        out.push({ id: t.id, label: t.label, status: 'ok' });
      } catch (e) {
        setItemStatus(prev => ({ ...prev, [t.id]: 'error' }));
        out.push({ id: t.id, label: t.label, status: 'error', error: e.message });
      }
    }
    setResults(out);
    setRunning(false);
  };

  const reset = () => {
    setStep(1); setResourceType('groups');
    setSelectedCatId(''); setSelectedValueId('');
    setSelectedIds(new Set()); setEntValueMeta({});
    setItemStatus({}); setResults(null); setSearchTerm('');
  };

  if (!authState?.isAuthenticated) return null;
  if (results) return <ResultBanner results={results} onReset={reset} />;

  return (
    <div className="space-y-6" style={{ maxWidth: isEntitlements ? 900 : 720 }}>

      {/* Step indicator */}
      <div className="flex items-center flex-wrap gap-y-2">
        <Step n={1} label="Resource type" active={step === 1} done={step > 1} />
        <StepDivider />
        <Step n={2} label="Label value"   active={step === 2} done={step > 2} />
        <StepDivider />
        <Step n={3} label={isEntitlements ? 'Browse entitlements' : 'Select resources'} active={step === 3} done={step > 3} />
        <StepDivider />
        <Step n={4} label="Apply" active={step === 4} done={false} />
      </div>

      {/* ── Step 1 ── */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Step 1 — Resource type</div>
            <div className="help">What kind of resources do you want to label?</div>
          </div>
          {step > 1 && (
            <button type="button" className="btn-ghost text-xs" onClick={() => { setStep(1); setSelectedIds(new Set()); setResources([]); }}>Change</button>
          )}
        </div>
        <div className="card-body">
          {step === 1 ? (
            <div className="flex gap-3">
              {RESOURCE_TYPES.map(type => (
                <button key={type.id} type="button"
                  onClick={() => { setResourceType(type.id); setStep(2); }}
                  className="flex-1 rounded-xl p-4 text-left transition-all"
                  style={{
                    border: `2px solid ${resourceType === type.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: resourceType === type.id ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                    cursor: 'pointer',
                  }}>
                  <div className="flex items-center gap-2 text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {type.icon} {type.label}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{type.sub}</div>
                </button>
              ))}
            </div>
          ) : (
            <span className="pill-blue flex items-center gap-1.5 w-fit">
              {RESOURCE_TYPES.find(t => t.id === resourceType)?.icon}
              <span>{RESOURCE_TYPES.find(t => t.id === resourceType)?.label}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Step 2 ── */}
      {step >= 2 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Step 2 — Label value</div>
              <div className="help">Choose the label value to assign to all selected resources.</div>
            </div>
            {step > 2 && (
              <button type="button" className="btn-ghost text-xs" onClick={() => { setStep(2); setSelectedIds(new Set()); }}>Change</button>
            )}
          </div>
          <div className="card-body space-y-4">
            {loadingLabels && <CircularProgress size={20} />}
            {labelsError   && <div className="error">{labelsError}</div>}
            {step === 2 && !loadingLabels && (
              <>
                <div>
                  <label className="label block mb-1">Category</label>
                  <select className="input" value={selectedCatId}
                    onChange={e => { setSelectedCatId(e.target.value); setSelectedValueId(''); }}>
                    <option value="">Select a category…</option>
                    {allLabels.map(cat => (
                      <option key={cat.id || cat.labelId} value={cat.id || cat.labelId}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                {selectedCatId && (
                  <div>
                    <label className="label block mb-1">Value</label>
                    <select className="input" value={selectedValueId} onChange={e => setSelectedValueId(e.target.value)}>
                      <option value="">Select a value…</option>
                      {labelValues.map(v => (
                        <option key={v.labelValueId || v.id} value={v.labelValueId || v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedValueId && (
                  <div className="flex justify-end">
                    <button type="button" className="btn-primary" onClick={() => setStep(3)}>
                      Next — {isEntitlements ? 'browse entitlements' : 'select resources'} →
                    </button>
                  </div>
                )}
              </>
            )}
            {step > 2 && selectedValue && (
              <div className="flex items-center gap-2">
                <span className="pill">{selectedCat?.name}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>›</span>
                <span className="pill-blue">{selectedValue.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: flat list (groups / apps) ── */}
      {step >= 3 && !isEntitlements && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Step 3 — Select resources</div>
              <div className="help">Choose which {resourceType} to assign <strong>{selectedValue?.name}</strong> to.</div>
            </div>
            <span className="pill">{selectedIds.size} selected</span>
          </div>
          <div className="card-body space-y-3">
            <div className="flex items-center gap-3">
              <input type="text" className="input flex-1" placeholder={`Filter ${resourceType}…`}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <button type="button" className="btn-secondary flex-none" onClick={toggleAll}
                disabled={filteredResources.length === 0}>
                {allChecked ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            {loadingRes  && <div className="flex justify-center py-6"><CircularProgress size={24} /></div>}
            {resourcesError && <div className="error">{resourcesError}</div>}
            {!loadingRes && filteredResources.length === 0 && (
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No {resourceType} found.</div>
            )}
            {!loadingRes && filteredResources.length > 0 && (
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {filteredResources.map(r => {
                  const name = resourceType === 'groups' ? (r?.profile?.name || r.id) : (r?.label || r?.name || r.id);
                  const sub  = resourceType === 'groups' ? (r?.profile?.description || r.type || '') : (r?.signOnMode || '');
                  return (
                    <CheckRow key={r.id} id={r.id} label={name} sublabel={sub}
                      checked={selectedIds.has(r.id)} onChange={() => toggleOne(r.id)}
                      status={itemStatus[r.id]} />
                  );
                })}
              </div>
            )}
            {step === 3 && selectedIds.size > 0 && (
              <div className="flex justify-end pt-2">
                <button type="button" className="btn-primary" onClick={() => setStep(4)}>Review & apply →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: entitlement tree ── */}
      {step >= 3 && isEntitlements && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Step 3 — Browse entitlements</div>
              <div className="help">
                Select an app, expand categories, and check values to assign <strong>{selectedValue?.name}</strong> to.
              </div>
            </div>
            <span className="pill">{selectedIds.size} selected</span>
          </div>
          <div className="card-body space-y-4">
            <EntitlementTree
              selectedIds={selectedIds}
              onToggle={toggleEntitlement}
              onToggleAll={toggleEntitlementAll}
              getToken={getToken}
              itemStatus={itemStatus}
            />
            {selectedIds.size > 0 && (
              <div className="flex justify-end pt-2">
                <button type="button" className="btn-primary" onClick={() => setStep(4)}>Review & apply →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: Confirm & run ── */}
      {step === 4 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Step 4 — Confirm & apply</div>
              <div className="help">Review your selections before applying.</div>
            </div>
          </div>
          <div className="card-body space-y-4">
            <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: 'var(--color-text-muted)' }}>Label value:</span>
                <span className="pill">{selectedCat?.name}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>›</span>
                <span className="pill-blue font-medium">{selectedValue?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: 'var(--color-text-muted)' }}>Targets:</span>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {selectedIds.size} {resourceType}
                </span>
              </div>
            </div>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {isEntitlements
                ? Array.from(selectedIds).map(vid => (
                    <CheckRow key={vid} id={`confirm-${vid}`}
                      label={entValueMeta[vid]?.name || vid}
                      sublabel={entValueMeta[vid]?.orn}
                      checked onChange={() => {}} status={itemStatus[vid]} />
                  ))
                : resources.filter(r => selectedIds.has(r.id)).map(r => {
                    const name = resourceType === 'groups' ? (r?.profile?.name || r.id) : (r?.label || r?.name || r.id);
                    return <CheckRow key={r.id} id={`confirm-${r.id}`} label={name} checked onChange={() => {}} status={itemStatus[r.id]} />;
                  })
              }
            </div>
            <div className="flex items-center justify-between pt-2">
              <button type="button" className="btn-secondary" onClick={() => setStep(3)} disabled={running}>← Back</button>
              <button type="button" className="btn-primary" onClick={runBulk} disabled={running} style={{ minWidth: 160 }}>
                {running
                  ? <span className="flex items-center gap-2"><CircularProgress size={14} style={{ color: '#fff' }} /> Applying…</span>
                  : `Apply to ${selectedIds.size} ${resourceType}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
