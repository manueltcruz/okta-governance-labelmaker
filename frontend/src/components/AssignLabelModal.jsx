import React, { useState } from 'react';
import ModalShell from './ModalShell';
import CustomSelect from './CustomSelect';

const AssignLabelModal = ({ isOpen, onClose, allLabels, onAssign, isLoading = false }) => {
  const [selectedLabelValueId, setSelectedLabelValueId] = useState('');
  const [error, setError] = useState('');

  const options = (allLabels || []).map((group) => ({
    label: group.name,
    values: (group.values || []).map((v) => ({
      value: v.labelValueId,
      label: v.name,
      color: v.metadata?.additionalProperties?.backgroundColor || '#cccccc',
    })),
  }));

  const handleAssign = async () => {
    setError('');
    if (!selectedLabelValueId) return setError('Please select a label value.');
    try {
      await onAssign?.(selectedLabelValueId);
      onClose?.();
    } catch (e) {
      setError(e?.message || 'Failed to assign label.');
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setError('');
    setSelectedLabelValueId('');
    onClose?.();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Assign label"
      description="Select a label value to assign."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn-secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleAssign} disabled={isLoading}>
            {isLoading ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      }
    >
      {error ? <div className="error mb-4"><strong>Error:</strong> {error}</div> : null}

      <div className="space-y-2">
        <div className="label">Label value</div>
        <CustomSelect
          options={options}
          value={selectedLabelValueId}
          onChange={setSelectedLabelValueId}
          placeholder="Choose a label value…"
          disabled={isLoading}
        />
      </div>
    </ModalShell>
  );
};

export default AssignLabelModal;
