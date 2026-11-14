import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Share2, 
  Filter, 
  Layers, 
  Search, 
  Sparkles, 
  Maximize2, 
  ExternalLink, 
  AlertTriangle, 
  X,
  Info,
  ShieldCheck,
  RefreshCw,
  GitFork
} from 'lucide-react';
import { getNetworkOverview, getNetworkClusters, extractErrorMessage } from '../services/api';
import NetworkGraph from '../components/NetworkGraph';
import RiskBadge from '../components/RiskBadge';
import { LoadingState, ErrorState } from '../components/LoadingState';

export const NetworkExplorer = () => {
  const navigate = useNavigate();

  const [elements, setElements] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [typeFilter, setTypeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [evidenceFilter, setEvidenceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item states
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [highlightCluster, setHighlightCluster] = useState(null);

  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [overviewData, clusterData] = await Promise.all([
        getNetworkOverview(),
        getNetworkClusters().catch(() => []),
      ]);

      // Normalize elements format: backend might return { nodes: [...], edges: [...] } or direct Cytoscape array
      let cytoscapeElements = [];
      if (Array.isArray(overviewData)) {
        cytoscapeElements = overviewData;
      } else if (overviewData && overviewData.elements) {
        cytoscapeElements = overviewData.elements;
      } else if (overviewData && (overviewData.nodes || overviewData.edges)) {
        const nodes = (overviewData.nodes || []).map((n) => {
          const d = n.data || n;
          const rawType = String(d.type || d.entity_type || 'phone').toLowerCase();
          const cleanType = rawType.includes('phone') ? 'phone' :
                            rawType.includes('url') || rawType.includes('domain') ? 'url' :
                            rawType.includes('bank') ? 'bank' :
                            rawType.includes('wallet') || rawType.includes('crypto') ? 'wallet' : 'phone';
          const isSynth = Boolean(d.isSynthetic || d.source_dataset?.toLowerCase().includes('synthetic') || d.evidence_status === 'SYNTHETIC');

          return {
            data: {
              ...d,
              id: d.id || d.identifier,
              label: d.label || d.identifier || d.id,
              type: cleanType,
              entity_type: d.entity_type || cleanType,
              riskLevel: String(d.riskLevel || d.risk_level || 'medium').toLowerCase(),
              riskScore: d.riskScore ?? d.risk_score ?? 0,
              isSynthetic: isSynth,
              sourceDataset: d.sourceDataset || d.source_dataset || d.source,
              evidenceStatus: d.evidenceStatus || d.evidence_status,
              clusterId: d.clusterId || d.cluster_id,
            },
          };
        });

        const edges = (overviewData.edges || []).map((e, idx) => {
          const d = e.data || e;
          return {
            data: {
              ...d,
              id: d.id || `e_${idx}`,
              source: d.source,
              target: d.target,
              relation: d.relation || d.relationship_type || d.label || 'connected_to',
              amount: d.amount,
              isSynthetic: Boolean(d.isSynthetic || d.source_dataset?.toLowerCase().includes('synthetic') || d.evidence_status === 'SYNTHETIC'),
            },
          };
        });

        cytoscapeElements = [...nodes, ...edges];
      }

      setElements(cytoscapeElements);
      setClusters(Array.isArray(clusterData) ? clusterData : clusterData?.clusters || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  // Filter or search centring
  const handleNodeSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const match = elements.find(
      (el) =>
        el.data &&
        !el.data.source &&
        (el.data.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          el.data.id?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (match) {
      setSelectedNode(match.data);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Share2 size={18} style={{ color: 'var(--accent-purple)' }} />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ScamTrace Graph Visualizer
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Syndicated Threat Network Explorer
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Interactive multi-hop graph mapping communication hubs, lookalike domains, mule bank accounts, and laundering trails.
          </p>
        </div>

        {/* Refresh & Reset */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchGraphData} className="btn btn-secondary" style={{ fontSize: '12px' }}>
            <RefreshCw size={14} /> Reload Graph
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div
        className="cyber-card"
        style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: '#0F172A',
        }}
      >
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Filter size={14} />
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select"
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
            >
              <option value="all">All Types</option>
              <option value="phone">Phones Only</option>
              <option value="url">URLs Only</option>
              <option value="bank">Bank / UPI</option>
              <option value="wallet">Crypto Wallets</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="form-select"
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Evidence:</span>
            <select
              value={evidenceFilter}
              onChange={(e) => setEvidenceFilter(e.target.value)}
              className="form-select"
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto' }}
            >
              <option value="all">All Evidence</option>
              <option value="verified">Verified Records</option>
              <option value="synthetic">Synthetic Patterns</option>
            </select>
          </div>
        </div>

        {/* Graph Search Box */}
        <form onSubmit={handleNodeSearch} style={{ display: 'flex', gap: '8px', minWidth: '260px' }}>
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Focus node by label/ID..."
            style={{ padding: '6px 12px', fontSize: '12px' }}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
            <Search size={14} />
          </button>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title="Failed to Load Network Graph"
          message={error}
          onRetry={fetchGraphData}
        />
      )}

      {/* Main Canvas & Details Drawer */}
      {loading ? (
        <LoadingState message="Constructing network topology from /api/network/overview..." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedNode || selectedEdge ? '1fr 340px' : '1fr', gap: '20px', minHeight: '620px' }}>
          {/* Cytoscape Canvas */}
          <div style={{ height: '620px' }}>
            <NetworkGraph
              elements={elements}
              onNodeSelect={setSelectedNode}
              onEdgeSelect={setSelectedEdge}
              selectedNodeId={selectedNode?.id}
              typeFilter={typeFilter}
              riskFilter={riskFilter}
              evidenceFilter={evidenceFilter}
            />
          </div>

          {/* Node / Edge Details Drawer */}
          {(selectedNode || selectedEdge) && (
            <div
              className="cyber-card"
              style={{
                height: '620px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px',
                backgroundColor: '#0F172A',
                borderLeft: '2px solid var(--primary-accent)',
              }}
            >
              <div>
                {/* Header with Close */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--primary-accent)', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {selectedNode ? 'Node Details' : 'Relationship Details'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedNode(null);
                      setSelectedEdge(null);
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Node Details Content */}
                {selectedNode && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>IDENTIFIER</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                        {selectedNode.label || selectedNode.id}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <RiskBadge level={selectedNode.riskLevel} score={selectedNode.riskScore} isSynthetic={selectedNode.isSynthetic} />
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {selectedNode.type}
                      </span>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>SOURCE DATASET</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedNode.sourceDataset || 'Intelligence Registry'}</span>
                      </div>

                      {selectedNode.clusterId && (
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>CLUSTER ID</span>
                          <span style={{ color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>#{selectedNode.clusterId}</span>
                        </div>
                      )}

                      {selectedNode.notes && (
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>ANALYSIS NOTE</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{selectedNode.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Edge Details Content */}
                {selectedEdge && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>RELATIONSHIP TYPE</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-accent)' }}>
                        {selectedEdge.relation || 'Connected'}
                      </div>
                    </div>

                    <div style={{ backgroundColor: '#111827', padding: '12px', borderRadius: '6px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Source: </span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{selectedEdge.source}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Target: </span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{selectedEdge.target}</span>
                      </div>
                      {selectedEdge.amount && (
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Transfer Amount: </span>
                          <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>₹{selectedEdge.amount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {selectedEdge.isSynthetic && (
                      <span className="badge badge-synthetic" style={{ alignSelf: 'flex-start' }}>
                        Synthetic Connection
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedNode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={() => navigate(`/trace/investigate/${encodeURIComponent(selectedNode.id || selectedNode.label)}`)}
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '13px' }}
                  >
                    Deep Entity Investigation <ExternalLink size={14} />
                  </button>
                  <button
                    onClick={() => navigate('/trace/cases')}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '12px' }}
                  >
                    Open in Case Workspace
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Known Syndicated Clusters Preview Strip */}
      {clusters && clusters.length > 0 && (
        <div className="cyber-card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Layers size={16} style={{ color: 'var(--accent-orange)' }} />
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Detected Fraud Syndication Clusters ({clusters.length})
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {clusters.map((c, idx) => (
              <div
                key={c.id || idx}
                style={{
                  padding: '12px 14px',
                  backgroundColor: '#0D1527',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name || `Cluster #${c.id || idx + 1}`}</span>
                  <RiskBadge level={c.riskLevel || 'high'} size="sm" />
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>{c.description || `${c.memberCount || c.nodes?.length || 0} coordinated entities`}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkExplorer;
