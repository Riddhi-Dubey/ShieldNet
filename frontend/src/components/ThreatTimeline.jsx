import React from 'react';
import { 
  Clock, 
  ShieldAlert, 
  FileWarning, 
  ArrowRightLeft, 
  Briefcase, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import RiskBadge from './RiskBadge';

const getEventIcon = (eventType) => {
  switch (eventType) {
    case 'FIRST_SEEN_RECORD':
      return <Clock size={16} style={{ color: 'var(--primary-accent)' }} />;
    case 'INCIDENT_REPORT_SUBMISSION':
      return <FileWarning size={16} style={{ color: 'var(--accent-orange)' }} />;
    case 'INBOUND_CONNECTION':
    case 'OUTBOUND_CONNECTION':
      return <ArrowRightLeft size={16} style={{ color: 'var(--accent-purple)' }} />;
    case 'CASE_ASSOCIATION':
      return <Briefcase size={16} style={{ color: 'var(--accent-green)' }} />;
    default:
      return <AlertCircle size={16} style={{ color: 'var(--text-secondary)' }} />;
  }
};

export const ThreatTimeline = ({ events = [], loading = false }) => {
  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
        Loading verifiable threat timeline...
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#0D1527',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-muted)',
          fontSize: '13px',
        }}
      >
        No chronological timeline events logged for this identifier yet.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Vertical Spine Line */}
      <div
        style={{
          position: 'absolute',
          left: '11px',
          top: '8px',
          bottom: '8px',
          width: '2px',
          backgroundColor: 'var(--border-color)',
        }}
      />

      {events.map((ev, idx) => (
        <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Node Dot / Icon */}
          <div
            style={{
              position: 'absolute',
              left: '-28px',
              top: '2px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#0B1020',
              border: '2px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            {getEventIcon(ev.event_type)}
          </div>

          {/* Event Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {ev.title}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  color: 'var(--primary-accent)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                }}
              >
                {ev.event_type?.replace(/_/g, ' ')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {ev.severity && (
                <span
                  className={`badge badge-${ev.severity.toLowerCase()}`}
                  style={{ fontSize: '10px', padding: '1px 8px' }}
                >
                  {ev.severity}
                </span>
              )}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'Undated'}
              </span>
            </div>
          </div>

          {/* Event Description */}
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            {ev.description}
          </p>

          {/* Event Provenance Source */}
          {ev.provenance && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Provenance:</span>
              <code style={{ color: 'var(--accent-purple)', fontSize: '10.5px' }}>{ev.provenance}</code>
              {ev.confidence && (
                <span style={{ color: 'var(--text-muted)' }}>• Confidence: {Math.round(ev.confidence * 100)}%</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ThreatTimeline;
