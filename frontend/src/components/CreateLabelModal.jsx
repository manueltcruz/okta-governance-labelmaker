// frontend/src/components/CreateLabelModal.jsx

import React, { useEffect, useMemo, useState } from 'react';
import ModalShell from './ModalShell';

const CreateLabelModal = ({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,

  // Provided by LabelManager
  allowedColors = ['gray'],
  colorToHex = { gray: '#808080' },
  normalizeColorName = (v) => String(v || 'gray').toLowerCase(),
}) => {
  const [groupName, setGroupName] = useState('');
  const [labelName, setLabelName] = useState('');
  const [labelColorName, setLabelColorName] = useState('gray');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setGroupName('');
    setLabelName('');
    setLabelColorName('gray');
  }, [isOpen]);

  const previewHex = useMemo(() => {
    const name = normalizeColorName(labelColorName);
    return colorToHex[name] || colorToHex.gray || '#808080';
  }, [labelColorName, normalizeColorName, colorToHex]);

  const handleClose = () => {
    if (isLoading) return;
    setError('');
    onClose?.();
  };

  const handleCreate = async () => {
    setError('');
    if (!groupName.trim()) return setError('Category name is required.');
    if (!labelName.trim()) return setError('Initial value name is required.');

    try {
      await onCreate?.({
        groupName: groupName.trim(),
        labelName: labelName.trim(),
        labelColor: normalizeColorName(labelColorName), // ✅ NAME
      });
      onClose?.();
    } catch (e) {
      setError(e?.message || 'Failed to create label category.');
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title="Create label category"
      description="Creates a category with an initial value and color."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn-secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Creating…' : 'Create'}
          </button>
        </div>
      }
    >
      {error ? (
        <div className="error mb-4">
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <div className="space-y-4">
        <div>
          <div className="label mb-1">Category name</div>
          <input
            className="input"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g., Data Classification"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="label mb-1">Initial value name</div>
            <input
              className="input"
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              placeholder="e.g., Confidential"
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="label mb-1">Initial value color</div>

            <div className="flex items-center gap-3">
              <span
                className="inline-flex h-10 w-10 flex-none rounded-xl border border-slate-200"
                style={{ backgroundColor: previewHex }}
                aria-hidden="true"
              />
              <select
                className="input"
                value={normalizeColorName(labelColorName)}
                onChange={(e) => setLabelColorName(e.target.value)}
                disabled={isLoading}
              >
                {allowedColors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="help mt-2">
              Color is sent to the backend as a <strong>name</strong>.
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default CreateLabelModal;
