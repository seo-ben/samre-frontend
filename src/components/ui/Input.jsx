import React from 'react';

export const Input = ({ label, error, required, className = '', ...props }) => {
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label className="input-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <input 
        className={`input-field ${error ? 'input-error' : ''}`} 
        {...props} 
      />
      {error && (
        <span className="error-msg">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};
