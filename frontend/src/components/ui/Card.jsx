import React from 'react';

const Card = ({ className = '', children }) => {
  return (
    <div
      className={[
        'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
};

export default Card;
