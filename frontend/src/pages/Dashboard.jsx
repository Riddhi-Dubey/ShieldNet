import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ShieldAlert, 
  Share2, 
  Layers, 
  Activity, 
  ArrowRight, 
  TrendingUp,
  AlertTriangle,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getDashboardStats, extractErrorMessage } from '../services/api';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import SearchBar from '../components/SearchBar';
import { LoadingState, ErrorState, EmptyState } from '../components/LoadingState';

const RISK_COLORS = {
  low: '#34D399',
  medium: '#FBBF24',
  high: '#FB923C',
  critical: '#F87171',
};

const ENTITY_COLORS = ['#38BDF8', '#FB923C', '#A78BFA', '#34D399', '#94A3B8'];

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickSearch = ({ query, type }) => {
    navigate(`/trace/search?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`);
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header & Quick Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="pulse-dot pulse-dot-purple" />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Demonstration & Research Sandbox Stream
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            ScamTrace Intelligence Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Demonstrative network mapping, syndicate cluster discovery, and simulated threat indicators.
          </p>
        </div>

        {/* Global Quick Actions */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/trace/network')}
            className="btn btn-purple"
            style={{ fontSize: '13px' }}
          >
            <Share2 size={16} />
            Network Explorer
          </button>
          <button
            onClick={() => navigate('/shield/report')}
            className="btn btn-primary"
            style={{ fontSize: '13px' }}
          >
            <ShieldAlert size={16} />
            Log Threat Incident
          </button>
        </div>
      </div>

      {/* Demonstrative Intelligence & Provenance Disclosure Banner */}
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
          <strong style={{ color: 'var(--text-primary)' }}>Demonstrative Data Notice:</strong> The threat indicators, network clusters, and entities displayed below (tagged <span className="badge badge-synthetic" style={{ fontSize: '10px', padding: '1px 6px' }}>SYNTHETIC_DEMO</span> or <span className="badge badge-synthetic" style={{ fontSize: '10px', padding: '1px 6px' }}>PAYSIM_SIMULATED</span>) are synthesized honeypots and academic research benchmarks created to demonstrate multi-hop graph mapping capabilities. <strong>Counts and charts reflect demonstration benchmarks and must not be interpreted as live police surveillance or confirmed real-world suspects.</strong>
        </div>
      </div>

      {/* Quick Universal Search Bar */}
      <div className="cyber-card" style={{ padding: '20px', backgroundColor: '#0F172A' }}>
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={16} style={{ color: 'var(--primary-accent)' }} />
            Quick Entity Lookup
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Query any suspect phone, UPI handle, lookalike domain, or crypto wallet in real-time.
          </p>
        </div>
        <SearchBar onSearch={handleQuickSearch} />
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Could Not Connect to Dashboard Intelligence API"
          message={error}
          onRetry={fetchStats}
        />
      )}

      {/* Loading Skeleton or Stats Content */}
      {loading ? (
        <LoadingState message="Fetching live backend statistics from /api/dashboard/stats..." />
      ) : stats ? (
        <>
          {/* Top 4 KPI Stat Cards */}
          <div className="grid-4">
            <StatCard
              title="Demonstration Entities"
              value={stats.totalEntities ?? stats.total_entities}
              subtitle="Simulated benchmark & demo nodes"
              icon={Users}
              color="var(--primary-accent)"
              onClick={() => navigate('/trace/search')}
            />

            <StatCard
              title="High Risk Nodes"
              value={stats.suspiciousEntities ?? stats.suspicious_entities}
              subtitle="Simulated high/critical severity"
              icon={ShieldAlert}
              color="var(--accent-critical)"
              onClick={() => navigate('/trace/analytics')}
            />

            <StatCard
              title="Graph Relationships"
              value={stats.totalRelationships ?? stats.total_relationships}
              subtitle="Simulated transfer & contact links"
              icon={Share2}
              color="var(--accent-purple)"
              onClick={() => navigate('/trace/network')}
            />

            <StatCard
              title="Syndicate Clusters"
              value={stats.connectedClusters ?? stats.connected_clusters}
              subtitle="Demonstrative fraud rings"
              icon={Layers}
              color="var(--accent-orange)"
              onClick={() => navigate('/trace/network')}
            />
          </div>

          {/* Charts Row */}
          <div className="grid-2">
            {/* Entity Distribution Chart */}
            <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Entity Type Breakdown
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Distribution across monitored communication and financial vectors
                </span>
              </div>

              {stats.entityDistribution || stats.entity_distribution ? (
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.entityDistribution || stats.entity_distribution}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={46}
                        paddingAngle={4}
                      >
                        {(stats.entityDistribution || stats.entity_distribution).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ENTITY_COLORS[index % ENTITY_COLORS.length]} />
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
                <EmptyState message="No entity distribution metrics returned by API." />
              )}
            </div>

            {/* Risk Distribution Chart */}
            <div className="cyber-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Threat Risk Distribution
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Assessed severity across verified and consented entities
                </span>
              </div>

              {stats.riskDistribution || stats.risk_distribution ? (
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.riskDistribution || stats.risk_distribution}>
                      <XAxis dataKey="level" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#172033', borderColor: '#1E293B', color: '#F8FAFC', borderRadius: '8px' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {(stats.riskDistribution || stats.risk_distribution).map((entry, index) => {
                          const level = String(entry.level).toLowerCase();
                          const color = RISK_COLORS[level] || 'var(--primary-accent)';
                          return <Cell key={`bar-${index}`} fill={color} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No risk breakdown available." />
              )}
            </div>
          </div>

          {/* Recent Investigations & Recent Activity */}
          <div className="grid-2">
            {/* Recent Investigations List */}
            <div className="cyber-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Recent Entity Investigations
                </h3>
                <button
                  onClick={() => navigate('/trace/search')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--primary-accent)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  View All <ArrowRight size={14} />
                </button>
              </div>

              {stats.recentInvestigations && stats.recentInvestigations.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {stats.recentInvestigations.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      onClick={() => navigate(`/trace/investigate/${encodeURIComponent(item.id || item.identifier)}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        backgroundColor: '#0D1527',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-accent)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                    >
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.identifier || item.id}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          Type: {item.type} {item.source && `• ${item.source}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <RiskBadge level={item.riskLevel || item.risk_level} score={item.riskScore ?? item.risk_score} isSynthetic={item.isSynthetic} />
                        <ExternalLink size={14} color="var(--text-muted)" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No recent investigations" message="Search an entity to generate an investigation record." />
              )}
            </div>

            {/* Recent Activity Log */}
            <div className="cyber-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Platform Telemetry & Ingestion Log
                </h3>
                <span className="badge badge-low" style={{ fontSize: '10px' }}>Sync Active</span>
              </div>

              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stats.recentActivity.map((act, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#111827',
                        borderLeft: `3px solid ${act.severity === 'critical' ? 'var(--accent-critical)' : 'var(--primary-accent)'}`,
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{act.action || act.title}</span>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{act.timestamp || 'Just now'}</span>
                      </div>
                      <div style={{ color: 'var(--text-primary)' }}>{act.detail || act.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No recent platform telemetry entries." />
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Dashboard;
