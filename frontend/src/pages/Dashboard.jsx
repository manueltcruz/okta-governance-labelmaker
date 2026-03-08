// frontend/src/pages/Dashboard.jsx
// Label coverage dashboard — fetches real data from existing API routes.

import React, { useEffect, useMemo, useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { CircularProgress, Chip } from '@mui/material';

// ── Helpers ────────────────────────────────────────────────────────────────

function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

// ── Stat Card ──────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, accent = false, loading = false }) => (
  <div
    className="card p-6 flex flex-col gap-2"
    style={{
      borderLeft: accent ? '3px solid var(--color-accent)' : undefined,
    }}
  >
    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
      {label}
    </div>
    <div className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.03em' }}>
      {loading ? <CircularProgress size={24} /> : value}
    </div>
    {sub && (
      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{sub}</div>
    )}
  </div>
);

// ── Coverage Bar ───────────────────────────────────────────────────────────

const CoverageBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
        <span className="text-xs flex-none" style={{ color: 'var(--color-text-muted)' }}>{count} resources</span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color || 'var(--color-accent)' }}
        />
      </div>
    </div>
  );
};

// ── Bar colors cycling ─────────────────────────────────────────────────────

const BAR_COLORS = [
  '#2a2a2a', '#4b4b4b', '#36404a', '#606060',
  '#787878', '#909090', '#a8a8a8', '#c0c0c0',
];

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { oktaAuth, authState } = useOktaAuth();

  const accessToken = useMemo(() => {
    if (!authState?.isAuthenticated) return '';
    return oktaAuth.getAccessToken() || '';
  }, [oktaAuth, authState]);

  // Raw data
  const [labels,    setLabels]    = useState([]);
  const [groups,    setGroups]    = useState([]);
  const [apps,      setApps]      = useState([]);
  const [eeApps,    setEeApps]    = useState([]);

  // Per-label-value resource counts: { [labelValueId]: number }
  const [valueCounts, setValueCounts] = useState({});

  // Loading / error states
  const [loadingBase,   setLoadingBase]   = useState(true);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [error,         setError]         = useState('');

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function apiFetch(url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  useEffect(() => {
    if (!authState?.isAuthenticated || !accessToken) return;

    setLoadingBase(true);
    setError('');

    Promise.all([
      apiFetch('/api/governance-labels'),
      apiFetch('/api/groups'),
      apiFetch('/api/apps'),
      apiFetch('/api/apps/entitlement-enabled'),
    ])
      .then(([labelsData, groupsData, appsData, eeData]) => {
        setLabels(extractArray(labelsData));
        setGroups(extractArray(groupsData));
        setApps(extractArray(appsData));
        setEeApps(extractArray(eeData));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingBase(false));
  }, [authState, accessToken]);

  // Once labels load, fetch resource counts per label value (capped at 20 values)
  useEffect(() => {
    if (!labels.length || !accessToken) return;

    const allValues = labels.flatMap(cat =>
      (cat.values || []).map(v => ({
        id: v.labelValueId || v.id,
        name: v.name,
        category: cat.name,
      }))
    ).filter(v => v.id).slice(0, 20);

    if (!allValues.length) return;

    setLoadingCounts(true);

    Promise.all(
      allValues.map(v =>
        apiFetch(`/api/label-search?labelValueId=${encodeURIComponent(v.id)}`)
          .then(data => ({ id: v.id, count: extractArray(data).length }))
          .catch(() => ({ id: v.id, count: 0 }))
      )
    ).then(results => {
      const map = {};
      results.forEach(r => { map[r.id] = r.count; });
      setValueCounts(map);
    }).finally(() => setLoadingCounts(false));
  }, [labels, accessToken]);

  // ── Derived stats ────────────────────────────────────────────────────────

  const totalCategories = labels.length;
  const totalValues     = labels.reduce((n, cat) => n + (cat.values?.length || 0), 0);
  const totalGroups     = groups.length;
  const totalApps       = apps.length;
  const totalEeApps     = eeApps.length;

  // Top label values by resource count
  const topValues = useMemo(() => {
    const allValues = labels.flatMap(cat =>
      (cat.values || []).map(v => ({
        id: v.labelValueId || v.id,
        name: v.name,
        category: cat.name,
        color: v.metadata?.additionalProperties?.backgroundColor,
      }))
    ).filter(v => v.id && valueCounts[v.id] !== undefined);

    return allValues
      .map(v => ({ ...v, count: valueCounts[v.id] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [labels, valueCounts]);

  // Coverage per category — total resources tagged with any value in that category
  const categoryStats = useMemo(() => {
    return labels.map((cat, i) => {
      const ids = (cat.values || [])
        .map(v => v.labelValueId || v.id)
        .filter(Boolean);
      const total = ids.reduce((n, id) => n + (valueCounts[id] || 0), 0);
      return { name: cat.name, total, color: BAR_COLORS[i % BAR_COLORS.length] };
    }).sort((a, b) => b.total - a.total);
  }, [labels, valueCounts]);

  const maxCategoryTotal = Math.max(...categoryStats.map(c => c.total), 1);

  // Total labeled resources (unique-ish — sum across all values, may double-count
  // resources with multiple labels, but good enough for a coverage indicator)
  const totalLabeledResources = Object.values(valueCounts).reduce((n, c) => n + c, 0);

  // ── Render ───────────────────────────────────────────────────────────────

  if (!authState) return null;

  return (
    <div className="space-y-8">

      {error && (
        <div className="error"><strong>Error:</strong> {error}</div>
      )}

      {/* ── Stat row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Label Categories"
          value={totalCategories}
          sub={`${totalValues} total values`}
          accent
          loading={loadingBase}
        />
        <StatCard
          label="Groups"
          value={totalGroups}
          sub="Universal Directory"
          loading={loadingBase}
        />
        <StatCard
          label="Applications"
          value={totalApps}
          sub={`${totalEeApps} entitlement-enabled`}
          loading={loadingBase}
        />
        <StatCard
          label="Labeled Resources"
          value={loadingCounts ? '…' : totalLabeledResources}
          sub="assignments across all values"
          accent
          loading={loadingBase}
        />
      </div>

      {/* ── Bottom two panels ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Coverage by category */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Coverage by Category</div>
              <div className="help">Total resource assignments per label category</div>
            </div>
            {loadingCounts && <CircularProgress size={16} />}
          </div>
          <div className="card-body space-y-4">
            {loadingBase ? (
              <div className="flex justify-center py-6"><CircularProgress size={24} /></div>
            ) : categoryStats.length === 0 ? (
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No label categories found.
              </div>
            ) : (
              categoryStats.map(cat => (
                <CoverageBar
                  key={cat.name}
                  label={cat.name}
                  count={cat.total}
                  total={maxCategoryTotal}
                  color={cat.color}
                />
              ))
            )}
          </div>
        </div>

        {/* Top label values */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Most Used Label Values</div>
              <div className="help">Label values with the most resource assignments</div>
            </div>
            {loadingCounts && <CircularProgress size={16} />}
          </div>
          <div className="card-body">
            {loadingBase || loadingCounts ? (
              <div className="flex justify-center py-6"><CircularProgress size={24} /></div>
            ) : topValues.length === 0 ? (
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No label assignments found yet.
              </div>
            ) : (
              <ul className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
                {topValues.map((v, i) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="flex-none text-xs font-bold w-5 text-right"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {v.name}
                        </div>
                        <div className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>
                          {v.category}
                        </div>
                      </div>
                    </div>
                    <Chip
                      label={`${v.count} resource${v.count !== 1 ? 's' : ''}`}
                      size="small"
                      variant={v.count > 0 ? 'filled' : 'outlined'}
                      color={v.count > 0 ? 'primary' : 'default'}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
