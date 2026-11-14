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
  Info,
  Cpu,
  Download
} from 'lucide-react';
import { analyseMessage, extractErrorMessage, downloadAnalysisReport } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { LoadingState, ErrorState } from '../components/LoadingState';
import PrivacyModal from '../components/PrivacyModal';

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
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [consentForLlm, setConsentForLlm] = useState(false);

  const handleTextChange = (e) => {
    setMessageText(e.target.value);
    if (result) setResult(null); // Clear stale results on input change
    if (error) setError(null);
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyseMessage(messageText.trim(), consentForLlm);
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUseSample = (sample) => {
    setMessageText(sample);
    setResult(null); // Clear stale results when sample is chosen
    setError(null);
  };

  const handleDownloadReport = () => {
    if (!result?.report_text) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnalysisReport(result.report_text, `shieldnet_message_assessment_${dateStr}.txt`);
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
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            ShieldNet Citizen Defense
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)' }}>
          AI Message Threat Scanner
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
              <span style={{ fontSize: '11px', color: messageText.length > 2800 ? 'var(--accent-critical)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {messageText.length} / 3000 characters
              </span>
            </label>

            <textarea
              className="form-textarea"
              rows={5}
              maxLength={3000}
              value={messageText}
              onChange={handleTextChange}
              placeholder="Paste SMS message, email snippet, or WhatsApp text here..."
              style={{ resize: 'vertical', fontSize: '14px' }}
            />
          </div>

          {/* AI Explainer Consent Opt-in */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              id="ai-explainer-consent"
              checked={consentForLlm}
              onChange={(e) => setConsentForLlm(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--primary-accent)' }}
            />
            <label htmlFor="ai-explainer-consent" style={{ cursor: 'pointer', userSelect: 'none' }}>
              Generate plain-language AI explanation (Sends only extracted non-sensitive threat indicators; never raw message text)
            </label>
          </div>

          {/* Privacy Note & Zero-Storage Limits */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
              fontSize: '12px',
              backgroundColor: 'rgba(52, 211, 153, 0.05)',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(52, 211, 153, 0.25)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1, minWidth: '240px' }}>
              <Lock size={16} style={{ color: 'var(--accent-green)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--accent-green)', marginBottom: '2px' }}>
                  Zero-Storage & Stateless In-Memory Scanning Guarantee
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '11.5px', lineHeight: '1.45' }}>
                  Your pasted text is parsed strictly in volatile RAM and immediately discarded. 
                  Zero database writes, zero disk logging, and no external AI services receive your text.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPrivacyModalOpen(true)}
              style={{
                background: 'none',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                color: 'var(--accent-green)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: 600,
                alignSelf: 'center',
              }}
            >
              How to Verify Claims & Limits →
            </button>
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
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    borderRadius: '20px',
                    padding: '5px 13px',
                    fontSize: '11.5px',
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
              {result.ml_probability !== undefined && result.ml_probability !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span
                    className="badge badge-neutral"
                    style={{ fontSize: '11px', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Cpu size={12} />
                    {result.model_type || 'TF-IDF + LogReg'} {result.model_version ? `(${result.model_version})` : ''} • {result.ml_probability}% Scam Prob
                  </span>
                  {result.ml_prediction && (
                    <span className={`badge ${result.ml_prediction === 'SCAM_OR_FRAUD' ? 'badge-critical' : 'badge-neutral'}`} style={{ fontSize: '11px' }}>
                      {result.ml_prediction}
                    </span>
                  )}
                </div>
              )}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Assessed Threat Verdict
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {result.verdict || result.summary || 'Risk Evaluation Complete'}
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>THREAT SCORE</div>
                <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: result.risk_score > 70 ? 'var(--accent-critical)' : result.risk_score > 40 ? 'var(--accent-warning)' : 'var(--accent-green)' }}>
                  {result.risk_score ?? result.riskScore ?? 0}<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/100</span>
                </div>
              </div>
              <RiskBadge level={result.risk_level || result.riskLevel} score={result.risk_score ?? result.riskScore} size="lg" />

              {result.report_text && (
                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '7px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  title="Download plain-text assessment dossier"
                >
                  <Download size={14} />
                  Download Report (.txt)
                </button>
              )}
            </div>
          </div>

          {/* Assessment Scope Notice Banner */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              lineHeight: 1.45,
            }}
          >
            <Info size={16} style={{ color: 'var(--primary-accent)', flexShrink: 0 }} />
            <span>
              <strong>Assessment Notice: </strong>
              {result.assessment_notice || "Automated risk assessment based on behavioral patterns. Does not constitute legal proof or a guaranteed fraud determination."}
            </span>
          </div>

          {/* Optional Plain-Language AI Explainer */}
          {result.llm_explanation && (
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(57, 127, 120, 0.08)',
                border: '1px solid rgba(57, 127, 120, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--primary-accent)' }}>
                <Sparkles size={14} />
                <span>Plain-Language AI Summary</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                {result.llm_explanation}
              </p>
            </div>
          )}

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
                      backgroundColor: 'var(--bg-secondary)',
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
                    backgroundColor: 'var(--bg-secondary)',
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
              backgroundColor: 'var(--primary-accent-light)',
              border: '1px solid rgba(57, 127, 120, 0.25)',
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

      {/* Privacy Limits & Technical Verification Modal */}
      <PrivacyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
    </div>
  );
};

export default MessageChecker;
