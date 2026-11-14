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
import { getMessageRiskAssessment, MESSAGE_PROBABILITY_THRESHOLDS } from '../utils/riskThresholds';

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
      {result && (() => {
        const riskAssessment = getMessageRiskAssessment(result.ml_probability ?? result.risk_score);

        return (
          <div className="cyber-card cyber-card-glow" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Top Score Banner: Model Probability as Single Source of Truth */}
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
                {riskAssessment.isAssessed ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span
                      className="badge badge-neutral"
                      style={{ fontSize: '11px', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Cpu size={12} />
                      {result.model_type || 'TF-IDF + Calibrated Logistic Regression'} {result.model_version ? `(${result.model_version})` : ''}
                    </span>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: riskAssessment.colorVar,
                        backgroundColor: riskAssessment.bgVar,
                        border: `1px solid ${riskAssessment.borderColor}`,
                        padding: '2px 9px',
                        borderRadius: '9999px',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {result.ml_probability !== undefined && result.ml_probability !== null ? `${Number(result.ml_probability).toFixed(1)}% scam probability` : ''}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                      <Cpu size={12} />
                      Statistical ML Model Unavailable
                    </span>
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Assessed Threat Verdict
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {result.verdict || (riskAssessment.isAssessed ? `${riskAssessment.displayVerdict} — ${Number(result.ml_probability).toFixed(1)}% SCAM PROBABILITY` : 'Unable to Assess Threat')}
                </h2>
              </div>

              {/* Primary Metric: Model Scam Probability and agreeing Risk Level */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {riskAssessment.isAssessed ? (
                  <>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                        SCAM PROBABILITY
                      </div>
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: 900,
                          fontFamily: 'var(--font-mono)',
                          color: riskAssessment.colorVar,
                          lineHeight: 1.1,
                        }}
                      >
                        {Number(result.ml_probability).toFixed(1)}%
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: riskAssessment.colorVar,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          marginTop: '2px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {riskAssessment.label}
                      </div>
                    </div>
                    <RiskBadge
                      level={riskAssessment.level}
                      score={Number(result.ml_probability).toFixed(1)}
                      scoreSuffix="%"
                      size="lg"
                    />
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        STATUS
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        Unable to assess
                      </div>
                    </div>
                    <RiskBadge level="unable_to_assess" size="lg" />
                  </>
                )}

                {result.report_text && (
                  <button
                    type="button"
                    onClick={handleDownloadReport}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Download plain-text assessment dossier"
                  >
                    <Download size={14} />
                    Download Report (.txt)
                  </button>
                )}
              </div>
            </div>

            {/* Probability Bands Reference & Live State */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '9px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                fontSize: '11.5px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Calibrated Probability Bands:</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>● Low Risk: &lt; 30%</span>
                <span style={{ color: 'var(--text-muted)' }}>|</span>
                <span style={{ color: 'var(--accent-warning)', fontWeight: 600 }}>● Medium Risk: 30% to &lt;70%</span>
                <span style={{ color: 'var(--text-muted)' }}>|</span>
                <span style={{ color: 'var(--accent-critical)', fontWeight: 600 }}>● High Risk: 70% to 100%</span>
              </div>
              {riskAssessment.isAssessed && (
                <div style={{ color: 'var(--text-secondary)' }}>
                  Assessed: <strong style={{ color: riskAssessment.colorVar }}>{Number(result.ml_probability).toFixed(1)}% scam probability → {riskAssessment.label.toUpperCase()}</strong>
                </div>
              )}
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

            {/* Assessment Explanation & Model Evidence Card */}
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <ShieldCheck size={16} style={{ color: riskAssessment.colorVar }} />
                  <span>Statistical Model Risk Assessment Explanation</span>
                </div>
                <span className={`badge ${riskAssessment.badgeClass}`} style={{ fontSize: '11px' }}>
                  {riskAssessment.label} ({result.ml_probability !== undefined && result.ml_probability !== null ? `${Number(result.ml_probability).toFixed(1)}%` : 'Unavailable'})
                </span>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.55, margin: 0 }}>
                {result.explanation || result.summary}
              </p>

              {/* Contributing Model Features if available */}
              {result.model_contributing_features && result.model_contributing_features.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Strongest Contributing Model Text Features:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {result.model_contributing_features.map((feat, fIdx) => (
                      <span
                        key={fIdx}
                        style={{
                          fontSize: '11.5px',
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid var(--border-color)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          color: 'var(--text-primary)',
                        }}
                      >
                        "{feat.feature}"
                      </span>
                    ))}
                  </div>
                </div>
              )}
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

            {/* Rule-Based Warning Triggers (Heuristic Layer) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} style={{ color: 'var(--accent-warning)' }} />
                  Rule-Based Warning Triggers (Heuristic Layer)
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)'
                  }}>
                    Heuristic Score: {result.heuristic_score ?? 0}/100
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    (Separate rule match metric)
                  </span>
                </div>
              </div>

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
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {sig.explanation || sig.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                    No individual rule-based warning triggers were identified.
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    This message did not match predefined trigger patterns (such as specific banking keywords, hardcoded urgency phrases, or credential-harvesting patterns).
                  </p>
                  {riskAssessment.level !== 'LOW' && (
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: riskAssessment.colorVar,
                        backgroundColor: riskAssessment.bgVar,
                        border: `1px solid ${riskAssessment.borderColor}`,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginTop: '4px',
                        lineHeight: 1.45,
                      }}
                    >
                      <strong>Important Notice on Metric Independence:</strong> A 0/100 heuristic indicator score does not cancel or disprove the model’s <strong>{result.ml_probability !== undefined && result.ml_probability !== null ? `${Number(result.ml_probability).toFixed(1)}% scam probability` : ''} ({riskAssessment.label})</strong>. Rule-based triggers search for exact keyword templates, whereas the statistical machine learning model evaluates broader linguistic patterns.
                    </div>
                  )}
                </div>
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
        );
      })()}

      {/* Privacy Limits & Technical Verification Modal */}
      <PrivacyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
    </div>
  );
};

export default MessageChecker;
