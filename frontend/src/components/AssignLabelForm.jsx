// frontend/src/components/AssignLabelForm.jsx

import React, { useMemo, useState } from 'react';
import { Button } from '@okta/odyssey-react-mui';
import CustomSelect from './CustomSelect';

const StatusChip = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
    {children}
  </span>
);

const AssignLabelForm = ({ allLabels, onSave, onCancel, isLoading }) => {
  const [selectedLabelValueId, setSelectedLabelValueId] = useState('');
  const [validationError, setValidationError] = useState('');

  const selectOptions = useMemo(() => {
    const groups = Array.isArray(allLabels) ? allLabels : [];
    return groups.map((group) => ({
      label: group.name,
      values: (group.values || []).map((value) => ({
        value: value.labelValueId,
        label: value.name,
        color: value.metadata?.additionalProperties?.backgroundColor || '#cccccc',
      })),
    }));
  }, [allLabels]);

  const handleSave = async () => {
    if (isLoading) return;

    if (!selectedLabelValueId) {
      setValidationError('Please select a label value to assign.');
      return;
    }

    setValidationError('');

    // onSave may be sync or async depending on caller
    await onSave?.(selectedLabelValueId);
  };

  const handleCancel = () => {
    if (isLoading) return;
    setValidationError('');
    onCancel?.();
  };

  const hasOptions =
    Array.isArray(selectOptions) &&
    selectOptions.some((g) => Array.isArray(g.values) && g.values.length > 0);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-medium text-slate-600">Select a label value</label>
          {isLoading ? <StatusChip>Assigning…</StatusChip> : null}
        </div>

        <div className="mt-2">
          <CustomSelect
            options={selectOptions}
            value={selectedLabelValueId}
            onChange={(val) => {
              setSelectedLabelValueId(val);
              if (validationError) setValidationError('');
            }}
            placeholder={hasOptions ? 'Choose a label value…' : 'No label values available'}
            disabled={isLoading || !hasOptions}
          />
        </div>

        {validationError ? (
          <div className="mt-2 text-xs font-medium text-rose-700">{validationError}</div>
        ) : (
          <div className="mt-2 text-xs text-slate-600">
            Labels are grouped by category. Select the specific value to assign.
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="secondary"
          onClick={handleCancel}
          isDisabled={isLoading}
        >
          Cancel
        </Button>

        <Button
          variant="primary"
          onClick={handleSave}
          isDisabled={isLoading || !hasOptions}
          tooltipText={!hasOptions ? 'No label values are available to assign.' : undefined}
        >
          {isLoading ? 'Assigning…' : 'Assign'}
        </Button>
      </div>
    </div>
  );
};

export default AssignLabelForm;
