import React from 'react';
import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export const LoadingState = ({ message = 'Loading cyber intelligence data...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        gap: '16px',
        color: 'var(--text-secondary)',
      }}
    >
      <div style={{ position: 'relative' }}>
        <Loader2
          size={36}
          style={{
            color: 'var(--primary-accent)',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>
          {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
        </style>
      </div>
      <div style={{ fontSize: '14px', fontWeight: 500 }}>{message}</div>
    </div>
  );
};

export const ErrorState = ({ title = 'Failed to load intelligence data', message, onRetry }) => {
  return (
    <div
      className="cyber-card"
      style={{
        borderColor: 'rgba(248, 113, 113, 0.4)',
        background: 'rgba(248, 113, 113, 0.05)',
        padding: '32px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        margin: '20px 0',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(248, 113, 113, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-critical)',
        }}
      >
        <AlertCircle size={24} />
      </div>

      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h4>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.5 }}>
        {message || 'The server reported an unexpected error or could not be reached.'}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-secondary"
          style={{ marginTop: '8px', fontSize: '13px' }}
        >
          <RefreshCw size={14} />
          Retry Request
        </button>
      )}
    </div>
  );
};

export const EmptyState = ({ title = 'No records found', message, icon: Icon = Inbox, actionText, onAction }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 20px',
        textAlign: 'center',
        gap: '12px',
        color: 'var(--text-secondary)',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: 'rgba(148, 163, 184, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <Icon size={24} />
      </div>

      <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h4>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px' }}>
        {message || 'No matching intelligence records or signals in this view.'}
      </p>

      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary" style={{ marginTop: '8px' }}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default LoadingState;
