import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ShieldAlert, 
  Globe, 
  Phone, 
  Landmark, 
  Wallet, 
  ArrowRight, 
  Database, 
  Share2, 
  FileText, 
  Inbox,
  AlertTriangle,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { searchEntities, extractErrorMessage } from '../services/api';
import SearchBar, { detectEntityType } from '../components/SearchBar';
import RiskBadge from '../components/RiskBadge';
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState';

const TYPE_ICONS = {
  phone: Phone,
  url: Globe,
  bank: Landmark,
  wallet: Wallet,
};

export const InvestigationSearch = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Parse query params
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'auto';

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [lastSearched, setLastSearched] = useState(initialQuery);

  const performSearch = async (query, type) => {
    if (!query) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setLastSearched(query);

    try {
      const data = await searchEntities({ query, type });
      // Results can be an array of matching entities or an object { results: [...], count: ... } or single entity
      let formattedResults = [];
      if (Array.isArray(data)) {
        formattedResults = data;
      } else if (data && Array.isArray(data.results)) {
        formattedResults = data.results;
      } else if (data && data.identifier) {
        formattedResults = [data];
      }
      setResults(formattedResults);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, initialType);
    }
  }, [initialQuery, initialType]);

  const handleSearchSubmit = ({ query, type }) => {
    navigate(`/trace/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`, { replace: true });
    performSearch(query, type);
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Search size={18} style={{ color: 'var(--accent-purple)' }} />
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ScamTrace Universal Intelligence Engine
          </span>
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Universal Entity Investigation Search
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Search cross-jurisdictional threat records by Phone, Phishing URL, Bank Account / UPI VPA, or Crypto Address.
        </p>
      </div>

      {/* Main Search Bar Card */}
      <div className="cyber-card" style={{ padding: '24px', backgroundColor: '#0F172A' }}>
        <SearchBar
          onSearch={handleSearchSubmit}
          initialQuery={initialQuery}
          initialType={initialType}
        />
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Search Request Failed"
          message={error}
          onRetry={() => performSearch(lastSearched, initialType)}
        />
      )}

      {/* Loading State */}
      {loading && (
        <LoadingState message={`Querying threat repositories for "${lastSearched}"...`} />
      )}

      {/* Empty State when searched and no results */}
      {!loading && !error && results && results.length === 0 && (
        <div
          className="cyber-card"
          style={{
            textAlign: 'center',
            padding: '50px 24px',
            backgroundColor: '#0D1527',
          }}
        >
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              backgroundColor: '#1E293B',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Inbox size={26} />
          </div>

          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            No matching intelligence records found.
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.5 }}>
            No corroborating fraud flags, honeypot hits, or consented reports are currently registered for &ldquo;{lastSearched}&rdquo;.
          </p>

          <button
            onClick={() => navigate('/shield/report', { state: { phoneNumber: lastSearched } })}
            className="btn btn-secondary"
            style={{ fontSize: '13px' }}
          >
            File First Incident Report
          </button>
        </div>
      )}

      {/* Results List */}
      {!loading && results && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Found {results.length} matching entity record{results.length > 1 ? 's' : ''} for &ldquo;{lastSearched}&rdquo;
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {results.map((entity, idx) => {
              const entityType = String(entity.type || detectEntityType(entity.identifier || '')).toLowerCase();
              const Icon = TYPE_ICONS[entityType] || Globe;

              return (
                <div
                  key={entity.id || entity.identifier || idx}
                  className="cyber-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    borderColor: 'rgba(56, 189, 248, 0.25)',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Entity Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          backgroundColor: '#111827',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary-accent)',
                        }}
                      >
                        <Icon size={20} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {entity.type || entityType} ENTITY
                          </span>
                          {entity.isSynthetic && (
                            <span className="badge badge-synthetic" style={{ fontSize: '10px' }}>
                              Synthetic Pattern
                            </span>
                          )}
                        </div>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          {entity.identifier || entity.id}
                        </h2>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <RiskBadge level={entity.riskLevel || entity.risk_level} score={entity.riskScore ?? entity.risk_score} size="lg" />
                      <button
                        onClick={() => navigate(`/trace/investigate/${encodeURIComponent(entity.id || entity.identifier)}`)}
                        className="btn btn-primary"
                        style={{ fontSize: '13px', padding: '8px 16px' }}
                      >
                        Full Investigation <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Evidence & Provenance Summary */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px',
                      padding: '12px 16px',
                      backgroundColor: '#0D1527',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Source Dataset</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{entity.sourceDataset || entity.source || 'Threat Intelligence Core'}</span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Associated Reports</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)' }}>
                        {entity.reportCount ?? entity.associatedReports?.length ?? 0} Consented Reports
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Connected Entities</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>
                        {entity.connectedEntitiesCount ?? entity.connections?.length ?? 0} Mapped Links
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>First Reported / Updated</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{entity.lastUpdated || 'Recent'}</span>
                    </div>
                  </div>

                  {/* Evidence Summary Blurb */}
                  {entity.evidenceSummary && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong>Evidence Summary: </strong> {entity.evidenceSummary}
                    </p>
                  )}

                  {/* Connected Entities Chips */}
                  {entity.connectedEntities && entity.connectedEntities.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Connected Nodes:</span>
                      {entity.connectedEntities.slice(0, 5).map((conn, cIdx) => (
                        <span
                          key={cIdx}
                          onClick={() => navigate(`/trace/investigate/${encodeURIComponent(conn.identifier || conn.id || conn)}`)}
                          style={{
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-primary)',
                            backgroundColor: '#111827',
                            border: '1px solid var(--border-color)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          {typeof conn === 'string' ? conn : conn.identifier || conn.id}
                        </span>
                      ))}
                      {entity.connectedEntities.length > 5 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          +{entity.connectedEntities.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestigationSearch;
