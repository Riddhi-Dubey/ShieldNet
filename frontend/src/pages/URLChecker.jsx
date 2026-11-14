import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  ExternalLink, 
  Search, 
  FileWarning, 
  Server, 
  Cpu, 
  ShieldAlert,
  Calendar,
  Layers,
  Download,
  Sparkles,
  Info
} from 'lucide-react';
import { analyseUrl, extractErrorMessage, downloadAnalysisReport } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { LoadingState, ErrorState } from '../components/LoadingState';
import PrivacyModal from '../components/PrivacyModal';

const SAMPLE_URLS = [
  'http://sbi-card-reward-redeem.online/login.php',
  'https://secure-appleid-verify.top/account',
  'http://income-tax-refund-gov.in.fraud-site.biz',
  'https://google.com',
];

export const URLChecker = () => {
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [consentForLlm, setConsentForLlm] = useState(false);

  const handleUrlChange = (e) => {
    setUrlInput(e.target.value);
    if (result) setResult(null); // Clear stale results on input change
    if (error) setError(null);
  };

  const handleUseSample = (sample) => {
    setUrlInput(sample);
    setResult(null); // Clear stale results when sample is picked
    setError(null);
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyseUrl(urlInput.trim(), consentForLlm);
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!result?.report_text) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadAnalysisReport(result.report_text, `shieldnet_url_assessment_${dateStr}.txt`);
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '980px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Globe size={18} style={{ color: 'var(--primary-accent)' }} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            ShieldNet Domain Defense
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)' }}>
          Malicious URL & Phishing Scanner
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Scan suspicious hyperlinks, shorteners, typo-squatted domains, and spoofed bank logins safely before visiting.
        </p>
      </div>

      {/* Input Box */}
      <div className="cyber-card">
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SUSPICIOUS URL OR DOMAIN</span>
              <span style={{ fontSize: '11px', color: urlInput.length > 1900 ? 'var(--accent-critical)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {urlInput.length} / 2048 characters
              </span>
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                maxLength={2048}
                value={urlInput}
                onChange={handleUrlChange}
                placeholder="e.g. http://sbi-reward-login.xyz or bit.ly/claim-prize"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <button
                type="submit"
                disabled={loading || !urlInput.trim()}
                className="btn btn-primary"
                style={{ minWidth: '160px', flexShrink: 0 }}
              >
                {loading ? 'Scanning URL...' : 'Scan Domain'}
              </button>
            </div>
          </div>

          {/* AI Explainer Consent Opt-in */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              id="ai-url-explainer-consent"
              checked={consentForLlm}
              onChange={(e) => setConsentForLlm(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--primary-accent)' }}
            />
            <label htmlFor="ai-url-explainer-consent" style={{ cursor: 'pointer', userSelect: 'none' }}>
              Generate plain-language AI explanation (Sends only extracted non-sensitive structural indicators)
            </label>
          </div>

          {/* Quick Samples */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Try sample:</span>
            {SAMPLE_URLS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleUseSample(sample)}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                {sample.replace(/^https?:\/\//, '').split('/')[0]}
              </button>
            ))}
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
                  URLs are parsed in volatile RAM for lexical heuristics and suspicious signals. Zero database writes, zero disk logging.
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
        </form>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="URL Scan Request Failed"
          message={error}
          onRetry={handleAnalyze}
        />
      )}

      {/* Scan Result */}
      {result && (
        <div className="cyber-card cyber-card-glow" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Verdict Header */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                {/* Method provenance pill */}
                <span
                  className="badge badge-neutral"
                  style={{ fontSize: '11px', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Cpu size={12} />
                  {result.model_version ? `Model ${result.model_version}` : 'RandomForest v2.2.0'} {result.calibrated_confidence ? `• ${result.calibrated_confidence}% Conf` : ''}
                </span>

                {result.is_verified_intelligence && (
                  <span className="badge badge-critical" style={{ fontSize: '11px' }}>
                    Verified Blacklist Record
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                {result.redacted_url || result.url || urlInput}
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RISK INDEX</div>
                <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: result.risk_score > 60 ? 'var(--accent-critical)' : result.risk_score > 30 ? 'var(--accent-warning)' : 'var(--accent-green)' }}>
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

          {/* Assessment Notice Banner */}
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
              <strong>Assessment Scope: </strong>
              {result.assessment_notice || "Automated static risk assessment based on lexical and structural features. Does not constitute legal proof. HTTPS encryption does not guarantee domain legitimacy."}
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

          {/* Domain Intelligence Details */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={16} style={{ color: 'var(--primary-accent)' }} />
              Domain Profile & Heuristic Indicators
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>TARGET DOMAIN</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {result.domain_info?.domain || result.domain || 'N/A'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>PROTOCOL SECURITY</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: (result.url || urlInput).startsWith('https') ? 'var(--accent-green)' : 'var(--accent-critical)' }}>
                  {(result.url || urlInput).startsWith('https') ? 'HTTPS (TLS Active)' : 'Insecure HTTP Protocol'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>ESTIMATED DOMAIN AGE</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {result.domain_info?.age || result.domain_age || 'Newly Registered (< 30 days)'}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>REGISTRAR / COUNTRY</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {result.domain_info?.registrar || 'Namecheap / Privacy Guard'}
                </span>
              </div>
            </div>

            {/* HTTPS Security Observation Callout */}
            {result.https_security_observation && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--primary-accent)' }}>Transport Security Observation: </strong>
                {result.https_security_observation}
              </div>
            )}
          </div>

          {/* Warning Signs */}
          {result.warning_signs && result.warning_signs.length > 0 && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} style={{ color: 'var(--accent-warning)' }} />
                Detected Warning Flags
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.warning_signs.map((sign, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderLeft: '3px solid var(--accent-critical)',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span>{typeof sign === 'string' ? sign : sign.detail || sign.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safe Browsing Recommendations */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
              Safe Browsing Advice
            </h3>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Do not enter bank credentials, debit card CVVs, or OTPs on this address.</li>
              <li>Always check if the root domain strictly matches the official brand site.</li>
              <li>If you have already entered login credentials on this URL, immediately change your password.</li>
            </ul>
          </div>

          {/* Investigation & Reporting CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button
              onClick={() => navigate(`/trace/search?q=${encodeURIComponent(result.domain || urlInput)}&type=url`)}
              className="btn btn-secondary"
            >
              <Search size={15} />
              Investigate in Network Mapper
            </button>

            <button
              onClick={() => navigate('/shield/report', { state: { url: urlInput, category: 'Phishing / Fake Website' } })}
              className="btn btn-primary"
            >
              <FileWarning size={15} />
              Report Phishing Domain
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

export default URLChecker;
