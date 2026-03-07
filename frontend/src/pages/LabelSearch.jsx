// frontend/src/pages/LabelSearch.jsx
// Search for resources (groups, apps, entitlement values) by label value.

import React, { useEffect, useMemo, useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';

// ── ORN type inference ─────────────────────────────────
function inferResourceType(orn = '') {
  if (/entitlement-values/.test(orn)) return 'Entitlement Value';
  if (/entitlements/.test(orn))       return 'Entitlement';
  if (/apps/.test(orn))               return 'Application';
  if (/groups/.test(orn))             return 'Group';
  return 'Resource';
}

// Resource type badge colors — deliberately muted/slate tones so they
// read as "system metadata" and don't compete with the brighter label colors.
const TYPE_STYLES = {
  'Application':       { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: 'App' },
  'Group':             { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Group' },
  'Entitlement Value': { bg: '#fdf2f8', color: '#86198f', border: '#f5d0fe', label: 'Entitlement' },
  'Entitlement':       { bg: '#fdf2f8', color: '#86198f', border: '#f5d0fe', label: 'Entitlement' },
  'Resource':          { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0', label: 'Resource' },
};

// Label color map — Okta stores color names like "blue", "yellow", "red" etc.
// Maps each to a good-looking pill style (bg + text + border).
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

const TypeBadge = ({ orn }) => {
  const type  = inferResourceType(orn);
  const s     = TYPE_STYLES[type] || TYPE_STYLES['Resource'];
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
const ResultRow = ({ resource }) => {
  const name   = resource?.profile?.name || resource?.profile?.label || '—';
  const desc   = resource?.profile?.description || null;
  const orn    = resource?.orn || '';
  const labels = resource?.labels || [];
  const [expanded, setExpanded] = useState(false);

  // Flatten all label values for display
  const allLabelPills = labels.flatMap(lbl =>
    (lbl.values || []).map(val => ({
      key: val.labelValueId,
      labelName: lbl.name,
      valueName: val.name,
      colorName: val.metadata?.additionalProperties?.backgroundColor || '',
    }))
  );

  return (
    <div style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
      {/* Main row — always visible */}
      <div
        onClick={() => allLabelPills.length > 0 && setExpanded(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '13px 20px',
          cursor: allLabelPills.length > 0 ? 'pointer' : 'default',
        }}
      >
        {/* Name block: badge on its own line above name + ORN */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 4 }}>
            <TypeBadge orn={orn} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{name}</div>
          {desc && desc !== name && (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 1, lineHeight: 1.4 }}>{desc}</div>
          )}
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3, fontFamily: "'DM Mono', monospace", wordBreak: 'break-all', lineHeight: 1.5 }}>{orn}</div>
        </div>

        {/* Label count + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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
      </div>

      {/* Expanded: label pills */}
      {expanded && allLabelPills.length > 0 && (
        <div style={{
          paddingLeft: 20, paddingRight: 20, paddingBottom: 14,
          paddingTop: 2, display: 'flex', flexWrap: 'wrap', gap: 6,
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
const RESOURCE_TYPES = ['All', 'Application', 'Group', 'Entitlement Value'];

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
      {RESOURCE_TYPES.map(t => (
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

  const [allLabels, setAllLabels]   = useState([]);
  const [loadingLabels, setLoading] = useState(true);
  const [labelsError, setLabelsErr] = useState(null);

  // Selection state
  const [selectedLabelId, setSelectedLabelId]       = useState('');
  const [selectedValueId, setSelectedValueId]       = useState('');

  // Search results
  const [results, setResults]       = useState(null);
  const [searching, setSearching]   = useState(false);
  const [searchError, setSearchErr] = useState(null);

  // Client-side filter state
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const getToken = () => oktaAuth.getAccessToken();

  // Load all governance labels on mount
  useEffect(() => {
    if (!authState?.isAuthenticated) return;
    const load = async () => {
      setLoading(true); setLabelsErr(null);
      try {
        const token = getToken();
        const res   = await fetch('/api/governance-labels', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setAllLabels(data?.data || []);
      } catch (err) { setLabelsErr(err?.message || 'Failed to load labels.'); }
      finally { setLoading(false); }
    };
    load();
  }, [authState]);

  // When label category changes, reset value selection + results
  const handleLabelChange = (labelId) => {
    setSelectedLabelId(labelId);
    setSelectedValueId('');
    setResults(null);
    setSearchErr(null);
    setNameFilter('');
    setTypeFilter('All');
  };

  // Run search when a label value is chosen
  const handleValueChange = async (valueId) => {
    setSelectedValueId(valueId);
    setResults(null);
    setSearchErr(null);
    setNameFilter('');
    setTypeFilter('All');
    if (!valueId) return;

    setSearching(true);
    try {
      const token = getToken();
      const res   = await fetch(`/api/label-search?labelValueId=${encodeURIComponent(valueId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setResults(await res.json());
    } catch (err) { setSearchErr(err?.message || 'Search failed.'); }
    finally { setSearching(false); }
  };

  // Derive value list for selected label
  const selectedLabel  = allLabels.find(l => l.labelId === selectedLabelId);
  const valueOptions   = selectedLabel?.values || [];

  // Client-side filtering
  const filteredResults = useMemo(() => {
    if (!results) return [];
    return results.filter(r => {
      const name = (r?.profile?.name || r?.profile?.label || '').toLowerCase();
      const type = inferResourceType(r?.orn || '');
      const matchesName = !nameFilter || name.includes(nameFilter.toLowerCase());
      const matchesType = typeFilter === 'All' || type === typeFilter;
      return matchesName && matchesType;
    });
  }, [results, nameFilter, typeFilter]);

  // Type counts for badge display
  const typeCounts = useMemo(() => {
    if (!results) return {};
    return results.reduce((acc, r) => {
      const t = inferResourceType(r?.orn || '');
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
  }, [results]);

  if (!authState?.isAuthenticated) return null;

  return (
    <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Search controls */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 16 }}>
          Select a label to find all resources it has been assigned to.
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Label category */}
          <div style={{ flex: '1 1 200px' }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Label category</label>
            {loadingLabels ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading…</div>
            ) : labelsError ? (
              <div className="error">{labelsError}</div>
            ) : (
              <select
                className="input"
                value={selectedLabelId}
                onChange={e => handleLabelChange(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">— Choose a category —</option>
                {allLabels.map(lbl => (
                  <option key={lbl.labelId} value={lbl.labelId}>{lbl.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Label value */}
          <div style={{ flex: '1 1 200px' }}>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Label value</label>
            <select
              className="input"
              value={selectedValueId}
              onChange={e => handleValueChange(e.target.value)}
              disabled={!selectedLabelId}
              style={{ width: '100%' }}
            >
              <option value="">— Choose a value —</option>
              {valueOptions.map(v => (
                <option key={v.labelValueId} value={v.labelValueId}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary chips when results are loaded */}
        {results && !searching && (
          <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(typeCounts).map(([type, count]) => {
              const style = TYPE_STYLES[type] || TYPE_STYLES['Resource'];
              return (
                <span key={type} style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px',
                  borderRadius: 99, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
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

      {/* Results */}
      {searching && (
        <div className="card" style={{ padding: 24, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Searching…
        </div>
      )}

      {searchError && (
        <div className="error"><strong>Error:</strong> {searchError}</div>
      )}

      {results && results.length > 0 && !searching && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Results</div>
              <div className="help">
                Resources tagged with <strong>{selectedLabel?.name}: {valueOptions.find(v => v.labelValueId === selectedValueId)?.name}</strong>.
                Click a row to see all its labels.
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
                  <ResultRow resource={r} />
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
