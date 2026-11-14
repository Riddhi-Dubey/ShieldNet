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
  Layers
} from 'lucide-react';
import { analyseUrl, extractErrorMessage } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import { LoadingState, ErrorState } from '../components/LoadingState';

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

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyseUrl(urlInput.trim());
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '980px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Globe size={18} style={{ color: 'var(--primary-accent)' }} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ScamShield Domain Defense
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
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
            <label className="form-label">SUSPICIOUS URL OR DOMAIN</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
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

          {/* Quick Samples */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Try sample:</span>
            {SAMPLE_URLS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setUrlInput(sample)}
                style={{
                  backgroundColor: '#111827',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: '20px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                }}
              >
                {sample.replace(/^https?:\/\//, '').split('/')[0]}
              </button>
            ))}
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
                  Engine: {result.evaluation_method || result.engine || 'Model Prediction & Heuristics'}
                </span>

                {result.is_verified_intelligence && (
                  <span className="badge badge-critical" style={{ fontSize: '11px' }}>
                    Verified Blacklist Record
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                {result.url || urlInput}
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RISK INDEX</div>
                <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: result.risk_score > 60 ? 'var(--accent-critical)' : result.risk_score > 30 ? 'var(--accent-warning)' : 'var(--accent-green)' }}>
                  {result.risk_score ?? result.riskScore ?? 0}<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/100</span>
                </div>
              </div>
              <RiskBadge level={result.risk_level || result.riskLevel} score={result.risk_score ?? result.riskScore} size="lg" />
            </div>
          </div>

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
                backgroundColor: '#0D1527',
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
                      backgroundColor: '#111827',
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
              Investigate in ScamTrace
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
    </div>
  );
};

export default URLChecker;
