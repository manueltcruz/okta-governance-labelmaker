import React, { useEffect, useState } from 'react';
import ModalShell from './ModalShell';

const AddLabelValueModal = ({ isOpen, onClose, labelGroup, onAdd, isLoading = false }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2D6CDF');
  const [error, setError] = useState('');

  useEffect(() => {
    setName('');
    setColor('#2D6CDF');
    setError('');
  }, [isOpen, labelGroup]);

  const handleClose = () => {
    if (isLoading) return;
    onClose?.();
  };

  const handleAdd = async () => {
    setError('');
    if (!labelGroup?.labelId) return setError('Missing label group id.');
    if (!name.trim()) return setError('Value name is required.');

    try {
      await onAdd?.({ labelId: labelGroup.labelId, name: name.trim(), color });
      onClose?.();
    } catch (e) {
      setError(e?.message || 'Failed to add value.');
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Add label value"
      description={labelGroup?.name ? `Add a value to "${labelGroup.name}".` : 'Add a value to the selected category.'}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn-secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleAdd} disabled={isLoading}>
            {isLoading ? 'Adding…' : 'Add'}
          </button>
        </div>
      }
    >
      {error ? <div className="error mb-4"><strong>Error:</strong> {error}</div> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="label mb-1">Value name</div>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Internal"
            disabled={isLoading}
          />
        </div>

        <div>
          <div className="label mb-1">Color</div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              className="h-10 w-12 cursor-pointer rounded-md border border-slate-200 bg-white p-1"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={isLoading}
            />
            <span className="text-sm text-slate-600">{color}</span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default AddLabelValueModal;
