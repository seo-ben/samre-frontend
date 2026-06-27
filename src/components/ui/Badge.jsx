import React from 'react';

export const Badge = ({ children, status = 'info', className = '' }) => {
  return (
    <span className={`badge badge-${status} ${className}`}>
      {children}
    </span>
  );
};
