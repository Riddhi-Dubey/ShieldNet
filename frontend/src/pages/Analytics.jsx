import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  Layers, 
  ShieldAlert, 
  RefreshCw, 
  Share2, 
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { getAnalyticsSummary, extractErrorMessage } from '../services/api';
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState';
import RiskBadge from '../components/RiskBadge';

const COLOR_PALETTE = ['#38BDF8', '#FB923C', '#A78BFA', '#34D399', '#F87171', '#FBBF24', '#60A5FA'];

export const Analytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const summary = await getAnalyticsSummary();
      setData(summary);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <BarChart3 size={18} style={{ color: 'var(--primary-accent)' }} />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ScamTrace Analytics Engine
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Systemic Threat & Trend Analytics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Aggregate intelligence patterns, fraud category volumes, transaction velocities, and cluster densities.
          </p>
        </div>

        <button onClick={fetchAnalytics} className="btn btn-secondary" style={{ fontSize: '12px' }}>
          <RefreshCw size={14} /> Refresh Analytics
        </button>
      </div>

      {/* Demonstrative & Benchmark Intelligence Notice */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(167, 139, 250, 0.08)',
          border: '1px solid rgba(167, 139, 250, 0.28)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <Info size={18} style={{ color: 'var(--accent-purple)', marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Demonstrative Benchmark Notice:</strong> Analytical metrics, degree centralities, and flow velocities represent simulated transaction topologies (PaySim benchmark) and synthetic investigation scenarios. They showcase systemic mapping and cluster detection algorithms and do not represent verified criminal wiretaps or live police intelligence.
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Could Not Load Analytics Data"
          message={error}
          onRetry={fetchAnalytics}
        />
      )}

      {/* Loading or Charts Content */}
      {loading ? (
        <LoadingState message="Aggregating threat intelligence metrics from /api/analytics/summary..." />
      ) : data ? (
        <>
          {/* Row 1: Scam Categories & Risk Distribution */}
          <div className="grid-2">
            {/* Scam Categories Bar Chart */}
            <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Incidents by Scam Category
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Reported methodologies and social engineering vectors
                </span>
              </div>

              {data.categories || data.scamCategories ? (
                <div style={{ height: '280px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.categories || data.scamCategories} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                      <YAxis dataKey="category" type="category" stroke="#94A3B8" fontSize={11} width={130} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#172033', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '8px' }}
                      />
                      <Bar dataKey="count" fill="var(--primary-accent)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No category breakdown returned by API." />
              )}
            </div>

            {/* Entity Types Donut */}
            <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Monitored Entity Classification
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Ratio of communication vs payment entities in network graph
                </span>
              </div>

              {data.entityDistribution ? (
                <div style={{ height: '280px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.entityDistribution}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                      >
                        {data.entityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#172033', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '8px' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No entity classification data available." />
              )}
            </div>
          </div>

          {/* Row 2: Transaction Volume Trend (if provided) */}
          {(data.transactionTrends || data.timeline) && (
            <div className="cyber-card">
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} style={{ color: 'var(--accent-green)' }} />
                  Fraudulent Capital Flow & Transaction Velocity
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Correlated fund movements detected across monitored mule accounts over time
                </span>
              </div>

              <div style={{ height: '260px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.transactionTrends || data.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#172033', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="volume" stroke="#34D399" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="amount" stroke="#38BDF8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Row 3: Top Connected Hub Entities */}
          <div className="cyber-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Most Connected Threat Hubs
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Entities exhibiting maximum graph degree centrality and fan-out links
                </span>
              </div>
              <button
                onClick={() => navigate('/trace/network')}
                className="btn btn-secondary"
                style={{ fontSize: '12px' }}
              >
                <Share2 size={13} /> Open Network Graph
              </button>
            </div>

            {data.topEntities && data.topEntities.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>Entity Identifier</th>
                      <th style={{ padding: '10px 12px' }}>Type</th>
                      <th style={{ padding: '10px 12px' }}>Connection Degree</th>
                      <th style={{ padding: '10px 12px' }}>Risk Assessment</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topEntities.map((ent, idx) => (
                      <tr
                        key={ent.id || idx}
                        style={{ borderBottom: '1px solid #111827' }}
                      >
                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {ent.identifier || ent.id}
                        </td>
                        <td style={{ padding: '12px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                          {ent.type}
                        </td>
                        <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--primary-accent)', fontWeight: 700 }}>
                          {ent.degree || ent.connectionsCount || 0} links
                        </td>
                        <td style={{ padding: '12px' }}>
                          <RiskBadge level={ent.riskLevel || 'critical'} score={ent.riskScore} size="sm" />
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            onClick={() => navigate(`/trace/investigate/${encodeURIComponent(ent.identifier || ent.id)}`)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            Inspect <ExternalLink size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="No hub entities identified." />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Analytics;
