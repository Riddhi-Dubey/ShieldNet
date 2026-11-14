import React from 'react';
import { X, PhoneCall, AlertOctagon, ShieldAlert, CreditCard, ExternalLink, CheckCircle2 } from 'lucide-react';

export const EmergencyModal = ({ isOpen, onClose }) => {
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
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(185, 28, 28, 0.3)',
          boxShadow: 'var(--shadow-lg)',
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

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(248, 113, 113, 0.2)',
              color: 'var(--accent-critical)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Emergency Cyber Incident Response
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--accent-critical)', fontWeight: 600 }}>
              The Golden Hour: Immediate intervention stops monetary laundering
            </p>
          </div>
        </div>

        {/* Big Helpline Box */}
        <div
          style={{
            backgroundColor: '#1E1B4B',
            border: '1px solid #6366F1',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: '#C7D2FE', textTransform: 'uppercase', fontWeight: 700 }}>
              National Cyber Crime Reporting Helpline
            </div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              1930
            </div>
            <div style={{ fontSize: '11px', color: '#A5B4FC' }}>
              Toll-free citizen cyber fraud immediate freeze line
            </div>
          </div>

          <a
            href="tel:1930"
            className="btn btn-purple"
            style={{ padding: '10px 16px', textDecoration: 'none' }}
          >
            <PhoneCall size={16} /> Call 1930 Now
          </a>
        </div>

        {/* Immediate 4 Action Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Immediate Triage Checklist
          </h4>

          <div style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--primary-accent)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>01</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>Freeze Bank Accounts & UPI PINs</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Open your bank app or dial customer care to lock netbanking, block debit/credit cards, and reset UPI PINs.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--primary-accent)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>02</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>Preserve All Digital Evidence</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Take screenshots of chat threads, UPI transaction reference numbers (UTR), SMS receipts, and suspect phone numbers.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ color: 'var(--primary-accent)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>03</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>File an Official NCRP FIR</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Visit cybercrime.gov.in to lodge a formal complaint, which coordinates across participating beneficiary banks.
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '10px' }}
        >
          Close Incident Helper
        </button>
      </div>
    </div>
  );
};

export default EmergencyModal;
