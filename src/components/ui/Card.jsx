import React from 'react';

export const Card = ({ title, subtitle, actions, children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <span className="card-subtitle">{subtitle}</span>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export const StatCard = ({ title, value, icon, trend, trendValue, color = 'var(--primary-blue)' }) => {
  const isPositive = trend === 'up';
  return (
    <div className="stat-card" style={{ borderLeftColor: color }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '13px', color: 'var(--gray-medium)', marginBottom: '8px' }}>{title}</div>
          <div style={{ fontFamily: 'var(--font-poppins)', fontSize: '32px', fontWeight: 'bold', color: 'var(--black-deep)' }}>
            {value}
          </div>
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', fontWeight: '600', color: isPositive ? 'var(--success)' : 'var(--danger)' }}>
              <span>{isPositive ? '↑' : '↓'}</span>
              <span>{trendValue}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div style={{ 
            width: '44px', height: '44px', borderRadius: '12px', 
            background: `${color}1E`, color: color, 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
