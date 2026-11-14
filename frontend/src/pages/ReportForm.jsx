import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FileWarning, 
  ShieldAlert, 
  Calendar, 
  Phone, 
  Globe, 
  Landmark, 
  Mail, 
  Upload, 
  CheckCircle, 
  Eye, 
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { previewReport, submitReport, extractErrorMessage } from '../services/api';
import ReportPreview from '../components/ReportPreview';
import { LoadingState, ErrorState } from '../components/LoadingState';

const INCIDENT_CATEGORIES = [
  'Phishing / SMS Scams',
  'Fake Investment / Trading App',
  'UPI / QR Code Fraud',
  'Electricity / Utility Bill Disconnection',
  'Job / Part-time Task Fraud',
  'Digital Arrest / Police Impersonation',
  'Lottery / Prize Fraud',
  'Loan App Extortion',
  'Other Cyber Fraud',
];

export const ReportForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stateData = location.state || {};

  const [formData, setFormData] = useState({
    category: stateData.category || 'Phishing / SMS Scams',
    date: new Date().toISOString().split('T')[0],
    description: stateData.description || '',
    phoneNumber: stateData.phoneNumber || '',
    url: stateData.url || '',
    upiId: stateData.upiId || '',
    email: stateData.email || '',
    evidenceNote: '',
  });

  const [step, setStep] = useState('edit'); // 'edit' | 'preview' | 'success'
  const [previewData, setPreviewData] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false); // MUST be initially unchecked
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submittedResponse, setSubmittedResponse] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Generate preview via POST /api/reports/preview
  const handleProceedToPreview = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      setError('Please provide an incident description.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const preview = await previewReport(formData);
      setPreviewData(preview);
      setStep('preview');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Final submission via POST /api/reports (with explicit consent flag)
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        consent_given: consentGiven,
        share_with_scamtrace: consentGiven,
      };

      const result = await submitReport(payload);
      setSubmittedResponse(result);
      setStep('success');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '880px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <FileWarning size={18} style={{ color: 'var(--accent-critical)' }} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-critical)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Incident Logging & Triage
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Report a Cyber Threat Incident
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Log indicators from fraudulent calls, fake URLs, and extortion messages. Complete transparency on data usage.
        </p>
      </div>

      {/* Stepper Progress */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step === 'edit' ? 'var(--primary-accent)' : 'var(--text-muted)', fontWeight: 700, fontSize: '13px' }}>
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: step === 'edit' ? 'var(--primary-accent)' : 'var(--border-color)', color: step === 'edit' ? '#FFFFFF' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>1</span>
          Incident Details
        </div>
        <div style={{ width: '40px', height: '1px', backgroundColor: 'var(--border-color)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step === 'preview' ? 'var(--primary-accent)' : 'var(--text-muted)', fontWeight: 700, fontSize: '13px' }}>
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: step === 'preview' ? 'var(--primary-accent)' : 'var(--border-color)', color: step === 'preview' ? '#FFFFFF' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>2</span>
          Preview & Consent
        </div>
        <div style={{ width: '40px', height: '1px', backgroundColor: 'var(--border-color)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step === 'success' ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: 700, fontSize: '13px' }}>
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: step === 'success' ? 'var(--accent-green)' : 'var(--border-color)', color: step === 'success' ? '#FFFFFF' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>3</span>
          Confirmation
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Submission Error"
          message={error}
        />
      )}

      {/* STEP 1: FORM EDIT */}
      {step === 'edit' && (
        <form onSubmit={handleProceedToPreview} className="cyber-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">INCIDENT CATEGORY *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-select"
                required
              >
                {INCIDENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">DATE OF INCIDENT *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">INCIDENT DESCRIPTION *</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the incident: how they contacted you, what claim they made, what actions were requested..."
              className="form-textarea"
              required
            />
          </div>

          {/* Suspect Indicators Grid */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '14px', textTransform: 'uppercase' }}>
              Suspect Threat Indicators (Enter any that apply)
            </h4>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} style={{ color: 'var(--primary-accent)' }} /> Suspect Phone Number
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. +91 9876543210"
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={14} style={{ color: 'var(--accent-orange)' }} /> Malicious URL or Domain
                </label>
                <input
                  type="text"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="e.g. http://fake-bank-login.xyz"
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Landmark size={14} style={{ color: 'var(--accent-purple)' }} /> Suspect UPI ID or Bank Account
                </label>
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleInputChange}
                  placeholder="e.g. payment@okaxis or 912345678901"
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} style={{ color: 'var(--accent-green)' }} /> Sender Email / Social Handle
                </label>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. support@fraud-officer.com or @telegram_user"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Optional Evidence Details */}
          <div className="form-group">
            <label className="form-label">EVIDENCE NOTES / TRANSACTION UTR (OPTIONAL)</label>
            <input
              type="text"
              name="evidenceNote"
              value={formData.evidenceNote}
              onChange={handleInputChange}
              placeholder="e.g. UTR #4123891024 or screenshot taken"
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ minWidth: '220px', padding: '12px' }}
            >
              <Eye size={16} />
              {loading ? 'Generating Preview...' : 'Proceed to Report Preview'}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: PREVIEW & CONSENT GATE */}
      {step === 'preview' && (
        <ReportPreview
          formData={formData}
          previewData={previewData}
          consentGiven={consentGiven}
          onConsentChange={setConsentGiven}
          onConfirm={handleFinalSubmit}
          onEdit={() => setStep('edit')}
          isSubmitting={submitting}
        />
      )}

      {/* STEP 3: SUBMISSION CONFIRMATION */}
      {step === 'success' && (
        <div
          className="cyber-card cyber-card-glow"
          style={{
            borderColor: 'var(--accent-green)',
            textAlign: 'center',
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(52, 211, 153, 0.15)',
              color: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle size={32} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Incident Report Successfully Logged
          </h2>

          <div
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--primary-accent)',
              backgroundColor: 'var(--primary-accent-light)',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(57, 127, 120, 0.25)',
            }}
          >
            Incident ID: {submittedResponse?.id || submittedResponse?.report_id || `INC-${Date.now().toString().slice(-6)}`}
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.5 }}>
            {consentGiven
              ? 'Your indicators have been hashed and integrated with ShieldNet Threat Intelligence to map threat clusters and warn prospective victims.'
              : 'Your report is stored strictly within ShieldNet. Per your decision, threat indicators were NOT shared with external intelligence networks.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setFormData({
                  category: 'Phishing / SMS Scams',
                  date: new Date().toISOString().split('T')[0],
                  description: '',
                  phoneNumber: '',
                  url: '',
                  upiId: '',
                  email: '',
                  evidenceNote: '',
                });
                setConsentGiven(false);
                setStep('edit');
              }}
              className="btn btn-secondary"
            >
              Submit Another Report
            </button>

            {consentGiven && (
              <button
                onClick={() => navigate('/trace/network')}
                className="btn btn-purple"
              >
                View in Network Explorer
              </button>
            )}

            <button
              onClick={() => navigate('/shield/message')}
              className="btn btn-primary"
            >
              Back to Message Checker
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportForm;
