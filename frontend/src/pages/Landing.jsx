import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Network, 
  MessageSquareWarning, 
  Globe, 
  Bot, 
  Search, 
  Share2, 
  Lock, 
  ArrowRight, 
  FileWarning, 
  Sparkles,
  Layers,
  Database,
  CheckCircle2,
  Cpu,
  BarChart2,
  FileText
} from 'lucide-react';

export const Landing = () => {
  return (
    <div style={{ paddingBottom: '70px', backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '76px 24px 60px',
          textAlign: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #F0F5F3 0%, #F7F9F8 100%)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Top Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--primary-accent-light)',
              border: '1px solid rgba(57, 127, 120, 0.28)',
              borderRadius: '9999px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--primary-accent)',
              marginBottom: '22px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <Sparkles size={14} style={{ color: 'var(--primary-accent)' }} />
            <span>Unified Cybersecurity Defense & Threat Network Intelligence</span>
          </div>

          {/* High-Contrast Dark Heading */}
          <h1
            style={{
              fontSize: 'clamp(32px, 5.2vw, 52px)',
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: '-0.025em',
              marginBottom: '20px',
              color: 'var(--text-heading)',
            }}
          >
            Proactive Scam Defense.<br />
            <span style={{ color: 'var(--primary-accent)' }}>Intelligent Threat Network Intelligence.</span>
          </h1>

          <p
            style={{
              fontSize: '17px',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              maxWidth: '680px',
              margin: '0 auto 36px',
            }}
          >
            ShieldNet empowers citizens with machine learning scam detection while arming analysts with multi-hop graph intelligence to expose syndicates and illicit fund pathways.
          </p>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/shield/message"
              className="btn btn-primary"
              style={{ padding: '13px 26px', fontSize: '14.5px', borderRadius: 'var(--radius-md)' }}
            >
              <ShieldCheck size={18} />
              Scan Message Threat
            </Link>

            <Link
              to="/trace/graph"
              className="btn btn-secondary"
              style={{ padding: '13px 26px', fontSize: '14.5px', borderRadius: 'var(--radius-md)' }}
            >
              <Network size={18} style={{ color: 'var(--primary-accent)' }} />
              Open Network Mapper
            </Link>
          </div>
        </div>
      </section>

      {/* Module Overview: Two Core Pillars */}
      <section className="page-wrapper" style={{ marginTop: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px' }}>
            Integrated Security Pillars
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '620px', margin: '0 auto' }}>
            A unified cybersecurity ecosystem connecting instant front-line citizen protection with deep forensic graph intelligence.
          </p>
        </div>

        <div className="grid-2">
          {/* Pillar 1: Citizen Protection */}
          <div
            className="cyber-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '24px',
              borderTop: '4px solid var(--primary-accent)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--primary-accent-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-accent)',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-heading)' }}>
                    Citizen Scam Protection
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--primary-accent)', fontWeight: 600 }}>
                    Front-Line Early Warning System
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '22px' }}>
                Instant risk evaluation for suspicious SMS texts, WhatsApp messages, job offers, and phishing URLs using machine learning and behavioral compound risk scoring.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--primary-accent)', flexShrink: 0 }} />
                  <span><strong>AI Message Scanner:</strong> TF-IDF NLP model with compound urgency & coercion analysis.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--primary-accent)', flexShrink: 0 }} />
                  <span><strong>Phishing URL Checker:</strong> 16 lexical features, entropy, and brand lookalike detection.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--primary-accent)', flexShrink: 0 }} />
                  <span><strong>Cyber Advisor:</strong> Interactive chatbot providing verifiable safety guidance & helpline 1930.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--primary-accent)', flexShrink: 0 }} />
                  <span><strong>Defense Quiz:</strong> Interactive scenarios teaching users to spot modern social engineering.</span>
                </div>
              </div>
            </div>

            <Link to="/shield/message" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Launch Protection Tools</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Pillar 2: Intelligent Scam Network Mapper */}
          <div
            className="cyber-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '24px',
              borderTop: '4px solid var(--secondary-accent)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--secondary-accent-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--secondary-accent)',
                    flexShrink: 0,
                  }}
                >
                  <Network size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-heading)' }}>
                    Scam Network Intelligence
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--secondary-accent)', fontWeight: 600 }}>
                    Investigator & Forensic Graph Engine
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '22px' }}>
                Multi-hop graph analytics and network clustering mapping illicit fund transfers, mule accounts, phone rings, and criminal infrastructure.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--secondary-accent)', flexShrink: 0 }} />
                  <span><strong>Universal Search:</strong> Query Phone, URL, Bank Account, or Crypto Wallet identifiers.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--secondary-accent)', flexShrink: 0 }} />
                  <span><strong>Network Explorer:</strong> Cytoscape.js interactive graph with multi-hop cluster traversal.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--secondary-accent)', flexShrink: 0 }} />
                  <span><strong>Threat Timeline & Cases:</strong> Chronological progression analysis and investigation cases.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--secondary-accent)', flexShrink: 0 }} />
                  <span><strong>Dossier Export:</strong> Structured investigation summaries for rapid takedown action.</span>
                </div>
              </div>
            </div>

            <Link to="/trace/graph" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Open Network Mapper</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works / Workflow */}
      <section className="page-wrapper" style={{ marginTop: '48px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-heading)' }}>
            How ShieldNet Works
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
            A four-stage lifecycle from early detection to syndicated threat mapping
          </p>
        </div>

        <div className="grid-4">
          <div className="cyber-card" style={{ padding: '22px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--primary-accent)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>STAGE 01</div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>In-Memory Scan</h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Citizen scans messages or URLs. Detection models score patterns statelessly without retaining personal text.
            </p>
          </div>

          <div className="cyber-card" style={{ padding: '22px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--primary-accent)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>STAGE 02</div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>Consent Gate</h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Preview shows exactly what threat indicators would be logged. Data transfers only when consent is given.
            </p>
          </div>

          <div className="cyber-card" style={{ padding: '22px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--secondary-accent)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>STAGE 03</div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>Network Ingestion</h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Sanitized threat indicators are matched against known threat feeds to expose connected bank accounts and mule rings.
            </p>
          </div>

          <div className="cyber-card" style={{ padding: '22px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>STAGE 04</div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>Intelligence Dossier</h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Investigators generate structured threat dossiers with full provenance and network evidence for law enforcement action.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee Banner */}
      <section className="page-wrapper" style={{ marginTop: '36px' }}>
        <div
          style={{
            padding: '26px 32px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--primary-accent-light)',
            border: '1px solid rgba(57, 127, 120, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '720px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)',
                boxShadow: 'var(--shadow-xs)',
                flexShrink: 0,
              }}
            >
              <Lock size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '3px' }}>
                Zero-Retention In-Memory Privacy Guarantee
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your private communications are analyzed statelessly in volatile memory. No OTPs, passwords, or personal messages are ever stored or transmitted without explicit consent.
              </p>
            </div>
          </div>

          <Link to="/shield/message" className="btn btn-primary" style={{ padding: '11px 22px', fontSize: '13.5px' }}>
            Start Safe Scan
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
