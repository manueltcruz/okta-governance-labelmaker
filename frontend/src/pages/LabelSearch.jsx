// frontend/src/pages/LabelSearch.jsx
// Search for resources (groups, apps, entitlement values) by label value.
// Each result row now has an unassign button for the searched label.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { CircularProgress } from '@mui/material';

// ── ORN type inference ─────────────────────────────────
function inferResourceType(orn = '') {
  if (/entitlement-values/.test(orn)) return 'Entitlement Value';
  if (/entitlements/.test(orn))       return 'Entitlement';
  if (/apps/.test(orn))               return 'Application';
  if (/groups/.test(orn))             return 'Group';
  return 'Resource';
}

const TYPE_STYLES = {
  'Application':       { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: 'App' },
  'Group':             { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Group' },
  'Entitlement Value': { bg: '#fdf2f8', color: '#86198f', border: '#f5d0fe', label: 'Entitlement' },
  'Entitlement':       { bg: '#fdf2f8', color: '#86198f', border: '#f5d0fe', label: 'Entitlement' },
  'Resource':          { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'Resource' },
};

const LABEL_COLOR_MAP = {
  red:    { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  orange: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  yellow: { bg: '#fefce8', color: '#a16207', border: '#fef08a' },
  green:  { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  blue:   { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  purple: { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
  teal:   { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4' },
  beige:  { bg: '#faf9f7', color: '#78716c', border: '#e7e5e4' },
  gray:   { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' },
};
const LABEL_DEFAULT = { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };

function getLabelStyle(colorName) {
  return LABEL_COLOR_MAP[(colorName || '').toLowerCase()] || LABEL_DEFAULT;
}

// ── Icons ──────────────────────────────────────────────
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6m4-6v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

// ── Sub-components ─────────────────────────────────────
const TypeBadge = ({ orn }) => {
  const type = inferResourceType(orn);
  const s    = TYPE_STYLES[type] || TYPE_STYLES['Resource'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.01em', whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {s.label}
    </span>
  );
};

const LabelPill = ({ labelName, valueName, colorName }) => {
  const s = getLabelStyle(colorName);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 99,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      <span style={{ opacity: 0.7, marginRight: 4 }}>{labelName}:</span>{valueName}
    </span>
  );
};

// ── Result row ─────────────────────────────────────────
// onUnassign(orn) — called when user confirms removal of the searched label from this resource.
// unassignStatus — 'idle' | 'running' | 'done' | 'error'
const ResultRow = ({ resource, searchedValueName, onUnassign, unassignStatus }) => {
  const name   = resource?.profile?.name || resource?.profile?.label || '—';
  const desc   = resource?.profile?.description || null;
  const orn    = resource?.orn || '';
  const labels = resource?.labels || [];
  const [expanded, setExpanded] = useState(false);

  const allLabelPills = labels.flatMap(lbl =>
    (lbl.values || []).map(val => ({
      key: val.labelValueId,
      labelName: lbl.name,
      valueName: val.name,
      colorName: val.metadata?.additionalProperties?.backgroundColor || '',
    }))
  );

  const isDone    = unassignStatus === 'done';
  const isRunning = unassignStatus === 'running';
  const isError   = unassignStatus === 'error';

  return (
    <div style={{
      borderBottom: '1px solid var(--color-border-subtle)',
      opacity: isDone ? 0.45 : 1,
      transition: 'opacity 0.3s',
    }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px' }}>

        {/* Name + ORN block */}
        <div
          onClick={() => allLabelPills.length > 0 && setExpanded(v => !v)}
          style={{
            flex: 1, minWidth: 0,
            cursor: allLabelPills.length > 0 ? 'pointer' : 'default',
          }}
        >
          <div style={{ marginBottom: 4 }}><TypeBadge orn={orn} /></div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{name}</div>
          {desc && desc !== name && (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1, lineHeight: 1.4 }}>{desc}</div>
          )}
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3, fontFamily: "'DM Mono', monospace", wordBreak: 'break-all', lineHeight: 1.5 }}>{orn}</div>
        </div>

        {/* Right side: label count + unassign button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Label count / chevron */}
          <div
            onClick={() => allLabelPills.length > 0 && setExpanded(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: allLabelPills.length > 0 ? 'pointer' : 'default' }}
          >
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              {allLabelPills.length} label{allLabelPills.length !== 1 ? 's' : ''}
            </span>
            {allLabelPills.length > 0 && (
              <span style={{
                fontSize: 12, color: 'var(--color-text-muted)',
                display: 'inline-block', transition: 'transform 0.15s',
                transform: expanded ? 'rotate(90deg)' : 'none',
              }}>›</span>
            )}
          </div>

          {/* Unassign button */}
          {isDone ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-success)' }}>Removed ✓</span>
          ) : isError ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-danger)' }}>Failed ✗</span>
          ) : (
            <button
              type="button"
              title={`Remove "${searchedValueName}" from this resource`}
              onClick={() => onUnassign(orn)}
              disabled={isRunning}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                opacity: isRunning ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isRunning) { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.borderColor = 'var(--color-text-muted)'; }}}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            >
              {isRunning
                ? <CircularProgress size={12} style={{ color: 'var(--color-text-secondary)' }} />
                : <IconTrash />
              }
            </button>
          )}
        </div>
      </div>

      {/* Expanded: all label pills */}
      {expanded && allLabelPills.length > 0 && (
        <div style={{
          paddingLeft: 20, paddingRight: 20, paddingBottom: 14, paddingTop: 2,
          display: 'flex', flexWrap: 'wrap', gap: 6,
          borderTop: '1px solid var(--color-border-subtle)',
          background: 'var(--color-bg)',
        }}>
          {allLabelPills.map(p => (
            <LabelPill key={p.key} labelName={p.labelName} valueName={p.valueName} colorName={p.colorName} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Filter bar ─────────────────────────────────────────
const RESOURCE_TYPE_FILTERS = ['All', 'Application', 'Group', 'Entitlement Value'];

const FilterBar = ({ activeType, onTypeChange, nameFilter, onNameFilter, total, filtered }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
    <input
      type="text"
      className="input"
      placeholder="Filter by name…"
      value={nameFilter}
      onChange={e => onNameFilter(e.target.value)}
      style={{ width: 220 }}
    />
    <div style={{ display: 'flex', gap: 4 }}>
      {RESOURCE_TYPE_FILTERS.map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onTypeChange(t)}
          style={{
            fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 99, cursor: 'pointer',
            border: '1px solid',
            borderColor: activeType === t ? 'var(--color-accent)' : 'var(--color-border)',
            background: activeType === t ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
            color: activeType === t ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            transition: 'all 0.1s',
          }}
        >
          {t === 'Entitlement Value' ? 'Entitlement' : t}
        </button>
      ))}
    </div>
    {total > 0 && (
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
        {filtered === total ? `${total} result${total !== 1 ? 's' : ''}` : `${filtered} of ${total}`}
      </span>
    )}
  </div>
);

// ── Main page ──────────────────────────────────────────
const LabelSearch = () => {
  const { authState, oktaAuth } = useOktaAuth();

  const [allLabels,     setAllLabels]   = useState([]);
  const [loadingLabels, setLoading]     = useState(true);
  const [labelsError,   setLabelsErr]   = useState(null);

  const [selectedLabelId,  setSelectedLabelId]  = useState('');
  const [selectedValueId,  setSelectedValueId]  = useState('');

  const [results,      setResults]      = useState(null);
  const [searching,    setSearching]    = useState(false);
  const [searchError,  setSearchErr]    = useState(null);

  const [nameFilter,   setNameFilter]   = useState('');
  const [typeFilter,   setTypeFilter]   = useState('All');

  // { [orn]: 'idle' | 'running' | 'done' | 'error' }
  const [unassignStatus, setUnassignStatus] = useState({});

  const getToken = useCallback(() => oktaAuth.getAccessToken(), [oktaAuth]);

  // Load governance labels on mount
  useEffect(() => {
    if (!authState?.isAuthenticated) return;
    setLoading(true); setLabelsErr(null);
    fetch('/api/governance-labels', { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then(data => setAllLabels(data?.data || data || []))
      .catch(err => setLabelsErr(err?.message || 'Failed to load labels.'))
      .finally(() => setLoading(false));
  }, [authState]);

  const handleLabelChange = (labelId) => {
    setSelectedLabelId(labelId);
    setSelectedValueId('');
    setResults(null);
    setSearchErr(null);
    setNameFilter('');
    setTypeFilter('All');
    setUnassignStatus({});
  };

  const handleValueChange = async (valueId) => {
    setSelectedValueId(valueId);
    setResults(null);
    setSearchErr(null);
    setNameFilter('');
    setTypeFilter('All');
    setUnassignStatus({});
    if (!valueId) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/label-search?labelValueId=${encodeURIComponent(valueId)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setResults(await res.json());
    } catch (err) {
      setSearchErr(err?.message || 'Search failed.');
    } finally {
      setSearching(false);
    }
  };

  // Unassign the currently-searched label value from a resource
  const handleUnassign = useCallback(async (orn) => {
    const valueName = valueOptions.find(v => v.labelValueId === selectedValueId)?.name || 'this label';
    const resourceName = results?.find(r => r.orn === orn)?.profile?.name
      || results?.find(r => r.orn === orn)?.profile?.label
      || orn;

    const confirmed = window.confirm(
      `Remove "${valueName}" from "${resourceName}"?\n\nThis will unassign the label from this resource.`
    );
    if (!confirmed) return;

    setUnassignStatus(prev => ({ ...prev, [orn]: 'running' }));
    try {
      const res = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orn, labelValueId: selectedValueId }),
      });
      if (!res.ok) throw new Error(await res.text());
      setUnassignStatus(prev => ({ ...prev, [orn]: 'done' }));
    } catch (err) {
      setUnassignStatus(prev => ({ ...prev, [orn]: 'error' }));
    }
  }, [selectedValueId, results, getToken]);

  const selectedLabel = allLabels.find(l => l.labelId === selectedLabelId);
  const valueOptions  = selectedLabel?.values || [];
  const searchedValue = valueOptions.find(v => v.labelValueId === selectedValueId);

  const filteredResults = useMemo(() => {
    if (!results) return [];
    return results.filter(r => {
      const name = (r?.profile?.name || r?.profile?.label || '').toLowerCase();
      const type = inferResourceType(r?.orn || '');
      return (!nameFilter || name.includes(nameFilter.toLowerCase()))
        && (typeFilter === 'All' || type === typeFilter);
    });
  }, [results, nameFilter, typeFilter]);

  const typeCounts = useMemo(() => {
    if (!results) return {};
    return results.reduce((acc, r) => {
      const t = inferResourceType(r?.orn || '');
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
  }, [results]);

  // Count of rows successfully unassigned (for banner)
  const removedCount = Object.values(unassignStatus).filter(s => s === 'done').length;
  const errorCount   = Object.values(unassignStatus).filter(s => s === 'error').length;

  if (!authState?.isAuthenticated) return null;

  return (
    <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Search controls */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 16 }}>
          Select a label to find all resources it has been assigned to.
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Label category</label>
            {loadingLabels ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading…</div>
            ) : labelsError ? (
              <div className="error">{labelsError}</div>
            ) : (
              <select className="input" value={selectedLabelId}
                onChange={e => handleLabelChange(e.target.value)} style={{ width: '100%' }}>
                <option value="">— Choose a category —</option>
                {allLabels.map(lbl => (
                  <option key={lbl.labelId} value={lbl.labelId}>{lbl.name}</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Label value</label>
            <select className="input" value={selectedValueId}
              onChange={e => handleValueChange(e.target.value)}
              disabled={!selectedLabelId} style={{ width: '100%' }}>
              <option value="">— Choose a value —</option>
              {valueOptions.map(v => (
                <option key={v.labelValueId} value={v.labelValueId}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary chips */}
        {results && !searching && (
          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(typeCounts).map(([type, count]) => {
              const style = TYPE_STYLES[type] || TYPE_STYLES['Resource'];
              return (
                <span key={type} style={{
                  fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 99,
                  background: style.bg, color: style.color, border: `1px solid ${style.border}`,
                }}>
                  {count} {style.label}{count !== 1 ? 's' : ''}
                </span>
              );
            })}
            {results.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                No resources found with this label.
              </span>
            )}
          </div>
        )}
      </div>

      {/* Unassign outcome banners */}
      {removedCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderRadius: 10,
          background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: 13,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>
            <strong>{removedCount} resource{removedCount !== 1 ? 's' : ''}</strong> unassigned from <strong>{searchedValue?.name}</strong>.
            {' '}Rows are dimmed but remain visible until you run a new search.
          </span>
        </div>
      )}
      {errorCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px', borderRadius: 10,
          background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>
            <strong>{errorCount} removal{errorCount !== 1 ? 's' : ''} failed.</strong>{' '}
            Check the affected rows (marked ✗) and try again.
          </span>
        </div>
      )}

      {/* Searching spinner */}
      {searching && (
        <div className="card" style={{ padding: 24, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Searching…
        </div>
      )}

      {searchError && (
        <div className="error"><strong>Error:</strong> {searchError}</div>
      )}

      {/* Results */}
      {results && results.length > 0 && !searching && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Results</div>
              <div className="help">
                Resources tagged with <strong>{selectedLabel?.name}: {searchedValue?.name}</strong>.
                Click a row to see all its labels. Use the <span style={{ color: 'var(--color-danger, #dc2626)' }}>trash icon</span> to remove this label from a resource.
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <FilterBar
              activeType={typeFilter}
              onTypeChange={setTypeFilter}
              nameFilter={nameFilter}
              onNameFilter={setNameFilter}
              total={results.length}
              filtered={filteredResults.length}
            />
          </div>

          {filteredResults.length === 0 ? (
            <div style={{ padding: 24, fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
              No results match the current filters.
            </div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {filteredResults.map((r, i) => (
                <li key={r.orn || i}>
                  <ResultRow
                    resource={r}
                    searchedValueName={searchedValue?.name || ''}
                    onUnassign={handleUnassign}
                    unassignStatus={unassignStatus[r.orn] || 'idle'}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default LabelSearch;
