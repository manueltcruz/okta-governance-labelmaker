import React from 'react';
import Card from './ui/Card';

const GroupList = ({ groups, onSelectGroup, selectedGroupId }) => {
  if (!groups || groups.length === 0) {
    return (
      <Card>
        <div className="p-4 text-sm text-slate-600">No groups found.</div>
      </Card>
    );
  }

  return (
    <Card>
      <ul className="divide-y divide-slate-200">
        {groups.map((group) => {
          const logoUrl = group?._links?.logo?.[0]?.href;
          const isSelected = selectedGroupId && selectedGroupId === group.id;

          return (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => onSelectGroup(group)}
                className={[
                  'group w-full text-left',
                  'px-4 py-3 sm:px-5',
                  'transition',
                  isSelected ? 'bg-slate-50' : 'bg-white hover:bg-slate-50',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt=""
                        className="h-9 w-9 flex-none rounded-lg border border-slate-200 bg-white object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        {String(group?.profile?.name || '?')
                          .trim()
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {group?.profile?.name || 'Unnamed group'}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        {group?.profile?.description || 'No description'}
                      </div>
                    </div>
                  </div>

                  <div className="hidden flex-none text-xs text-slate-400 sm:block">
                    {group.id}
                  </div>
                </div>

                <div className="mt-2 truncate text-xs text-slate-400 sm:hidden">
                  {group.id}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default GroupList;
