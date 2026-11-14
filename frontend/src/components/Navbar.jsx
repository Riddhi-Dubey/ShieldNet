import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Network, 
  PhoneCall, 
  Lock, 
  Menu, 
  X, 
  Search,
  MessageSquare,
  Globe,
  Briefcase
} from 'lucide-react';

export const Navbar = ({ onOpenEmergency, onOpenPrivacy }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Overview', path: '/' },
    { label: 'Message Scanner', path: '/shield/message', icon: MessageSquare },
    { label: 'URL Scanner', path: '/shield/url', icon: Globe },
    { label: 'Network Mapper', path: '/trace/graph', icon: Network },
    { label: 'Universal Search', path: '/trace/search', icon: Search },
    { label: 'Investigation Cases', path: '/trace/cases', icon: Briefcase },
  ];

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '11px', textDecoration: 'none' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(57, 127, 120, 0.25)',
            }}
          >
            <Shield size={22} strokeWidth={2.4} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-heading)', lineHeight: 1.1 }}>
              ShieldNet
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Cybersecurity Intelligence Platform
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          className="desktop-only"
        >
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  textDecoration: 'none',
                  color: isActive ? 'var(--primary-accent)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--primary-accent-light)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                {Icon && <Icon size={14} style={{ color: isActive ? 'var(--primary-accent)' : 'var(--text-muted)' }} />}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Emergency Help Button */}
        <button
          onClick={onOpenEmergency}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--accent-critical-bg)',
            color: 'var(--accent-critical)',
            border: '1px solid rgba(185, 28, 28, 0.22)',
            borderRadius: 'var(--radius-md)',
            padding: '7px 13px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
          title="Indian National Cyber Crime Helpline (Toll-Free 24x7)"
        >
          <PhoneCall size={14} />
          Emergency 1930
        </button>

        {/* Privacy & Limits Button */}
        <button
          onClick={onOpenPrivacy}
          title="ShieldNet Privacy Architecture & Verification"
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-md)',
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-xs)',
            transition: 'all 0.18s ease',
          }}
        >
          <Lock size={13} style={{ color: 'var(--primary-accent)' }} />
          Privacy & Proof
        </button>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-only"
          style={{
            background: 'none',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '68px',
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--border-color)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: location.pathname === link.path ? 700 : 500,
                color: location.pathname === link.path ? 'var(--primary-accent)' : 'var(--text-primary)',
                backgroundColor: location.pathname === link.path ? 'var(--primary-accent-light)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
