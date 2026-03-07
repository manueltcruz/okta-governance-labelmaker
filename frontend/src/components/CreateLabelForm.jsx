import React, { useMemo, useState } from 'react';
import { Button, TextField } from '@okta/odyssey-react-mui';
import { isColorDark } from '../utils/colorUtils';

const CreateLabelForm = ({ onSubmit, isLoading }) => {
  const [groupName, setGroupName] = useState('');
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('Gray'); // store the color NAME
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

  const selectedColorObject =
    colorOptions.find((c) => c.name === labelColor) || colorOptions[0];

  const selectedTextColor = isColorDark(selectedColorObject.hex)
    ? '#ffffff'
    : '#111827';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const g = groupName.trim();
    const l = labelName.trim();

    if (!g) return setError('New category name is required.');
    if (!l) return setError('Label name is required.');

    onSubmit?.({ groupName: g, labelName: l, labelColor }); // labelColor is NAME
    setGroupName('');
    setLabelName('');
    setLabelColor('Gray');
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">Create new label</div>
        <div className="mt-1 text-xs text-slate-500">
          This will create a new label category with one initial label value.
        </div>
      </div>

      {error ? (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          id="groupName"
          label="New category name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="e.g., Compliance"
          isDisabled={isLoading}
          autoComplete="off"
          isFullWidth
        />

        <TextField
          id="labelName"
          label="Label name"
          value={labelName}
          onChange={(e) => setLabelName(e.target.value)}
          placeholder="e.g., SOX"
          isDisabled={isLoading}
          autoComplete="off"
          isFullWidth
        />

        <div>
          <label htmlFor="labelColor" className="label mb-1 block">
            Label color
          </label>

          {/* We intentionally keep inline style for the dynamic color preview. */}
          <select
            id="labelColor"
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

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" isDisabled={isLoading}>
            {isLoading ? 'Creating…' : 'Create label'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateLabelForm;
