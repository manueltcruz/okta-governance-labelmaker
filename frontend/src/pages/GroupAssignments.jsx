// frontend/src/pages/GroupAssignments.jsx

import React, { useEffect, useMemo, useState } from 'react';
import { useOktaAuth } from '@okta/okta-react';
import { TextField } from '@okta/odyssey-react-mui';
import GroupList from '../components/GroupList';
import GroupDetails from '../components/GroupDetails';
import Card from '../components/ui/Card';

const OKTA_PARTITION = import.meta.env.VITE_OKTA_PARTITION || 'oktapreview';
const OKTA_ORG_ID = import.meta.env.VITE_OKTA_ORG_ID || '00ou52nw1BecRJ5jB1d6';

function buildGroupOrn(groupId) {
  return `orn:${OKTA_PARTITION}:directory:${OKTA_ORG_ID}:groups:${groupId}`;
}

const GroupAssignments = () => {
  const { authState, oktaAuth } = useOktaAuth();

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
        const accessToken = oktaAuth.getAccessToken();

        const [groupsResponse, labelsResponse] = await Promise.all([
          fetch('/api/groups', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch('/api/governance-labels', {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        if (!groupsResponse.ok) {
          throw new Error(`Failed to fetch groups: ${await groupsResponse.text()}`);
        }
        setGroups(await groupsResponse.json());

        if (!labelsResponse.ok) {
          throw new Error(`Failed to fetch all labels: ${await labelsResponse.text()}`);
        }
        const labelsData = await labelsResponse.json();
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
  }, [authState, oktaAuth]);

  const fetchAssignedLabels = async (group) => {
    setIsLoadingDetails(true);
    setDetailsError(null);

    const orn = buildGroupOrn(group.id);

    try {
      const accessToken = oktaAuth.getAccessToken();
      const encodedOrn = encodeURIComponent(orn);

      const response = await fetch(`/api/assigned-labels?orn=${encodedOrn}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch assigned labels: ${await response.text()}`);
      }

      const data = await response.json();
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
      const accessToken = oktaAuth.getAccessToken();
      const resp = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orn, labelValueId }),
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

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
    if (!window.confirm('Are you sure you want to unassign this label?')) return;

    setIsSubmitting(true);
    setDetailsError(null);

    try {
      const accessToken = oktaAuth.getAccessToken();
      const resp = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orn, labelValueId }),
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

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
  );
};

export default GroupAssignments;
