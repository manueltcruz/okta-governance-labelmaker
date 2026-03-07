// frontend/src/pages/LabelManager.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { Button, TextField } from '@okta/odyssey-react-mui';
import { Chip, CircularProgress } from '@mui/material';

/**
 * Tolerant of:
 * - array responses []
 * - { data: [...] }
 * - { labels: [...] }
 */
function extractLabelArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.labels)) return payload.labels;
  return [];
}

/**
 * UI supports ONLY these color names.
 * Unknown colors should display as gray.
 */
const COLOR_OPTIONS = [
  { name: 'red', hex: '#ef4444' },
  { name: 'orange', hex: '#f97316' },
  { name: 'yellow', hex: '#eab308' },
  { name: 'green', hex: '#22c55e' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'teal', hex: '#14b8a6' },
  { name: 'beige', hex: '#d6c7a1' },
  { name: 'gray', hex: '#9ca3af' },
];

function normalizeColorName(input) {
  if (!input) return 'gray';
  const s = String(input).trim().toLowerCase();
  if (COLOR_OPTIONS.some((c) => c.name === s)) return s;
  if (s === 'grey') return 'gray';
  if (s.startsWith('#')) {
    const found = COLOR_OPTIONS.find((c) => c.hex.toLowerCase() === s);
    return found ? found.name : 'gray';
  }
  return 'gray';
}

function colorNameToHex(name) {
  const n = normalizeColorName(name);
  return COLOR_OPTIONS.find((c) => c.name === n)?.hex || COLOR_OPTIONS[COLOR_OPTIONS.length - 1].hex;
}

/**
 * Okta payloads vary. Normalize IDs.
 * - Category id can be: id OR labelId
 * - Value id can be: id OR labelValueId
 */
function getCategoryId(cat) {
  return cat?.id || cat?.labelId || '';
}
function getValueId(v) {
  return v?.id || v?.labelValueId || '';
}

const IconButton = ({ title, onClick, disabled, children, className = '' }) => {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition',
        'hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
};

const RefreshIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M20 12a8 8 0 0 1-14.314 4.686M4 12a8 8 0 0 1 14.314-4.686"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M20 4v6h-6M4 20v-6h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const TrashIcon = ({ className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M9 3h6m-8 4h10m-9 0 1 14h6l1-14M10 11v6m4-6v6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function LabelManager() {
  const { oktaAuth, authState } = useOktaAuth();

  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Create panel
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [labelName, setLabelName] = useState('');
  const [labelColorName, setLabelColorName] = useState('gray');

  // Selection
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedValueId, setSelectedValueId] = useState('');

  // Edit value (right panel)
  const [editingValueId, setEditingValueId] = useState('');
  const [editValueName, setEditValueName] = useState('');
  const [editValueColorName, setEditValueColorName] = useState('gray');

  const accessToken = useMemo(() => {
    if (!authState?.isAuthenticated) return '';
    return oktaAuth.getAccessToken() || '';
  }, [oktaAuth, authState]);

  async function apiFetch(url, options = {}) {
    if (!accessToken) throw new Error('No access token available. Please re-authenticate.');

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const res = await fetch(url, {
      ...options,
      headers,
      body:
        options.body && headers['Content-Type'] === 'application/json'
          ? JSON.stringify(options.body)
          : options.body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API ${res.status} ${res.statusText}: ${text || '(no body)'}`);
    }

    if (res.status === 204) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return res.text().catch(() => '');
    return res.json();
  }

  async function refreshLabels() {
    setError('');
    setLoading(true);
    try {
      const payload = await apiFetch('/api/governance-labels', { method: 'GET' });
      setLabels(extractLabelArray(payload));
    } catch (e) {
      setError(e?.message || 'Failed to load governance labels.');
      setLabels([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authState) return;

    if (!authState.isAuthenticated) {
      setLoading(false);
      setLabels([]);
      return;
    }

    if (accessToken) refreshLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, accessToken]);

  /**
   * Normalize categories + values so:
   * - Every category/value has a stable ID
   * - Every rendered list item has a stable key (fixes warning)
   */
  const categoryItems = useMemo(() => {
    const arr = Array.isArray(labels) ? labels : [];
    return arr
      .map((raw, index) => {
        const id = getCategoryId(raw);
        const name = raw?.name || 'Unnamed category';
        const valuesRaw = Array.isArray(raw?.values) ? raw.values : [];

        const values = valuesRaw.map((v, vIndex) => {
          const valueId = getValueId(v);
          return {
            _raw: v,
            id: valueId,
            key: valueId || `${id || `cat-${index}`}-value-${vIndex}`,
            name: v?.name || 'Unnamed value',
            rawColor:
              v?.metadata?.additionalProperties?.backgroundColor ||
              v?.metadata?.additionalProperties?.bgColor ||
              '',
          };
        });

        return {
          _raw: raw,
          id,
          key: id || `cat-${index}`,
          name,
          values,
        };
      })
      .filter((c) => c.key); // defensive
  }, [labels]);

  // Keep selection sane when data updates
  useEffect(() => {
    if (!selectedGroupId) return;
    const exists = categoryItems.some((c) => c.id === selectedGroupId);
    if (!exists) {
      setSelectedGroupId('');
      setSelectedValueId('');
      setEditingValueId('');
    }
  }, [categoryItems, selectedGroupId]);

  const selectedCategory = useMemo(() => {
    return categoryItems.find((c) => c.id === selectedGroupId) || null;
  }, [categoryItems, selectedGroupId]);

  const selectedValue = useMemo(() => {
    if (!selectedCategory || !selectedValueId) return null;
    return selectedCategory.values.find((v) => v.id === selectedValueId) || null;
  }, [selectedCategory, selectedValueId]);

  // Load edit fields when selection changes
  useEffect(() => {
    if (!selectedValue) return;
    setEditingValueId(''); // do not auto-open edit mode
    setEditValueName(selectedValue.name || '');
    setEditValueColorName(normalizeColorName(selectedValue.rawColor));
  }, [selectedValue]);

  async function handleCreateCategory() {
    setError('');
    setBusy(true);

    try {
      if (!groupName.trim()) throw new Error('Category name is required.');
      if (!labelName.trim()) throw new Error('Initial value name is required.');

      await apiFetch('/api/governance-labels', {
        method: 'POST',
        body: {
          groupName: groupName.trim(),
          labelName: labelName.trim(),
          labelColor: normalizeColorName(labelColorName), // send NAME
        },
      });

      setGroupName('');
      setLabelName('');
      setLabelColorName('gray');
      setShowCreate(false);

      await refreshLabels();
    } catch (e) {
      setError(e?.message || 'Failed to create label category.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCategory(labelId) {
    const ok = window.confirm('Delete this label category? This cannot be undone.');
    if (!ok) return;

    setError('');
    setBusy(true);

    try {
      await apiFetch(`/api/governance-labels/${encodeURIComponent(labelId)}`, { method: 'DELETE' });

      if (selectedGroupId === labelId) {
        setSelectedGroupId('');
        setSelectedValueId('');
        setEditingValueId('');
      }

      await refreshLabels();
    } catch (e) {
      setError(e?.message || 'Failed to delete category.');
    } finally {
      setBusy(false);
    }
  }

  async function saveEditValue() {
    setError('');
    setBusy(true);

    try {
      if (!selectedGroupId) throw new Error('Select a category first.');
      if (!selectedValueId) throw new Error('Select a value first.');
      if (!editValueName.trim()) throw new Error('Value name is required.');

      await apiFetch(
        `/api/governance-labels/${encodeURIComponent(selectedGroupId)}/values/${encodeURIComponent(
          selectedValueId
        )}`,
        {
          method: 'PATCH',
          body: {
            name: editValueName.trim(),
            color: normalizeColorName(editValueColorName), // send NAME
          },
        }
      );

      setEditingValueId('');
      await refreshLabels();
    } catch (e) {
      setError(e?.message || 'Failed to update value.');
    } finally {
      setBusy(false);
    }
  }

  if (!authState) {
    return <div className="card p-4 text-sm text-slate-600">Initializing authentication…</div>;
  }

  if (!authState.isAuthenticated) {
    return <div className="card p-4 text-sm text-slate-600">Not authenticated. Redirecting…</div>;
  }

  // widened left panel per your earlier request
  const leftPanelWidthClasses = 'lg:col-span-5 xl:col-span-5';
  const rightPanelWidthClasses = 'lg:col-span-7 xl:col-span-7';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT */}
      <section className={`space-y-3 ${leftPanelWidthClasses}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">Label categories</h2>
            <p className="mt-1 text-sm text-slate-600">
              Browse categories and values. Select a value to edit it.
            </p>
          </div>

          <div className="flex flex-none items-center gap-2">
            <IconButton title="Refresh" onClick={refreshLabels} disabled={busy || loading || !accessToken}>
              <RefreshIcon />
            </IconButton>

            <IconButton
              title="Create category"
              onClick={() => setShowCreate((v) => !v)}
              disabled={busy}
              className={showCreate ? 'bg-slate-50' : ''}
            >
              <PlusIcon />
            </IconButton>
          </div>
        </div>

        {error ? (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        ) : null}

        {showCreate ? (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Create category</div>
                <div className="help">Creates a category with an initial value and color.</div>
              </div>
              <Button variant="secondary" onClick={() => setShowCreate(false)} isDisabled={busy}>
                Close
              </Button>
            </div>

            <div className="card-body space-y-4">
              <TextField
                label="Category name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Privileged"
                isDisabled={busy}
                isFullWidth
              />

              <TextField
                label="Initial value name"
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                placeholder="e.g., Privileged"
                isDisabled={busy}
                isFullWidth
              />

              <div>
                <div className="label mb-1">Initial value color</div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {COLOR_OPTIONS.map((c) => {
                    const selected = normalizeColorName(labelColorName) === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setLabelColorName(c.name)}
                        disabled={busy}
                        className={[
                          'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm',
                          selected
                            ? 'border-slate-400 bg-slate-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <span className="capitalize text-slate-800">{c.name}</span>
                        <span
                          className="h-4 w-4 rounded-full border border-slate-200"
                          style={{ backgroundColor: c.hex }}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="help mt-2">
                  Unknown colors normalize to <strong>gray</strong>.
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowCreate(false)} isDisabled={busy}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCreateCategory} isDisabled={busy || !accessToken}>
                  {busy ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <div className="card-title">Browse</div>
              <div className="help">Click a category to reveal values. Click a value to edit.</div>
            </div>
            {loading ? <CircularProgress size={18} /> : null}
          </div>

          <div className="divide-y divide-slate-200">
            {!loading && categoryItems.length === 0 ? (
              <div className="p-4 text-sm text-slate-600">No label categories returned.</div>
            ) : null}

            {categoryItems.map((cat) => {
              const isSelectedCategory = selectedGroupId === cat.id;
              const values = cat.values || [];

              return (
                <div key={cat.key} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className={[
                        'min-w-0 text-left',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2',
                      ].join(' ')}
                      onClick={() => {
                        if (isSelectedCategory) {
                          setSelectedGroupId('');
                          setSelectedValueId('');
                          setEditingValueId('');
                        } else {
                          setSelectedGroupId(cat.id);
                          setSelectedValueId('');
                          setEditingValueId('');
                        }
                      }}
                    >
                      <div className="truncate text-sm font-semibold text-slate-900">{cat.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Chip label={`${values.length} values`} size="small" />
                        <Chip label={`ID: ${cat.id || '(missing id)'}`} size="small" variant="outlined" />
                      </div>
                    </button>

                    {isSelectedCategory ? (
                      <IconButton
                        title="Delete category"
                        onClick={() => handleDeleteCategory(cat.id)}
                        disabled={busy || !cat.id}
                        className="text-rose-700 hover:bg-rose-50"
                      >
                        <TrashIcon />
                      </IconButton>
                    ) : null}
                  </div>

                  {isSelectedCategory ? (
                    <div className="mt-4 space-y-2">
                      {values.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          No values in this category.
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {values.map((v) => {
                            const colorName = normalizeColorName(v.rawColor);
                            const chipHex = colorNameToHex(colorName);
                            const isSelectedValue = selectedValueId === v.id;

                            return (
                              <li key={v.key}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!v.id) return;
                                    setSelectedValueId(v.id);
                                    setEditingValueId('');
                                  }}
                                  disabled={!v.id}
                                  className={[
                                    'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition',
                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200',
                                    !v.id
                                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                                      : isSelectedValue
                                        ? 'border-slate-300 bg-slate-50'
                                        : 'border-slate-200 bg-white hover:bg-slate-50',
                                  ].join(' ')}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="h-3.5 w-3.5 rounded-full border border-slate-200"
                                        style={{ backgroundColor: chipHex }}
                                        aria-hidden="true"
                                      />
                                      <span className="truncate font-medium text-slate-900">
                                        {v.name}
                                      </span>
                                      <Chip label={colorName} size="small" sx={{ textTransform: 'capitalize' }} />
                                    </div>
                                    <div className="mt-1 truncate text-xs text-slate-500">
                                      {v.id || '(missing value id)'}
                                    </div>
                                  </div>

                                  {isSelectedValue ? (
                                    <Chip label="Selected" size="small" color="primary" />
                                  ) : (
                                    <span className="text-xs text-slate-400">Pick</span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* RIGHT */}
      <section className={`space-y-3 ${rightPanelWidthClasses}`}>
        {!selectedCategory ? (
          <div className="card p-8">
            <div className="text-sm text-slate-600">
              Select a category on the left to see its values. Then select a value to edit.
            </div>
          </div>
        ) : !selectedValue ? (
          <div className="card p-8">
            <div className="text-sm text-slate-600">
              Select a value under <strong>{selectedCategory.name}</strong> to edit it.
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Edit label value</div>
                <div className="help">Update the selected value’s name and color.</div>
              </div>
              {busy ? <CircularProgress size={18} /> : null}
            </div>

            <div className="card-body space-y-4">
              <div>
                <div className="label mb-1">Selected category</div>
                <div className="text-sm font-semibold text-slate-900">{selectedCategory.name}</div>
                <div className="mt-1 text-xs text-slate-500">{selectedCategory.id}</div>
              </div>

              <div>
                <div className="label mb-1">Selected value</div>
                <div className="text-sm font-semibold text-slate-900">{selectedValue.name}</div>
                <div className="mt-1 text-xs text-slate-500">{selectedValue.id}</div>
              </div>

              <div className="h-px bg-slate-100" />

              <TextField
                label="New value name"
                value={editingValueId ? editValueName : selectedValue.name || ''}
                onChange={(e) => {
                  if (!editingValueId) setEditingValueId(selectedValue.id);
                  setEditValueName(e.target.value);
                }}
                isDisabled={busy}
                isFullWidth
              />

              <div>
                <div className="label mb-2">Color</div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {COLOR_OPTIONS.map((c) => {
                    const current = editingValueId
                      ? normalizeColorName(editValueColorName)
                      : normalizeColorName(selectedValue.rawColor);

                    const selected = current === c.name;

                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          if (!editingValueId) setEditingValueId(selectedValue.id);
                          setEditValueColorName(c.name);
                        }}
                        disabled={busy}
                        className={[
                          'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm',
                          selected
                            ? 'border-slate-400 bg-slate-50'
                            : 'border-slate-200 bg-white hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <span className="capitalize text-slate-800">{c.name}</span>
                        <span
                          className="h-4 w-4 rounded-full border border-slate-200"
                          style={{ backgroundColor: c.hex }}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="help mt-2">
                  Unknown colors normalize to <strong>gray</strong>.
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingValueId('');
                    setEditValueName(selectedValue.name || '');
                    setEditValueColorName(normalizeColorName(selectedValue.rawColor));
                  }}
                  isDisabled={busy}
                >
                  Reset
                </Button>
                <Button
                  variant="primary"
                  onClick={saveEditValue}
                  isDisabled={busy || !editValueName.trim()}
                >
                  Save
                </Button>
              </div>

              <div className="help">
                Note: Some orgs treat a “category value” as read-only. If Okta rejects the update,
                you will see a clear error message from the server.
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
