// frontend/src/pages/GroupAssignments.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { TextField } from '@okta/odyssey-react-mui';
import GroupList from '../components/GroupList';
import GroupDetails from '../components/GroupDetails';
import Card from '../components/ui/Card';
import { useApiClient } from '../hooks/useApiClient';
import { useConfirm } from '../hooks/useConfirm';
import { useDataContext } from '../context/DataContext';
import { buildGroupOrn } from '../utils/orn';

const GroupAssignments = () => {
  const { authState } = useOktaAuth();
  const apiFetch = useApiClient();
  const { confirm, confirmDialog } = useConfirm();
  const { invalidate } = useDataContext();

  const [groups, setGroups] = useState(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupsError, setGroupsError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [assignedLabels, setAssignedLabels] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const [allLabels, setAllLabels] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingGroups(true);
      setGroupsError(null);

      try {
        const [groupsData, labelsData] = await Promise.all([
          apiFetch('/api/groups'),
          apiFetch('/api/governance-labels'),
        ]);

        setGroups(groupsData);
        setAllLabels(labelsData?.data || []);
      } catch (err) {
        setGroupsError(err?.message || 'Failed to load group data.');
      } finally {
        setIsLoadingGroups(false);
      }
    };

    if (authState?.isAuthenticated) {
      fetchInitialData();
    }
  }, [authState]);

  const fetchAssignedLabels = async (group) => {
    setIsLoadingDetails(true);
    setDetailsError(null);

    const orn = buildGroupOrn(group.id);

    try {
      const data = await apiFetch(`/api/assigned-labels?orn=${encodeURIComponent(orn)}`);
      setAssignedLabels(data);
    } catch (err) {
      setDetailsError(err?.message || 'Failed to load assigned labels.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    fetchAssignedLabels(group);
  };

  const handleAssignLabel = async (orn, labelValueId) => {
    setIsSubmitting(true);
    setDetailsError(null);

    try {
      await apiFetch('/api/assignments', {
        method: 'POST',
        body: { orn, labelValueId },
      });
      invalidate();
      if (selectedGroup) {
        fetchAssignedLabels(selectedGroup);
      }
    } catch (err) {
      setDetailsError(err?.message || 'Failed to assign label.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignLabel = async (orn, labelValueId) => {
    const ok = await confirm('Unassign label', 'Are you sure you want to unassign this label?', 'Unassign');
    if (!ok) return;

    setIsSubmitting(true);
    setDetailsError(null);

    try {
      await apiFetch('/api/assignments', {
        method: 'DELETE',
        body: { orn, labelValueId },
      });
      invalidate();
      if (selectedGroup) {
        fetchAssignedLabels(selectedGroup);
      }
    } catch (err) {
      setDetailsError(err?.message || 'Failed to unassign label.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    const q = searchTerm.trim().toLowerCase();
    if (!q) return groups;

    return groups.filter((group) =>
      String(group?.profile?.name || '').toLowerCase().includes(q)
    );
  }, [groups, searchTerm]);

  if (!authState) {
    return (
      <Card className="p-4">
        <div className="text-sm text-slate-600">Loading authentication…</div>
      </Card>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <Card className="p-4">
        <div className="text-sm text-slate-600">Please sign in to continue.</div>
      </Card>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="space-y-3 lg:col-span-5 xl:col-span-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Okta groups</h2>
          <p className="mt-1 text-sm text-slate-600">
            Select a group to view and manage assigned labels.
          </p>
        </div>

        <Card className="p-4">
          <TextField
            label="Search"
            placeholder="Search for a group…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            isFullWidth
          />
          <div className="mt-3 text-xs text-slate-500">
            {groups ? `${filteredGroups.length} shown` : ''}
          </div>
        </Card>

        {isLoadingGroups ? (
          <Card className="p-4">
            <div className="text-sm text-slate-600">Loading groups…</div>
          </Card>
        ) : null}

        {groupsError ? (
          <div className="overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <strong>Error:</strong> {groupsError}
          </div>
        ) : null}

        {groups ? (
          <GroupList
            groups={filteredGroups}
            onSelectGroup={handleSelectGroup}
            selectedGroupId={selectedGroup?.id}
          />
        ) : null}
      </section>

      <section className="lg:col-span-7 xl:col-span-8">
        {!selectedGroup ? (
          <Card className="p-8">
            <div className="text-sm text-slate-600">
              Select a group on the left to see details and assignments.
            </div>
          </Card>
        ) : (
          <GroupDetails
            resource={selectedGroup}
            assignments={assignedLabels}
            isLoading={isLoadingDetails}
            error={detailsError}
            allLabels={allLabels}
            onAssignLabel={handleAssignLabel}
            onUnassignLabel={handleUnassignLabel}
            isBusy={isSubmitting}
          />
        )}
      </section>
    </div>
    {confirmDialog}
    </>
  );
};

export default GroupAssignments;
