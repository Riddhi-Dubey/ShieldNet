import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  ArrowRight, 
  Lock, 
  Sparkles, 
  FileWarning, 
  HelpCircle,
  Copy,
  Info
} from 'lucide-react';
import { analyseMessage, extractErrorMessage } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { LoadingState, ErrorState } from '../components/LoadingState';

const SAMPLE_SUSPICIOUS_MESSAGES = [
  "URGENT: Your SBI account has been suspended due to pending KYC update. Click http://sbi-kyc-verify-portal.in immediately to avoid permanent deactivation.",
  "Congratulations! You won ₹25,00,000 in KBC Lottery! Send your Aadhar card and registration fee of ₹1,200 to WhatsApp number +91 9876543210 to claim.",
  "Electricity bill unpaid. Your power will be disconnected tonight at 9:30 PM. Call Electricity Officer immediately at 9123456789.",
  "Hi Mom, I broke my phone and this is my new temporary number. Can you quickly send ₹15,000 via UPI to help me pay for emergency cab ride?",
];

export const MessageChecker = () => {
  const navigate = useNavigate();
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyseMessage(messageText.trim());
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUseSample = (sample) => {
    setMessageText(sample);
  };

  const handleNavigateToReport = () => {
    // Navigate to report with prefilled state
    navigate('/shield/report', {
      state: {
        description: messageText,
        category: result?.category || 'Phishing / SMS Scams',
      },
    });
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '980px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <ShieldCheck size={18} style={{ color: 'var(--primary-accent)' }} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ScamShield Citizen Defense
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
          AI Message Threat Checker
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Analyze suspicious SMS messages, WhatsApp requests, lottery notifications, or job offers before you respond.
        </p>
      </div>

      {/* Input Section */}
      <div className="cyber-card">
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>PASTE SUSPICIOUS MESSAGE TEXT</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {messageText.length} characters
              </span>
            </label>

            <textarea
              className="form-textarea"
              rows={5}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Paste SMS message, email snippet, or WhatsApp text here..."
              style={{ resize: 'vertical', fontSize: '14px' }}
            />
          </div>

          {/* Privacy Note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--accent-green)',
              backgroundColor: 'rgba(52, 211, 153, 0.08)',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(52, 211, 153, 0.2)',
            }}
          >
            <Lock size={14} />
            <span>
              <strong>Zero Storage Guarantee:</strong> Your text is processed in-memory and is never automatically submitted to the ScamTrace database.
            </span>
          </div>

          {/* Quick Sample Selector */}
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              Or try a known scam pattern sample:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SAMPLE_SUSPICIOUS_MESSAGES.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUseSample(s)}
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  Sample #{idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            {messageText && (
              <button
                type="button"
                onClick={() => { setMessageText(''); setResult(null); setError(null); }}
                className="btn btn-secondary"
                style={{ fontSize: '13px' }}
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !messageText.trim()}
              className="btn btn-primary"
              style={{ minWidth: '180px' }}
            >
              {loading ? 'Analyzing Threat...' : 'Analyze Message Risk'}
            </button>
          </div>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Analysis Request Failed"
          message={error}
          onRetry={handleAnalyze}
        />
      )}

      {/* Analysis Result */}
      {result && (
        <div className="cyber-card cyber-card-glow" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Score Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Assessed Threat Verdict
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {result.verdict || result.summary || 'Risk Evaluation Complete'}
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>THREAT SCORE</div>
                <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: result.risk_score > 70 ? 'var(--accent-critical)' : result.risk_score > 40 ? 'var(--accent-warning)' : 'var(--accent-green)' }}>
                  {result.risk_score ?? result.riskScore ?? 0}<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/100</span>
                </div>
              </div>
              <RiskBadge level={result.risk_level || result.riskLevel} score={result.risk_score ?? result.riskScore} size="lg" />
            </div>
          </div>

          {/* Warning Signals List */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} style={{ color: 'var(--accent-warning)' }} />
              Detected Warning Signals & Explanations
            </h3>

            {result.warning_signals && result.warning_signals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.warning_signals.map((sig, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: '#0D1527',
                      border: '1px solid var(--border-color)',
                      borderLeft: '4px solid var(--accent-warning)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {sig.signal || sig.title || `Signal #${idx + 1}`}
                      </span>
                      {sig.severity && (
                        <span className={`badge badge-${sig.severity.toLowerCase()}`}>
                          {sig.severity}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {sig.explanation || sig.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No explicit warning triggers flagged in this message.</p>
            )}
          </div>

          {/* Safe Next Steps */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
              Recommended Safe Next Steps
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(result.safe_next_steps || result.recommendations || [
                'Do not click any embedded links or download attachments.',
                'Never dial phone numbers provided inside the message.',
                'Verify account status directly through the bank’s official mobile app.',
                'Report and block the sender on your messaging app.',
              ]).map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    padding: '8px 12px',
                    backgroundColor: '#111827',
                    borderRadius: '6px',
                  }}
                >
                  <span style={{ color: 'var(--primary-accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>✓</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Report Option Action Bar */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#0D1527',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Help protect other citizens from this campaign
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                You can submit an incident report. You will review and consent before anything is shared.
              </div>
            </div>

            <button
              onClick={handleNavigateToReport}
              className="btn btn-primary"
              style={{ fontSize: '13px' }}
            >
              <FileWarning size={16} />
              Forward to Report Form
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageChecker;
