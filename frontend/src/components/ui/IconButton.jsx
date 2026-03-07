import React from 'react';

const IconButton = ({
  title,
  onClick,
  variant = 'secondary', // 'secondary' | 'primary' | 'danger'
  disabled = false,
  children,
  className = '',
}) => {
  const base =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';

  const styles =
    variant === 'danger'
      ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
      : variant === 'primary'
        ? 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={[base, styles, disabledStyles, className].join(' ')}
    >
      {children}
    </button>
  );
};

export default IconButton;
