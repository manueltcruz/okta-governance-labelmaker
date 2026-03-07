import React, { useEffect, useMemo, useState } from 'react';
import { isColorDark } from '../utils/colorUtils';
import ModalShell from './ModalShell';

const EditLabelValueModal = ({ data, onSave, onCancel, isLoading }) => {
  const { group, value } = data || {};

  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('Gray'); // store color NAME
  const [error, setError] = useState('');

  const colorOptions = useMemo(
    () => [
      { name: 'Gray', hex: '#808080' },
      { name: 'Red', hex: '#DC143C' },
      { name: 'Orange', hex: '#FFA500' },
      { name: 'Yellow', hex: '#FFD700' },
      { name: 'Lime', hex: '#00FF00' },
      { name: 'Green', hex: '#228B22' },
      { name: 'Cyan', hex: '#00FFFF' },
      { name: 'Blue', hex: '#0000FF' },
      { name: 'Indigo', hex: '#4B0082' },
      { name: 'Purple', hex: '#800080' },
      { name: 'Pink', hex: '#FFC0CB' },
      { name: 'Brown', hex: '#A52A2A' },
    ],
    []
  );

  useEffect(() => {
    setError('');
    if (!value) return;

    setLabelName(value.name || '');

    const currentColor = value.metadata?.additionalProperties?.backgroundColor || 'Gray';
    // map hex -> name if needed; if already a name, keep it
    const colorName =
      colorOptions.find((c) => c.hex.toLowerCase() === String(currentColor).toLowerCase())
        ?.name || currentColor;

    setLabelColor(colorName);
  }, [value, colorOptions]);

  const isOpen = Boolean(data && group && value);

  const selectedColorObject =
    colorOptions.find((c) => c.name === labelColor) || colorOptions[0];

  const selectedTextColor = isColorDark(selectedColorObject.hex)
    ? '#ffffff'
    : '#111827';

  const handleClose = () => {
    if (isLoading) return;
    setError('');
    onCancel?.();
  };

  const handleSave = () => {
    setError('');

    if (!group?.labelId) return setError('Missing label group id.');
    if (!value?.labelValueId) return setError('Missing label value id.');

    const name = labelName.trim();
    if (!name) return setError('Label name is required.');

    // Preserve your existing call signature:
    // onSave(group.labelId, value.labelValueId, { name, color: labelColor })
    onSave?.(group.labelId, value.labelValueId, { name, color: labelColor });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit label value`}
      description={value?.name ? `Update "${value.name}"` : 'Update label value'}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button className="btn-secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Save changes'}
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
          <label htmlFor="edit-labelName" className="label mb-1 block">
            Label name
          </label>
          <input
            id="edit-labelName"
            className="input"
            type="text"
            value={labelName}
            onChange={(e) => setLabelName(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="edit-labelColor" className="label mb-1 block">
            Label color
          </label>

          {/* Keep inline style for dynamic preview */}
          <select
            id="edit-labelColor"
            className="input"
            value={labelColor}
            onChange={(e) => setLabelColor(e.target.value)}
            disabled={isLoading}
            style={{
              backgroundColor: selectedColorObject.hex,
              color: selectedTextColor,
            }}
          >
            {colorOptions.map((color) => (
              <option
                key={color.name}
                value={color.name}
                style={{
                  backgroundColor: color.hex,
                  color: isColorDark(color.hex) ? '#ffffff' : '#111827',
                }}
              >
                {color.name}
              </option>
            ))}
          </select>

          <div className="help mt-2">
            Selected: <span className="font-medium text-slate-900">{labelColor}</span>
          </div>
        </div>
      </div>
    </ModalShell>
  );
};

export default EditLabelValueModal;
