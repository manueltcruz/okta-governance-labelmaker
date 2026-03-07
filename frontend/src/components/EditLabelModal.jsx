// frontend/src/components/EditLabelModal.jsx

import React, { useEffect, useState } from 'react';
import ModalShell from './ModalShell';

const EditLabelModal = ({ isOpen, onClose, labelGroup, onDelete, isLoading = false }) => {
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
  }, [isOpen]);

  const handleClose = () => {
    if (isLoading) return;
    setError('');
    onClose?.();
  };

  const handleDelete = async () => {
    setError('');
    try {
      await onDelete?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || 'Failed to delete label category.');
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Delete label category"
      description="This will permanently delete the selected category."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn-secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn-danger" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      }
    >
      {error ? (
        <div className="error mb-4">
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="label">Selected category</div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900">
          {labelGroup?.name || '(none)'}
        </div>

        <div className="help">
          ID: <code className="text-slate-700">{labelGroup?.id || ''}</code>
        </div>
      </div>
    </ModalShell>
  );
};

export default EditLabelModal;
