import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Filter, Sparkles, Layers } from 'lucide-react';

const ENTITY_COLORS = {
  phone: '#38BDF8', // Blue
  url: '#FB923C',   // Orange
  bank: '#A78BFA',  // Purple
  wallet: '#34D399', // Green
  default: '#94A3B8',
};

export const NetworkGraph = ({
  elements = [],
  onNodeSelect,
  onEdgeSelect,
  selectedNodeId,
  highlightClusterId,
  typeFilter = 'all',
  riskFilter = 'all',
  evidenceFilter = 'all',
}) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [layoutName, setLayoutName] = useState('cose');

  // Initialize and update Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Filter elements based on active filters
    const filteredElements = elements.filter((el) => {
      const data = el.data || {};
      const isNode = !data.source;

      if (isNode) {
        if (typeFilter !== 'all' && data.type !== typeFilter) return false;
        if (riskFilter !== 'all' && data.riskLevel?.toLowerCase() !== riskFilter.toLowerCase()) return false;
        if (evidenceFilter === 'verified' && (data.isSynthetic || data.sourceDataset?.includes('Synthetic'))) return false;
        if (evidenceFilter === 'synthetic' && !data.isSynthetic && !data.sourceDataset?.includes('Synthetic')) return false;
      }
      return true;
    });

    // Destroy existing instance if any
    if (cyRef.current) {
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: filteredElements,
      boxSelectionEnabled: false,
      autounselectify: false,
      style: [
        // Base Node Style
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'font-size': '11px',
            'font-family': 'JetBrains Mono, monospace',
            'color': '#F8FAFC',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': (ele) => ENTITY_COLORS[ele.data('type')] || ENTITY_COLORS.default,
            'width': 36,
            'height': 36,
            'border-width': 2,
            'border-color': '#1E293B',
            'text-background-opacity': 0.7,
            'text-background-color': '#0B1020',
            'text-background-padding': 3,
            'text-background-shape': 'roundrectangle',
          },
        },
        // Synthetic Nodes - dashed border & diamond/hexagon shape
        {
          selector: 'node[?isSynthetic]',
          style: {
            'border-style': 'dashed',
            'border-width': 3,
            'border-color': '#A78BFA',
            'shape': 'hexagon',
          },
        },
        // High Risk Nodes - pulsing ring style
        {
          selector: 'node[riskLevel = "critical"], node[riskLevel = "high"]',
          style: {
            'border-color': '#F87171',
            'border-width': 3,
          },
        },
        // Selected Node Highlight
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#38BDF8',
            'shadow-blur': 20,
            'shadow-color': '#38BDF8',
            'shadow-opacity': 0.8,
            'width': 44,
            'height': 44,
          },
        },
        // Base Edge Style
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#334155',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(relation)',
            'font-size': '9px',
            'color': '#94A3B8',
            'text-background-opacity': 0.85,
            'text-background-color': '#0B1020',
            'text-background-padding': 2,
            'text-background-shape': 'roundrectangle',
          },
        },
        // Synthetic Edges
        {
          selector: 'edge[?isSynthetic]',
          style: {
            'line-style': 'dashed',
            'line-color': '#7C3AED',
            'target-arrow-color': '#7C3AED',
          },
        },
        // Edge Selection
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#38BDF8',
            'target-arrow-color': '#38BDF8',
            'width': 3,
          },
        },
        // Dimmed elements when highlighting
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.15,
          },
        },
        // Highlighted elements
        {
          selector: '.highlighted',
          style: {
            'opacity': 1,
            'z-index': 999,
          },
        },
      ],
      layout: {
        name: layoutName,
        animate: true,
        animationDuration: 500,
        padding: 50,
      },
    });

    // Event Listeners
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (onNodeSelect) {
        onNodeSelect(node.data());
      }

      // Highlight direct neighbors
      cy.elements().removeClass('highlighted dimmed');
      const neighborhood = node.closedNeighborhood();
      cy.elements().difference(neighborhood).addClass('dimmed');
      neighborhood.addClass('highlighted');
    });

    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target;
      if (onEdgeSelect) {
        onEdgeSelect(edge.data());
      }
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted dimmed');
        if (onNodeSelect) onNodeSelect(null);
        if (onEdgeSelect) onEdgeSelect(null);
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [elements, layoutName, typeFilter, riskFilter, evidenceFilter]);

  // Center on selected node if passed from parent
  useEffect(() => {
    if (!cyRef.current || !selectedNodeId) return;
    const cy = cyRef.current;
    const targetNode = cy.$id(selectedNodeId);
    if (targetNode.length > 0) {
      cy.center(targetNode);
      cy.zoom({ level: 1.3, position: targetNode.position() });
      targetNode.select();
    }
  }, [selectedNodeId]);

  // Controls Handlers
  const handleZoomIn = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current && cyRef.current.fit(undefined, 50);
  const handleResetLayout = () => {
    if (cyRef.current) {
      cyRef.current.layout({ name: layoutName, animate: true, padding: 50 }).run();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', backgroundColor: '#090E1A', border: '1px solid var(--border-color)' }}>
      {/* Cytoscape Canvas Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '520px' }} />

      {/* Floating Toolbar Controls */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          backgroundColor: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '6px',
          zIndex: 10,
        }}
      >
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
        >
          <ZoomOut size={18} />
        </button>

        <button
          onClick={handleFit}
          title="Fit to Screen"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
        >
          <Maximize2 size={18} />
        </button>

        <button
          onClick={handleResetLayout}
          title="Re-run Layout"
          style={{ background: 'transparent', border: 'none', color: 'var(--primary-accent)', cursor: 'pointer', padding: '6px', borderRadius: '4px' }}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Graph Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          fontSize: '11px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: ENTITY_COLORS.phone }} />
          <span>Phone</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: ENTITY_COLORS.url }} />
          <span>URL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: ENTITY_COLORS.bank }} />
          <span>Bank/UPI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: ENTITY_COLORS.wallet }} />
          <span>Crypto Wallet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid var(--border-color)', paddingLeft: '10px' }}>
          <span style={{ width: '10px', height: '10px', border: '2px dashed #A78BFA', borderRadius: '2px' }} />
          <span>Synthetic</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;
