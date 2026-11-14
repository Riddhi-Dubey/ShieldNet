import React from 'react';
import { Database, ShieldCheck, AlertCircle, FileText, Info, CheckCircle2, History } from 'lucide-react';

export const EvidencePanel = ({
  datasetName = 'National Threat Intelligence Feeds',
  source = 'Consolidated Telephony & Cyber Registry',
  evidenceClassification = 'Verified Intelligence',
  recordCount,
  firstReported,
  lastUpdated,
  associatedReports = [],
  limitations = 'Intelligence signals are correlative and should be corroborated with formal forensic subpoenas or bank freeze requisitions before executive prosecution.',
  isSynthetic = false,
}) => {
  return (
    <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} style={{ color: 'var(--primary-accent)' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Dataset Provenance & Evidence
          </h3>
        </div>

        <span
          className={`badge ${isSynthetic ? 'badge-synthetic' : 'badge-low'}`}
          style={{ textTransform: 'capitalize' }}
        >
          {isSynthetic ? 'Synthetic Intel' : evidenceClassification}
        </span>
      </div>

      {/* Grid of Evidence Metadata */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '14px',
          backgroundColor: '#0D1527',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Source Dataset</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {datasetName}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Origin Authority</div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
            {source}
          </div>
        </div>

        {recordCount !== undefined && (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Corroborated Records</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-accent)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {recordCount}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Verified</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '2px' }}>
            {lastUpdated || new Date().toISOString().split('T')[0]}
          </div>
        </div>
      </div>

      {/* Related Reports List if any */}
      {associatedReports && associatedReports.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} /> Associated Consented Incident Reports ({associatedReports.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {associatedReports.map((report, idx) => (
              <div
                key={report.id || idx}
                style={{
                  padding: '10px 12px',
                  backgroundColor: '#111827',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>Ref #{report.id || `INC-${1000 + idx}`}</span>
                  <span>{report.date || 'Recent'}</span>
                </div>
                <div style={{ color: 'var(--text-primary)' }}>{report.description || report.summary || 'Consented incident report submitted via ScamShield.'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Limitations Disclaimer Box */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          padding: '12px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(251, 191, 36, 0.08)',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <Info size={18} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong style={{ color: 'var(--accent-warning)' }}>Investigation Scope & Limitations: </strong>
          {limitations}
        </div>
      </div>
    </div>
  );
};

export default EvidencePanel;
