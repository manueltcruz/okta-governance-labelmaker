// frontend/src/components/GroupDetails.jsx

import React, { useMemo, useState } from 'react';
import { Button } from '@okta/odyssey-react-mui';
import { Chip, CircularProgress } from '@mui/material';
import LabelGroups from './LabelGroups';
import AssignLabelForm from './AssignLabelForm';

const OKTA_PARTITION = import.meta.env.VITE_OKTA_PARTITION || 'oktapreview';
const OKTA_ORG_ID = import.meta.env.VITE_OKTA_ORG_ID || '00ou52nw1BecRJ5jB1d6';

const GroupDetails = ({
  resource,
  assignments,
  isLoading,
  error,
  onAssignLabel,
  onUnassignLabel,
  allLabels,
}) => {
  const [showAssignForm, setShowAssignForm] = useState(false);

  const orn = useMemo(() => {
    const id = resource?.id || '';
    return `orn:${OKTA_PARTITION}:directory:${OKTA_ORG_ID}:groups:${id}`;
  }, [resource?.id]);

  const name = resource?.profile?.name || 'Unnamed group';
  const description = resource?.profile?.description || 'N/A';
  const type = resource?.type || 'group';
  const logoUrl = resource?._links?.logo?.[0]?.href;

  const handleSaveAssignment = (selectedLabelValueId) => {
    onAssignLabel(orn, selectedLabelValueId);
    setShowAssignForm(false);
  };

  const handleDeleteAssignment = (_labelGroupId, labelValueId) => {
    onUnassignLabel(orn, labelValueId);
  };

  const hasAssignments = Array.isArray(assignments) ? assignments.length > 0 : Boolean(assignments);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className="h-11 w-11 flex-none rounded-xl border border-slate-200 bg-white object-contain"
              loading="lazy"
            />
          ) : (
            <div className="h-11 w-11 flex-none rounded-xl border border-slate-200 bg-slate-50" />
          )}

          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-slate-900">{name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Chip label={`Type: ${type}`} size="small" />
              {resource?.id ? <Chip label={`ID: ${resource.id}`} size="small" variant="outlined" /> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-none items-center gap-2">
          <Button
            variant={showAssignForm ? 'secondary' : 'primary'}
            onClick={() => setShowAssignForm((v) => !v)}
            isDisabled={isLoading}
          >
            {showAssignForm ? 'Cancel' : 'Assign label'}
          </Button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Resource ORN</div>
            <div className="help">Used when assigning governance labels to this group.</div>
          </div>
        </div>
        <div className="card-body">
          <code className="block w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
            {orn}
          </code>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Details</div>
            <div className="help">Basic metadata for the selected group.</div>
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="label mb-1">Name</div>
              <div className="text-sm text-slate-900">{name}</div>
            </div>
            <div>
              <div className="label mb-1">Type</div>
              <div className="text-sm text-slate-900">{type}</div>
            </div>
            <div className="md:col-span-2">
              <div className="label mb-1">Description</div>
              <div className="text-sm text-slate-900">{description}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Assigned labels</div>
            <div className="help">View, assign, or unassign label values for this group.</div>
          </div>
          {isLoading ? <CircularProgress size={18} /> : null}
        </div>

        <div className="card-body space-y-4">
          {error ? (
            <div className="error">
              <strong>Error:</strong> {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="text-sm text-slate-600">Loading assignments…</div>
          ) : !showAssignForm ? (
            <>
              {!hasAssignments ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  No labels are currently assigned to this group.
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200">
                  <LabelGroups data={assignments} onDeleteValue={handleDeleteAssignment} />
                </div>
              )}
            </>
          ) : null}

          {showAssignForm ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 text-sm font-medium text-slate-900">Assign a label value</div>
              <AssignLabelForm
                allLabels={allLabels}
                onSave={handleSaveAssignment}
                onCancel={() => setShowAssignForm(false)}
                isLoading={isLoading}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
