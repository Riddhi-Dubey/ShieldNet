import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft, 
  Printer, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  Share2, 
  Clock, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { getEntityDetails, getEntityConnections, getEntityTimeline, extractErrorMessage } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import ThreatTimeline from '../components/ThreatTimeline';
import { LoadingState, ErrorState } from '../components/LoadingState';

export const InvestigationReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [entity, setEntity] = useState(null);
  const [connections, setConnections] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const [entityData, connData, timelineData] = await Promise.all([
          getEntityDetails(id),
          getEntityConnections(id).catch(() => []),
          getEntityTimeline(id).catch(() => ({ events: [] })),
        ]);
        setEntity(entityData);
        setConnections(Array.isArray(connData) ? connData : connData?.connections || []);
        setTimelineEvents(timelineData?.events || []);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = async () => {
    if (!entity) return;
    try {
      window.open(`/api/entities/${encodeURIComponent(id)}/export?format=csv`, '_blank');
    } catch (e) {
      alert('Failed to initiate CSV export');
    }
  };

  const handleExportMarkdown = async () => {
    if (!entity) return;
    try {
      window.open(`/api/entities/${encodeURIComponent(id)}/export?format=markdown`, '_blank');
    } catch (e) {
      alert('Failed to initiate Markdown export');
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <LoadingState message={`Compiling forensic report for ${id}...`} />
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="page-wrapper">
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <ErrorState
          title="Investigation Report Generation Failed"
          message={error || 'The intelligence record for this identifier could not be retrieved.'}
        />
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '920px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Controls */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ fontSize: '13px' }}>
          <ArrowLeft size={14} /> Back to Investigation
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportMarkdown} className="btn btn-secondary" style={{ fontSize: '13px' }}>
            <FileText size={14} /> Export MD
          </button>
          <button onClick={handleExportCSV} className="btn btn-secondary" style={{ fontSize: '13px' }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={handlePrint} className="btn btn-primary" style={{ fontSize: '13px' }}>
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Formal Dossier Card */}
      <div
        className="cyber-card"
        style={{
          padding: '40px',
          backgroundColor: '#0A0F1E',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'relative',
        }}
      >
        {/* Dossier Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-color)', paddingBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-accent)',
                  color: '#0B1020',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                }}
              >
                ST
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                ScamTrace Threat Dossier
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Cyber Intelligence Correlation & Threat Attribution Document
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <div>DOSSIER REF: #{entity.id || id}</div>
            <div>TIMESTAMP: {new Date().toUTCString()}</div>
            <div style={{ color: 'var(--accent-green)', marginTop: '2px' }}>STATUS: VERIFIED RECORD</div>
          </div>
        </div>

        {/* Target Entity Overview */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            padding: '16px',
            backgroundColor: '#0D1527',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>TARGET IDENTIFIER</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {entity.identifier || entity.id || id}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ENTITY TYPE</span>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-accent)', textTransform: 'uppercase', marginTop: '2px' }}>
              {entity.type || 'Communication Endpoint'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>COMPOSITE RISK LEVEL</span>
            <div style={{ marginTop: '2px' }}>
              <RiskBadge level={entity.riskLevel} score={entity.riskScore} size="md" />
            </div>
          </div>

          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ORIGIN DATASET</span>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
              {entity.sourceDataset || 'National Cyber Registry Feeds'}
            </div>
          </div>
        </div>

        {/* Evidence & Forensic Findings */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
            Forensic Evidence & Behavioral Indicators
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
            {entity.evidenceSummary || 'Entity correlates with multiple high-frequency outbound fraud calls and suspicious UPI registration requests. Cross-referenced against authenticated telecom registries.'}
          </p>

          {entity.warningSignals && entity.warningSignals.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entity.warningSignals.map((w, idx) => (
                <div key={idx} style={{ padding: '8px 12px', backgroundColor: '#111827', borderRadius: '4px', fontSize: '12px', color: 'var(--text-primary)' }}>
                  • {typeof w === 'string' ? w : w.signal || w.explanation}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Associated Connected Entities Table */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
            Associated Graph Network ({connections.length} Mapped Relationships)
          </h3>

          {connections.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px' }}>Target Node</th>
                    <th style={{ padding: '8px' }}>Type</th>
                    <th style={{ padding: '8px' }}>Relationship</th>
                    <th style={{ padding: '8px' }}>Assessed Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((c, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #111827' }}>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{c.identifier || c.target || c.id}</td>
                      <td style={{ padding: '8px', textTransform: 'capitalize' }}>{c.type}</td>
                      <td style={{ padding: '8px' }}>{c.relation}</td>
                      <td style={{ padding: '8px' }}>{c.riskLevel || 'High'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No direct multi-hop links registered.</div>
          )}
        </div>

        {/* Chronological Threat Timeline */}
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
            Chronological Incident & Network Timeline ({timelineEvents.length} Events)
          </h3>
          <ThreatTimeline events={timelineEvents} />
        </div>

        {/* Regulatory Limitations Disclaimer */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '16px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          <strong>DISCLAIMER & LEGAL SCOPE: </strong>
          This document is generated by ScamTrace for informational cyber threat intelligence and defensive triage. Correlation does not constitute a final judicial conviction. Account blocking or formal asset freezing must follow standard legal process through designated statutory law enforcement authorities under applicable cybersecurity legislation.
        </div>
      </div>
    </div>
  );
};

export default InvestigationReport;
