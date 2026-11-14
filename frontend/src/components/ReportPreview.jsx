import React from 'react';
import { Shield, Eye, Lock, AlertTriangle, CheckSquare, Square, Check, X } from 'lucide-react';

export const ReportPreview = ({
  formData,
  previewData,
  consentGiven,
  onConsentChange,
  onConfirm,
  onEdit,
  isSubmitting = false,
}) => {
  return (
    <div className="cyber-card" style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary-accent)',
          }}
        >
          <Eye size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Review Incident Intelligence Data
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Inspect exactly what information will be logged and what will be transferred to ScamTrace.
          </p>
        </div>
      </div>

      {/* Structured Details Preview */}
      <div style={{ backgroundColor: '#0D1527', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary-accent)', marginBottom: '12px', textTransform: 'uppercase' }}>
          Incident Data Summary
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '13px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>SCAM CATEGORY</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formData.category || 'Not specified'}</span>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>INCIDENT DATE</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formData.date || new Date().toISOString().split('T')[0]}</span>
          </div>

          {formData.phoneNumber && (
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>SUSPECT PHONE</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)' }}>{formData.phoneNumber}</span>
            </div>
          )}

          {formData.url && (
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>MALICIOUS URL / DOMAIN</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-orange)' }}>{formData.url}</span>
            </div>
          )}

          {formData.upiId && (
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>UPI IDENTIFIER / BANK</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>{formData.upiId}</span>
            </div>
          )}

          {formData.email && (
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>EMAIL / SOCIAL HANDLE</span>
              <span style={{ color: 'var(--text-primary)' }}>{formData.email}</span>
            </div>
          )}
        </div>

        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', marginBottom: '4px' }}>INCIDENT DESCRIPTION</span>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {formData.description}
          </p>
        </div>
      </div>

      {/* Intelligence Sharing Audit */}
      <div
        style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#111827',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Lock size={16} style={{ color: 'var(--accent-green)' }} />
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            What ScamTrace Will Receive Upon Consent
          </h4>
        </div>

        <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Threat indicators (Phone numbers, URLs, UPI handles) are hashed and indexed in ScamTrace graph.</li>
          <li>No personal victim names, passwords, PINs, or private chat history are ever transferred.</li>
          <li>Correlated data helps law enforcement and other citizens recognize identical fraud networks.</li>
        </ul>
      </div>

      {/* Explicit Consent Checkbox (MANDATORY UNCHECKED INITIALLY) */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: consentGiven ? 'rgba(56, 189, 248, 0.08)' : 'rgba(248, 113, 113, 0.06)',
          border: consentGiven ? '1px solid var(--primary-accent)' : '1px solid rgba(248, 113, 113, 0.3)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onClick={() => onConsentChange(!consentGiven)}
      >
        <div style={{ color: consentGiven ? 'var(--primary-accent)' : 'var(--text-muted)', marginTop: '2px' }}>
          {consentGiven ? <CheckSquare size={20} /> : <Square size={20} />}
        </div>
        <div>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', display: 'block' }}>
            I grant explicit consent to share these threat indicators with the ScamTrace intelligence network.
          </label>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            If unchecked, this report remains stored locally in ScamShield only and is NOT forwarded to the investigative network mapper.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
        <button
          type="button"
          onClick={onEdit}
          disabled={isSubmitting}
          className="btn btn-secondary"
        >
          Back to Edit
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="btn btn-primary"
        >
          {isSubmitting ? 'Submitting Report...' : consentGiven ? 'Confirm & Share with ScamTrace' : 'Save Locally in ScamShield'}
        </button>
      </div>
    </div>
  );
};

export default ReportPreview;
