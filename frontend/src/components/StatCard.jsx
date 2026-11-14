import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  color = 'var(--primary-accent)',
  subtitle,
  loading = false,
  onClick,
}) => {
  return (
    <div
      className="cyber-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top indicator bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: color,
          opacity: 0.8,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: `${color}15`,
              border: `1px solid ${color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ height: '36px', width: '60%', margin: '8px 0' }} className="skeleton" />
      ) : (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {value !== undefined && value !== null ? value.toLocaleString() : '—'}
          </div>

          {change !== undefined && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '12px',
                fontWeight: 600,
                color: isPositive ? 'var(--accent-green)' : 'var(--accent-critical)',
              }}
            >
              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {change}
            </div>
          )}
        </div>
      )}

      {subtitle && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatCard;
