import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, ShieldAlert, Sparkles } from 'lucide-react';

export const RiskBadge = ({ level = 'unknown', score, isSynthetic = false, showIcon = true, size = 'md' }) => {
  const normLevel = String(level).toLowerCase();

  let badgeClass = 'badge-neutral';
  let Icon = ShieldCheck;
  let label = 'Unknown';

  if (normLevel === 'low' || normLevel === 'safe') {
    badgeClass = 'badge-low';
    Icon = ShieldCheck;
    label = 'Low Risk';
  } else if (normLevel === 'medium' || normLevel === 'moderate') {
    badgeClass = 'badge-medium';
    Icon = AlertTriangle;
    label = 'Medium Risk';
  } else if (normLevel === 'high') {
    badgeClass = 'badge-high';
    Icon = AlertOctagon;
    label = 'High Risk';
  } else if (normLevel === 'critical' || normLevel === 'severe') {
    badgeClass = 'badge-critical';
    Icon = ShieldAlert;
    label = 'Critical Risk';
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <span className={`badge ${badgeClass}`} style={{ fontSize: size === 'sm' ? '11px' : size === 'lg' ? '13px' : '12px' }}>
        {showIcon && <Icon size={iconSizes[size] || 14} />}
        <span>{label}</span>
        {score !== undefined && score !== null && (
          <span style={{ 
            opacity: 0.9, 
            marginLeft: '4px', 
            paddingLeft: '6px', 
            borderLeft: '1px solid currentColor',
            fontFamily: 'var(--font-mono)' 
          }}>
            {score}/100
          </span>
        )}
      </span>

      {isSynthetic && (
        <span className="badge badge-synthetic" title="Synthetic pattern or test entity">
          <Sparkles size={12} />
          Synthetic
        </span>
      )}
    </div>
  );
};

export default RiskBadge;
