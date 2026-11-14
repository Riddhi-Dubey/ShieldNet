import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Server, FileCheck2 } from 'lucide-react';

export const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="cyber-card"
        style={{
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0F172A',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 0 40px rgba(56, 189, 248, 0.15)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--primary-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Privacy & Consent Architecture
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Zero unsolicited data harvesting. Cryptographic hashing of indicators.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <div style={{ padding: '14px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)', fontWeight: 700, marginBottom: '6px' }}>
              <EyeOff size={16} />
              <span>1. Zero Auto-Sharing Policy</span>
            </div>
            <p>
              When you paste messages into the Message Checker or scan URLs in the URL Checker, your text is analyzed strictly in-memory by our detection pipeline. 
              <strong> It is never automatically forwarded, stored, or exposed to the public ScamTrace investigation registry.</strong>
            </p>
          </div>

          <div style={{ padding: '14px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-accent)', fontWeight: 700, marginBottom: '6px' }}>
              <Server size={16} />
              <span>2. Explicit Consent Gate</span>
            </div>
            <p>
              Only when an incident reporter explicitly reviews the Report Preview and clicks the separate, un-checked consent checkbox will technical threat indicators (e.g. suspect phone numbers, phishing domains) be indexed into the investigative graph.
            </p>
          </div>

          <div style={{ padding: '14px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: '6px' }}>
              <FileCheck2 size={16} />
              <span>3. Synthetic vs Real Intel Demarcation</span>
            </div>
            <p>
              To safeguard privacy while empowering defensive training, all test clusters and algorithmic mock entities are clearly tagged and styled as <em>Synthetic</em>, preventing false public incrimination.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '20px', padding: '10px' }}
        >
          Understood & Acknowledged
        </button>
      </div>
    </div>
  );
};

export default PrivacyModal;
