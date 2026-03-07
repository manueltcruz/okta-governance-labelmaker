// frontend/src/components/CustomSelect.jsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { isColorDark } from '../utils/colorUtils';

const CustomSelect = ({ options, value, onChange, placeholder, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (disabled && isOpen) setIsOpen(false);
  }, [disabled, isOpen]);

  const selectedOption = useMemo(() => {
    const groups = Array.isArray(options) ? options : [];
    return groups
      .flatMap((group) => group.values || [])
      .find((opt) => opt.value === value);
  }, [options, value]);

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen((v) => !v);
  };

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const onTriggerKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleOpen();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggleOpen}
        onKeyDown={onTriggerKeyDown}
        className={[
          'flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200',
          disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
            : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
        ].join(' ')}
        aria-haspopup="listbox"
        aria-expanded={isOpen ? 'true' : 'false'}
        disabled={disabled}
      >
        <div className="flex min-w-0 items-center gap-2">
          {selectedOption ? (
            <span
              className="inline-flex h-4 w-4 flex-none rounded-full border border-slate-200"
              style={{ backgroundColor: selectedOption.color || '#cccccc' }}
              aria-hidden="true"
            />
          ) : (
            <span className="inline-flex h-4 w-4 flex-none rounded-full border border-slate-200 bg-slate-50" />
          )}

          <span className={`truncate ${selectedOption ? '' : 'text-slate-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <span className={disabled ? 'text-slate-300' : 'text-slate-500'}>▾</span>
      </button>

      {isOpen ? (
        <div
          className="absolute z-[9999] mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg"
          role="listbox"
        >
          {/* IMPORTANT: viewport-relative max height + explicit y-scroll */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {(options || []).map((group) => (
              <div key={group.label} className="py-1">
                <div className="px-2 pb-1 pt-2 text-xs font-semibold text-slate-500">
                  {group.label}
                </div>

                <div className="space-y-1">
                  {(group.values || []).map((opt) => {
                    const bg = opt.color || '#cccccc';
                    const fg = isColorDark(bg) ? '#ffffff' : '#111827';
                    const isSelected = opt.value === value;

                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => handleSelect(opt.value)}
                        className={[
                          'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-200',
                          isSelected ? 'ring-1 ring-slate-300' : 'hover:bg-slate-50',
                        ].join(' ')}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="inline-flex h-4 w-4 flex-none rounded-full border border-slate-200"
                            style={{ backgroundColor: bg }}
                            aria-hidden="true"
                          />
                          <span className="truncate text-slate-900">{opt.label}</span>
                        </div>

                        <span
                          className="rounded-full px-2 py-1 text-[11px] font-medium"
                          style={{ backgroundColor: bg, color: fg }}
                          title={bg}
                        >
                          {isSelected ? 'Selected' : 'Pick'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Tip: scroll inside the menu to see more values.
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CustomSelect;
