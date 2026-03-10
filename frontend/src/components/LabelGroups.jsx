// frontend/src/components/LabelGroups.jsx

import React from 'react';
import { isColorDark } from '../utils/colorUtils';
import Card from './ui/Card';
import IconButton from './ui/IconButton';

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const IconPencil = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    <path d="M15 5l4 4"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6m4-6v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);

const LabelGroups = ({
  data,
  onEditGroup,
  onDeleteGroup,
  onAddValue,
  onEditValue,
  onDeleteValue,
  isBusy = false,
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="p-4 text-sm text-slate-600">No label groups found.</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="divide-y divide-slate-200">
        {data.map((labelGroup) => (
          <div key={labelGroup.labelId} className="p-4 sm:p-5">
            {/* Group header (hover reveal actions) */}
            <div className="rounded-xl px-2 py-2 -mx-2 transition hover:bg-slate-50">
              <div className="group flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {labelGroup.name}
                  </div>
                  <div className="mt-1 truncate text-xs text-slate-500">
                    {labelGroup.labelId}
                  </div>
                </div>

                {/* Actions: hidden until hover */}
                <div className="flex flex-none items-center gap-2 opacity-0 transition group-hover:opacity-100">
                  {onAddValue ? (
                    <IconButton
                      title="Add value"
                      onClick={() => onAddValue(labelGroup)}
                      variant="primary"
                      disabled={isBusy}
                    >
                      <IconPlus />
                    </IconButton>
                  ) : null}

                  {onEditGroup ? (
                    <IconButton
                      title="Rename group"
                      onClick={() => onEditGroup(labelGroup)}
                      variant="primary"
                      disabled={isBusy}
                    >
                      <IconPencil />
                    </IconButton>
                  ) : null}

                  {onDeleteGroup ? (
                    <button
                      type="button"
                      title="Delete group"
                      onClick={() => onDeleteGroup(labelGroup.labelId)}
                      disabled={isBusy}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <IconTrash />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Values */}
            <div className="mt-4 grid grid-cols-1 gap-2">
              {(labelGroup.values || []).map((value) => {
                const bgColor =
                  value?.metadata?.additionalProperties?.backgroundColor || '#cccccc';
                const textColor = isColorDark(bgColor) ? '#ffffff' : '#111827';

                return (
                  <div
                    key={value.labelValueId}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{ backgroundColor: bgColor, color: textColor }}
                          title={bgColor}
                        >
                          {value.name}
                        </span>
                        <span className="truncate text-xs text-slate-500">
                          {value.labelValueId}
                        </span>
                      </div>
                    </div>

                    {/* Value actions: hidden until hover */}
                    <div className="flex flex-none items-center gap-2 opacity-0 transition group-hover:opacity-100">
                      {onEditValue ? (
                        <IconButton
                          title="Edit value"
                          onClick={() => onEditValue(labelGroup, value)}
                          variant="primary"
                          disabled={isBusy}
                        >
                          <IconPencil />
                        </IconButton>
                      ) : null}

                      {onDeleteValue ? (
                        <button
                          type="button"
                          title="Unassign value"
                          onClick={() =>
                            onDeleteValue(labelGroup.labelId, value.labelValueId)
                          }
                          disabled={isBusy}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <IconTrash />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {(labelGroup.values || []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No values in this group.
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default LabelGroups;