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
  CheckCircle2
} from 'lucide-react';

export const Landing = () => {
  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '80px 24px 60px',
          textAlign: 'center',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(56, 189, 248, 0.15), rgba(11, 16, 32, 0))',
        }}
      >
        <div style={{ maxWidth: '880px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Top Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '9999px',
              padding: '6px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--primary-accent)',
              marginBottom: '24px',
            }}
          >
            <Sparkles size={14} />
            <span>Dual-Engine Cybersecurity & Threat Intelligence Ecosystem</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 54px)',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '20px',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #94A3B8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Proactive Scam Defense.<br />
            Deep Network Intelligence.
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '680px',
              margin: '0 auto 36px',
            }}
          >
            Empowering citizens with AI-powered scam detection while arming analysts with graph-powered entity correlation and syndication mapping.
          </p>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/shield/message"
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '15px' }}
            >
              <ShieldCheck size={18} />
              Launch ScamShield (User Protection)
            </Link>

            <Link
              to="/trace/dashboard"
              className="btn btn-secondary"
              style={{ padding: '14px 28px', fontSize: '15px' }}
            >
              <Network size={18} />
              Explore ScamTrace (Investigator)
            </Link>
          </div>
        </div>
      </section>

      {/* Module Overview: Two Pillars */}
      <section className="page-wrapper" style={{ marginTop: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Integrated Dual-Tier Security Architecture
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Separating citizen defense from investigative intelligence with strict cryptographic consent barriers.
          </p>
        </div>

        <div className="grid-2">
          {/* Pillar 1: ScamShield */}
          <div
            className="cyber-card"
            style={{
              borderColor: 'rgba(56, 189, 248, 0.3)',
              background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.04) 0%, rgba(23, 32, 51, 1) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '24px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-accent)',
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>ScamShield</h3>
                  <span style={{ fontSize: '12px', color: 'var(--primary-accent)', fontWeight: 600 }}>Citizen & User Protection</span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Instant risk detection for suspicious SMS messages, WhatsApp lures, lottery frauds, and malicious domains before harm occurs.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                  <span><strong>AI Message Checker:</strong> Analyzes urgency cues & extortion markers.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                  <span><strong>Heuristic URL Scanner:</strong> Evaluates lookalike domains and phishing risk.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                  <span><strong>Safety Assistant:</strong> Live conversational guidance (never asks for OTPs).</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                  <span><strong>Awareness Quiz:</strong> Gamified simulations of modern social engineering.</span>
                </div>
              </div>
            </div>

            <Link to="/shield/message" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Open ScamShield Tools</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Pillar 2: ScamTrace */}
          <div
            className="cyber-card"
            style={{
              borderColor: 'rgba(167, 139, 250, 0.3)',
              background: 'linear-gradient(180deg, rgba(167, 139, 250, 0.04) 0%, rgba(23, 32, 51, 1) 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '24px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(167, 139, 250, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-purple)',
                  }}
                >
                  <Network size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>ScamTrace</h3>
                  <span style={{ fontSize: '12px', color: 'var(--accent-purple)', fontWeight: 600 }}>Investigator & Analyst Engine</span>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Multi-hop graph analytics and correlation engine mapping illicit fund trails, mule phone rings, and syndication infrastructure.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-purple)' }} />
                  <span><strong>Universal Entity Search:</strong> Fast lookup across Phone, UPI, Bank, and Crypto.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-purple)' }} />
                  <span><strong>Network Explorer:</strong> Cytoscape.js interactive cluster visualizer.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-purple)' }} />
                  <span><strong>Threat Analytics:</strong> Real-time risk distribution and sector trends.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-purple)' }} />
                  <span><strong>Provenance & Reports:</strong> Verified intelligence dossiers with exportable summaries.</span>
                </div>
              </div>
            </div>

            <Link to="/trace/dashboard" className="btn btn-purple" style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>Enter Investigation Console</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works / Workflow */}
      <section className="page-wrapper" style={{ marginTop: '50px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>How the Platform Works</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>A secure four-stage cycle from early detection to syndicated threat takedown</p>
        </div>

        <div className="grid-4">
          <div className="cyber-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary-accent)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>STAGE 01</div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>In-Memory Scan</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Citizen scans text or URLs. Detection models score patterns locally without retaining private chat text.
            </p>
          </div>

          <div className="cyber-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary-accent)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>STAGE 02</div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Consent Gate</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Incident report preview explicitly details shared indicators. Data transfers only if consent is opted in.
            </p>
          </div>

          <div className="cyber-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>STAGE 03</div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Graph Ingestion</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Threat indicators are matched with financial intelligence feeds, revealing interconnected bank accounts and mule rings.
            </p>
          </div>

          <div className="cyber-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>STAGE 04</div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Takedown Dossier</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Analysts export structured investigation dossiers with full provenance for rapid law enforcement action.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee Banner */}
      <section className="page-wrapper" style={{ marginTop: '40px' }}>
        <div
          style={{
            padding: '24px 32px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#0D1527',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '700px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'rgba(52, 211, 153, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-green)',
                flexShrink: 0,
              }}
            >
              <Lock size={22} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Zero-Retention Privacy Guarantee
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Your private communications are analyzed statelessly in volatile memory. No OTPs, passwords, or personal chat history are stored or transferred.
              </p>
            </div>
          </div>

          <Link to="/shield/message" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
            Start Safe Scan
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
