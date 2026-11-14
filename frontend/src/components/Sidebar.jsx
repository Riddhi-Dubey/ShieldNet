import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldCheck, 
  Globe, 
  Bot, 
  HelpCircle, 
  FileWarning, 
  LayoutDashboard, 
  Search, 
  Share2, 
  BarChart3, 
  Database,
  Briefcase,
  LifeBuoy
} from 'lucide-react';

export const Sidebar = ({ onOpenEmergency, onOpenPrivacy }) => {
  const citizenNavs = [
    { to: '/shield/message', label: 'Message Scanner', icon: ShieldCheck, badge: 'AI' },
    { to: '/shield/url', label: 'URL Phishing Scanner', icon: Globe },
    { to: '/shield/chat', label: 'Cyber Advisor', icon: Bot, badge: 'AI' },
    { to: '/shield/quiz', label: 'Security Quiz', icon: HelpCircle },
    { to: '/shield/report', label: 'Report Incident', icon: FileWarning, highlight: true },
  ];

  const intelNavs = [
    { to: '/trace/dashboard', label: 'Threat Overview', icon: LayoutDashboard },
    { to: '/trace/search', label: 'Universal Search', icon: Search },
    { to: '/trace/cases', label: 'Case Workspace', icon: Briefcase, badge: 'Cases' },
    { to: '/trace/network', label: 'Network Mapper', icon: Share2, badge: 'Graph' },
    { to: '/trace/analytics', label: 'Threat Analytics', icon: BarChart3 },
    { to: '/trace/datasets', label: 'Data Sources', icon: Database },
  ];

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '9px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: isActive ? 700 : 500,
    textDecoration: 'none',
    color: isActive ? 'var(--primary-accent)' : 'var(--text-secondary)',
    backgroundColor: isActive ? 'var(--primary-accent-light)' : 'transparent',
    border: isActive ? '1px solid rgba(57, 127, 120, 0.25)' : '1px solid transparent',
    transition: 'all 0.15s ease',
  });

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Citizen Protection Group */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--primary-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              padding: '0 8px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Citizen Protection</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {citizenNavs.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} style={linkStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--primary-accent)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Intelligence & Network Mapping Group */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--secondary-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              padding: '0 8px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Network Intelligence</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {intelNavs.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} style={linkStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--secondary-accent)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Emergency Help Box */}
      <div
        style={{
          padding: '14px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--accent-critical-bg)',
          border: '1px solid rgba(185, 28, 28, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-critical)', fontSize: '12px', fontWeight: 700 }}>
          <LifeBuoy size={16} />
          <span>Fell for a scam?</span>
        </div>
        <p style={{ fontSize: '11.5px', color: '#7F1D1D', lineHeight: 1.45 }}>
          Golden hour action in the first 2 hours can freeze fraudulent transfers.
        </p>
        <button
          onClick={onOpenEmergency}
          className="btn btn-danger"
          style={{ width: '100%', padding: '6px 10px', fontSize: '12px', marginTop: '2px' }}
        >
          View Emergency Steps
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
