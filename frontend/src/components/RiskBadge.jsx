import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

export const RiskBadge = ({ 
  level = 'unknown', 
  score, 
  scoreSuffix = '/100', 
  isSynthetic = false, 
  showIcon = true, 
  size = 'md' 
}) => {
  const normLevel = String(level).toLowerCase().trim();

  let badgeClass = 'badge-neutral';
  let Icon = HelpCircle;
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
    badgeClass = 'badge-critical'; // Red styling for high risk
    Icon = AlertOctagon;
    label = 'High Risk';
  } else if (normLevel === 'critical' || normLevel === 'severe') {
    badgeClass = 'badge-critical';
    Icon = ShieldAlert;
    label = 'Critical Risk';
  } else if (normLevel.includes('unable') || normLevel.includes('unverified') || normLevel === 'unknown') {
    badgeClass = 'badge-neutral';
    Icon = HelpCircle;
    label = 'Unable to Assess';
  }

  const iconSizes = {
    sm: 12,
    small: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <span className={`badge ${badgeClass}`} style={{ fontSize: size === 'sm' || size === 'small' ? '11px' : size === 'lg' ? '13px' : '12px' }}>
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
            {score}{scoreSuffix}
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
