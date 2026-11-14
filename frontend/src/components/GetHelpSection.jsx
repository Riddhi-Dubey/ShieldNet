import React, { useState } from 'react';
import { 
  PhoneCall, 
  Globe, 
  ShieldAlert, 
  AlertOctagon, 
  MessageSquare, 
  Building2, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { SUPPORTED_COUNTRIES, getHelpContacts } from '../utils/helpContacts';

export const GetHelpSection = ({ initialCountry = 'IN', onCountryChange }) => {
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);

  const handleCountrySelect = (e) => {
    const code = e.target.value;
    setSelectedCountry(code);
    if (onCountryChange) {
      onCountryChange(code);
    }
  };

  const contacts = getHelpContacts(selectedCountry);

  return (
    <div 
      className="cyber-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Header and Country Selector */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhoneCall size={18} style={{ color: 'var(--primary-accent)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', margin: 0 }}>
              Official Support & Reporting Contacts
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Verified government helplines, official cybercrime portals, and carrier hotlines for your region.
          </p>
        </div>

        {/* Region Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label 
            htmlFor="help-country-select" 
            style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}
          >
            Region:
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="help-country-select"
              value={selectedCountry}
              onChange={handleCountrySelect}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 30px 6px 12px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {SUPPORTED_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown 
              size={14} 
              style={{ 
                position: 'absolute', 
                right: '10px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                pointerEvents: 'none',
                color: 'var(--text-muted)'
              }} 
            />
          </div>
        </div>
      </div>

      {/* Grid of 3 Distinct Contact Categories */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
          gap: '14px' 
        }}
      >
        {/* Category 1: Emergency Services */}
        <div 
          style={{ 
            backgroundColor: 'rgba(239, 68, 68, 0.04)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            borderRadius: '8px', 
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertOctagon size={16} style={{ color: 'var(--accent-critical)' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-critical)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Emergency Services
            </span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            For acute physical safety threats, extortion intimidation, or life emergencies.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
            {contacts.emergency.map((em, idx) => (
              <div 
                key={idx}
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid rgba(239, 68, 68, 0.25)', 
                  borderRadius: '6px', 
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {em.name}
                  </span>
                  <span 
                    style={{ 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      color: 'var(--accent-critical)', 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      padding: '2px 6px', 
                      borderRadius: '4px' 
                    }}
                  >
                    {em.badge}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  {em.description}
                </div>
                {em.type === 'phone' ? (
                  <a
                    href={`tel:${em.contact}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: 'var(--accent-critical)',
                      textDecoration: 'none',
                      marginTop: '4px',
                    }}
                  >
                    <PhoneCall size={14} />
                    Call {em.contact}
                  </a>
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {em.contact}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Category 2: Fraud & Cybercrime Reporting */}
        <div 
          style={{ 
            backgroundColor: 'rgba(57, 127, 120, 0.04)', 
            border: '1px solid rgba(57, 127, 120, 0.2)', 
            borderRadius: '8px', 
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={16} style={{ color: 'var(--primary-accent)' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              2. Fraud Reporting
            </span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            Official government portals to lodge formal complaints and recover stolen funds.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
            {contacts.fraudReporting.map((fr, idx) => (
              <div 
                key={idx}
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px', 
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {fr.name}
                  </span>
                  <span 
                    style={{ 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      color: 'var(--primary-accent)', 
                      backgroundColor: 'rgba(57, 127, 120, 0.1)', 
                      padding: '2px 6px', 
                      borderRadius: '4px' 
                    }}
                  >
                    {fr.badge}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  {fr.description}
                </div>
                {fr.type === 'phone' ? (
                  <a
                    href={`tel:${fr.contact}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: 'var(--primary-accent)',
                      textDecoration: 'none',
                      marginTop: '4px',
                    }}
                  >
                    <PhoneCall size={14} />
                    Call {fr.contact}
                  </a>
                ) : fr.type === 'website' ? (
                  <a
                    href={fr.contact}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--primary-accent)',
                      textDecoration: 'none',
                      marginTop: '4px',
                    }}
                  >
                    <Globe size={13} />
                    {fr.contact.replace('https://', '')}
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {fr.contact}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Category 3: Platform & Carrier Support */}
        <div 
          style={{ 
            backgroundColor: 'rgba(245, 158, 11, 0.04)', 
            border: '1px solid rgba(245, 158, 11, 0.2)', 
            borderRadius: '8px', 
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={16} style={{ color: 'var(--accent-warning)' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-warning)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              3. Platform Support
            </span>
          </div>
          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            Actions to freeze accounts, block cards, and blacklist spam with network carriers.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
            {contacts.platformSupport.map((ps, idx) => (
              <div 
                key={idx}
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '6px', 
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {ps.name}
                  </span>
                  <span 
                    style={{ 
                      fontSize: '10px', 
                      fontWeight: 700, 
                      color: 'var(--text-secondary)', 
                      backgroundColor: 'var(--bg-secondary)', 
                      padding: '2px 6px', 
                      borderRadius: '4px' 
                    }}
                  >
                    {ps.badge}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  {ps.description}
                </div>
                {ps.type === 'sms' ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--accent-warning)', marginTop: '4px' }}>
                    <MessageSquare size={13} />
                    SMS to: {ps.contact}
                  </div>
                ) : (
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                    Action: {ps.contact}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetHelpSection;
