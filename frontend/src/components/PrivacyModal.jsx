import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Server, FileCheck2, Database, Code, CheckCircle2, AlertOctagon } from 'lucide-react';

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
          maxWidth: '720px',
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
              Privacy, Verification & Consent Architecture
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Detailed technical transparency on zero-storage claims, in-memory processing, and consent boundaries.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {/* Section 1: In-Memory / Zero Storage */}
          <div style={{ padding: '16px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)', fontWeight: 700, marginBottom: '6px' }}>
              <EyeOff size={16} />
              <span>1. Zero-Storage Scanning: How It Works & How to Verify</span>
            </div>
            <p style={{ marginBottom: '8px' }}>
              When you paste messages into the Message Checker or inspect domains in the URL Checker, your text is analyzed strictly in volatile application memory (RAM).
            </p>
            <ul style={{ paddingLeft: '20px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Zero Database Writes:</strong> The scanning endpoint (<code style={{ color: 'var(--primary-accent)' }}>POST /api/analyse/message</code>) does not accept or open any database session. 0 bytes are persisted to SQLite or disk logs.</li>
              <li><strong>Zero Third-Party AI Leakage:</strong> Analysis runs purely on deterministic local heuristic pattern matchers. No user text is ever routed to external LLM APIs (OpenAI, Anthropic, Google).</li>
              <li><strong>Verification in Source Code:</strong> You can inspect <code style={{ color: 'var(--primary-accent)' }}>backend/app/api/scamshield.py</code> to verify that the analysis function operates with no database commit calls.</li>
            </ul>
          </div>

          {/* Section 2: Exact Data Scope When Consent Is Granted */}
          <div style={{ padding: '16px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-accent)', fontWeight: 700, marginBottom: '6px' }}>
              <Database size={16} />
              <span>2. Incident Reporting: What Is Sent vs What Is Never Sent</span>
            </div>
            <p style={{ marginBottom: '8px' }}>
              Only when you navigate to <em>Report-a-Scam</em> and explicitly toggle the consent checkbox is technical intelligence shared with ScamTrace:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px', marginTop: '8px' }}>
              <div style={{ padding: '10px', backgroundColor: '#0D1527', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontWeight: 700, fontSize: '11px', marginBottom: '4px' }}>
                  <CheckCircle2 size={14} /> WHAT IS TRANSFERRED
                </div>
                <ul style={{ paddingLeft: '16px', fontSize: '11px', margin: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <li>Target phone, phishing URL, or UPI VPA</li>
                  <li>Category tag (e.g. Phishing, Job Task)</li>
                  <li>Timestamp of incident</li>
                  <li>Sanitized description (OTPs/passwords stripped)</li>
                </ul>
              </div>

              <div style={{ padding: '10px', backgroundColor: '#0D1527', borderRadius: '6px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-critical)', fontWeight: 700, fontSize: '11px', marginBottom: '4px' }}>
                  <AlertOctagon size={14} /> WHAT IS PERMANENTLY STRIPPED
                </div>
                <ul style={{ paddingLeft: '16px', fontSize: '11px', margin: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <li>Your IP address and device fingerprint</li>
                  <li>All 4-6 digit verification OTPs & PINs</li>
                  <li>Net banking passwords & card numbers</li>
                  <li>Victim identity or account balance</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Server-Side Consent Enforcement */}
          <div style={{ padding: '16px', backgroundColor: '#111827', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: '6px' }}>
              <Server size={16} />
              <span>3. Server-Side Consent Gating</span>
            </div>
            <p>
              Consent is enforced on the backend, not solely by a browser checkbox. If a submission arrives without an active server-side consent record, the threat indicators are <strong>permanently barred from the public ScamTrace graph</strong> and logged solely as an unshared citizen incident for user records.
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
