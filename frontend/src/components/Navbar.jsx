import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Network, 
  PhoneCall, 
  Lock, 
  Menu, 
  X, 
  Activity, 
  ChevronRight,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { getHealth } from '../services/api';

export const Navbar = ({ onOpenEmergency, onOpenPrivacy }) => {
  const location = useLocation();
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'offline' | 'checking'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let timer = null;

    const checkStatus = async () => {
      try {
        await getHealth();
        if (isMounted) {
          setBackendStatus('connected');
          // Once connected, check less frequently (every 30s)
          timer = setTimeout(checkStatus, 30000);
        }
      } catch (err) {
        if (isMounted) {
          setBackendStatus((prev) => (prev === 'connected' ? 'offline' : 'checking'));
          // When warming up or offline, poll every 4s to catch server as soon as it boots
          timer = setTimeout(checkStatus, 4000);
        }
      }
    };

    checkStatus();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [retryAttempt]);

  const handleManualRetry = () => {
    setBackendStatus('checking');
    setRetryAttempt((prev) => prev + 1);
  };

  const isScamShield = location.pathname.startsWith('/shield');
  const isScamTrace = location.pathname.startsWith('/trace');

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: '#0B1020',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand & Module Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0B1020',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
            }}
          >
            <Shield size={22} strokeWidth={2.5} color="#0B1020" />
          </div>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
              ScamShield <span style={{ color: 'var(--primary-accent)', fontWeight: 400 }}>|</span> ScamTrace
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Cyber Intelligence Platform
            </div>
          </div>
        </Link>

        {/* Top Module Segmented Switch */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#111827',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
          }}
          className="desktop-only"
        >
          <Link
            to="/shield/message"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              color: isScamShield ? '#0B1020' : 'var(--text-secondary)',
              backgroundColor: isScamShield ? 'var(--primary-accent)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <Shield size={14} />
            ScamShield (Protection)
          </Link>

          <Link
            to="/trace/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              color: isScamTrace ? '#ffffff' : 'var(--text-secondary)',
              backgroundColor: isScamTrace ? '#7C3AED' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <Network size={14} />
            ScamTrace (Investigation)
          </Link>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Backend Status indicator */}
        <div
          onClick={backendStatus !== 'connected' ? handleManualRetry : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            padding: '5px 12px',
            borderRadius: '20px',
            backgroundColor: '#111827',
            border: backendStatus === 'connected' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(251, 146, 60, 0.4)',
            cursor: backendStatus !== 'connected' ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
          title={
            backendStatus === 'connected'
              ? 'FastAPI Cloud Backend Online (Health Verified)'
              : 'Cloud Backend Warming Up from Standby (Render free-tier cold-start takes ~25s on first visit). Click to retry ping.'
          }
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                backendStatus === 'connected'
                  ? 'var(--accent-green)'
                  : 'var(--accent-warning)',
              boxShadow:
                backendStatus === 'connected'
                  ? '0 0 8px var(--accent-green)'
                  : '0 0 6px rgba(251, 146, 60, 0.6)',
              animation: backendStatus !== 'connected' ? 'pulse 1.5s infinite' : 'none',
            }}
          />
          <span style={{ color: backendStatus === 'connected' ? 'var(--text-primary)' : 'var(--accent-warning)', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            {backendStatus === 'connected' ? 'API: ONLINE' : 'API: WARMING UP...'}
          </span>
        </div>

        {/* Emergency Help Button */}
        <button
          onClick={onOpenEmergency}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(248, 113, 113, 0.12)',
            color: 'var(--accent-critical)',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <PhoneCall size={14} />
          Emergency 1930
        </button>

        {/* Privacy & Consent Button */}
        <button
          onClick={onOpenPrivacy}
          title="Privacy and Consent Architecture"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: '8px',
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <Lock size={13} />
          Privacy
        </button>
      </div>
    </header>
  );
};

export default Navbar;
