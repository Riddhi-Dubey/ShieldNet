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
  ExternalLink,
  LifeBuoy
} from 'lucide-react';

export const Sidebar = ({ onOpenEmergency, onOpenPrivacy }) => {
  const shieldNavs = [
    { to: '/shield/message', label: 'Message Checker', icon: ShieldCheck, badge: 'AI' },
    { to: '/shield/url', label: 'URL Checker', icon: Globe },
    { to: '/shield/chat', label: 'AI Safety Assistant', icon: Bot, badge: 'Live' },
    { to: '/shield/quiz', label: 'Awareness Quiz', icon: HelpCircle },
    { to: '/shield/report', label: 'Report Incident', icon: FileWarning, highlight: true },
  ];

  const traceNavs = [
    { to: '/trace/dashboard', label: 'Threat Overview', icon: LayoutDashboard },
    { to: '/trace/search', label: 'Universal Search', icon: Search },
    { to: '/trace/network', label: 'Network Explorer', icon: Share2, badge: 'Graph' },
    { to: '/trace/analytics', label: 'Threat Analytics', icon: BarChart3 },
    { to: '/trace/datasets', label: 'Dataset Sources', icon: Database },
  ];

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: '13px',
    fontWeight: isActive ? 700 : 500,
    textDecoration: 'none',
    color: isActive ? '#F8FAFC' : 'var(--text-secondary)',
    backgroundColor: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
    border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent',
    transition: 'all 0.15s ease',
  });

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#0B1020',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 16px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* ScamShield Navigation Group */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--primary-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 8px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>ScamShield Protection</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {shieldNavs.map((item) => {
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
                        backgroundColor: '#172033',
                        color: 'var(--primary-accent)',
                        padding: '2px 6px',
                        borderRadius: '4px',
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

        {/* ScamTrace Navigation Group */}
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--accent-purple)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0 8px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>ScamTrace Intelligence</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {traceNavs.map((item) => {
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
                        backgroundColor: '#172033',
                        color: 'var(--accent-purple)',
                        padding: '2px 6px',
                        borderRadius: '4px',
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
          backgroundColor: '#111827',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-critical)', fontSize: '12px', fontWeight: 700 }}>
          <LifeBuoy size={16} />
          <span>Fell for a scam?</span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          Immediate action in the first 2 hours can freeze fraudulent transfers.
        </p>
        <button
          onClick={onOpenEmergency}
          className="btn btn-danger"
          style={{ width: '100%', padding: '6px 10px', fontSize: '12px' }}
        >
          View Emergency Steps
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
