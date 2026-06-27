import React from 'react';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  icon, 
  onClick, 
  className = '', 
  ...props 
}) => {
  return (
    <button 
      className={`btn btn-${variant} ${size} ${className}`} 
      onClick={onClick}
      {...props}
    >
      {icon && <span className="icon">{icon}</span>}
      {children}
    </button>
  );
};
