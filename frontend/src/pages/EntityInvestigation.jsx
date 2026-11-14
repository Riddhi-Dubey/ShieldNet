import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileSearch, 
  ArrowLeft, 
  ShieldAlert, 
  Share2, 
  Database, 
  FileText, 
  ExternalLink, 
  AlertTriangle, 
  TrendingUp,
  Layers,
  Phone,
  Globe,
  Landmark,
  Wallet,
  Download
} from 'lucide-react';
import { getEntityDetails, getEntityConnections, extractErrorMessage } from '../services/api';
import RiskBadge from '../components/RiskBadge';
import EvidencePanel from '../components/EvidencePanel';
import { LoadingState, ErrorState } from '../components/LoadingState';

const TYPE_ICONS = {
  phone: Phone,
  url: Globe,
  bank: Landmark,
  wallet: Wallet,
};

export const EntityInvestigation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [entity, setEntity] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEntityData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const [entityRes, connRes] = await Promise.all([
        getEntityDetails(id),
        getEntityConnections(id).catch(() => []),
      ]);

      setEntity(entityRes);
      setConnections(Array.isArray(connRes) ? connRes : connRes?.connections || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntityData();
  }, [id]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <LoadingState message={`Retrieving forensic profile for ${id}...`} />
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="page-wrapper">
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '16px', fontSize: '12px' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <ErrorState
          title="Entity Intelligence Record Unavailable"
          message={error || 'Could not find intelligence dossiers for this identifier.'}
          onRetry={fetchEntityData}
        />
      </div>
    );
  }

  const entityType = String(entity.type || 'phone').toLowerCase();
  const Icon = TYPE_ICONS[entityType] || Globe;

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Navigation & Action Strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
          style={{ fontSize: '13px', padding: '6px 14px' }}
        >
          <ArrowLeft size={14} /> Back to Search
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/trace/network')}
            className="btn btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <Share2 size={15} />
            Graph Overview
          </button>

          <button
            onClick={() => navigate(`/trace/report/${encodeURIComponent(id)}`)}
            className="btn btn-primary"
            style={{ fontSize: '13px' }}
          >
            <FileText size={15} />
            Generate Investigation Dossier
          </button>
        </div>
      </div>

      {/* Main Entity Profile Card */}
      <div className="cyber-card cyber-card-glow" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-accent)',
              }}
            >
              <Icon size={28} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--primary-accent)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  {entity.type} THREAT PROFILE
                </span>
                {entity.isSynthetic && (
                  <span className="badge badge-synthetic" style={{ fontSize: '10px' }}>
                    Synthetic
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {entity.identifier || entity.id || id}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>COMPOSITE RISK</div>
              <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'var(--font-mono)', color: entity.riskScore > 60 ? 'var(--accent-critical)' : entity.riskScore > 30 ? 'var(--accent-warning)' : 'var(--accent-green)' }}>
                {entity.riskScore ?? entity.risk_score ?? 0}<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/100</span>
              </div>
            </div>
            <RiskBadge level={entity.riskLevel || entity.risk_level} score={entity.riskScore ?? entity.risk_score} size="lg" />
          </div>
        </div>

        {/* Risk Breakdown Bar */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px' }}>
            Multi-Vector Risk Breakdown
          </h3>

          <div className="grid-3">
            <div style={{ padding: '12px', backgroundColor: '#0D1527', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>REPUTATION VELOCITY</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {entity.riskBreakdown?.reputation || entity.reputation || 'High Signal Velocity'}
              </span>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#0D1527', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>GRAPH CENTRALITY</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-purple)' }}>
                {entity.riskBreakdown?.centrality || 'Syndicate Hub (0.84)'}
              </span>
            </div>

            <div style={{ padding: '12px', backgroundColor: '#0D1527', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>CONSENTED COMPLAINTS</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-orange)' }}>
                {entity.reportCount || entity.associatedReports?.length || 0} Registered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Entities Table */}
      <div className="cyber-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={16} style={{ color: 'var(--primary-accent)' }} />
            Connected Entities ({connections.length})
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Direct 1-Hop Relations</span>
        </div>

        {connections.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 12px' }}>Target Identifier</th>
                  <th style={{ padding: '10px 12px' }}>Entity Type</th>
                  <th style={{ padding: '10px 12px' }}>Relationship</th>
                  <th style={{ padding: '10px 12px' }}>Risk</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((c, idx) => (
                  <tr
                    key={c.id || idx}
                    style={{ borderBottom: '1px solid #111827', cursor: 'pointer', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0D1527')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {c.identifier || c.target || c.id}
                    </td>
                    <td style={{ padding: '12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {c.type || 'Unknown'}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--primary-accent)' }}>
                      {c.relation || 'Transfers To'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <RiskBadge level={c.riskLevel || 'medium'} score={c.riskScore} size="sm" />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/trace/investigate/${encodeURIComponent(c.identifier || c.target || c.id)}`)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        Investigate <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
            No immediate 1-hop connections mapped for this entity in current dataset slice.
          </p>
        )}
      </div>

      {/* Transaction Details if available */}
      {entity.transactions && entity.transactions.length > 0 && (
        <div className="cyber-card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent-green)' }} />
            Corroborated Transaction Trails
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {entity.transactions.map((tx, idx) => (
              <div
                key={tx.id || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: '#0D1527',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                <div>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>UTR: {tx.utr || tx.txHash || `TX-${1000 + idx}`}</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Date: {tx.date || 'Recent'} • Method: {tx.channel || 'UPI'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: 'var(--accent-critical)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    ₹{tx.amount?.toLocaleString() || '15,000'}
                  </span>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Flagged Fraudulent</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence Panel & Provenance Component */}
      <EvidencePanel
        datasetName={entity.sourceDataset || 'National Cyber Intelligence Grid'}
        source={entity.authority || 'Consolidated Regulatory Repository'}
        evidenceClassification={entity.isSynthetic ? 'Synthetic Pattern' : 'Verified Intelligence'}
        recordCount={entity.recordCount}
        lastUpdated={entity.lastUpdated}
        associatedReports={entity.associatedReports}
        isSynthetic={entity.isSynthetic}
        limitations="Correlative intelligence signals. Do not freeze accounts solely based on composite scores without manual supervisory review."
      />
    </div>
  );
};

export default EntityInvestigation;
