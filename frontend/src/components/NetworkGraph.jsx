import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';

const ENTITY_COLORS = {
  phone: { bg: '#E0F2FE', border: '#0284C7', text: '#0369A1' },        // Soft Blue
  url: { bg: '#FEE2E2', border: '#DC2626', text: '#B91C1C' },          // Soft Red/Pink
  bank: { bg: '#FEF3C7', border: '#D97706', text: '#B45309' },         // Soft Amber
  wallet: { bg: '#F3E8FF', border: '#7C3AED', text: '#6D28D9' },       // Soft Violet
  default: { bg: '#F1F5F9', border: '#64748B', text: '#475569' },
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
        // Base Node Style for Light Theme
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'font-size': '11px',
            'font-family': 'JetBrains Mono, monospace',
            'font-weight': '600',
            'color': '#202C35',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': (ele) => (ENTITY_COLORS[ele.data('type')] || ENTITY_COLORS.default).bg,
            'width': 38,
            'height': 38,
            'border-width': 2.5,
            'border-color': (ele) => (ENTITY_COLORS[ele.data('type')] || ENTITY_COLORS.default).border,
            'text-background-opacity': 0.95,
            'text-background-color': '#FFFFFF',
            'text-background-padding': 3,
            'text-background-shape': 'roundrectangle',
            'text-border-width': 1,
            'text-border-color': '#E2E9E6',
            'text-border-opacity': 0.8,
          },
        },
        // Synthetic Nodes - dashed border & hexagon shape
        {
          selector: 'node[?isSynthetic]',
          style: {
            'border-style': 'dashed',
            'border-width': 3,
            'border-color': '#7C3AED',
            'shape': 'hexagon',
          },
        },
        // High Risk Nodes - highlighted border
        {
          selector: 'node[riskLevel = "critical"], node[riskLevel = "high"]',
          style: {
            'border-color': '#B91C1C',
            'border-width': 3,
            'background-color': '#FEE2E2',
          },
        },
        // Selected Node Highlight
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#397F78',
            'width': 46,
            'height': 46,
            'shadow-blur': 12,
            'shadow-color': 'rgba(57, 127, 120, 0.4)',
            'shadow-opacity': 0.8,
          },
        },
        // Base Edge Style for Light Theme
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#94A3B8',
            'target-arrow-color': '#64748B',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(relation)',
            'font-size': '9.5px',
            'font-weight': '500',
            'color': '#475569',
            'text-background-opacity': 0.95,
            'text-background-color': '#FFFFFF',
            'text-background-padding': 2.5,
            'text-background-shape': 'roundrectangle',
            'text-border-width': 1,
            'text-border-color': '#E2E8F0',
          },
        },
        // Synthetic Edges
        {
          selector: 'edge[?isSynthetic]',
          style: {
            'line-style': 'dashed',
            'line-color': '#8B5CF6',
            'target-arrow-color': '#8B5CF6',
          },
        },
        // Edge Selection
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#397F78',
            'target-arrow-color': '#397F78',
            'width': 3.5,
          },
        },
        // Dimmed elements when highlighting
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.18,
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
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '520px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', backgroundColor: '#F8FAF9', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
      {/* Cytoscape Canvas Container */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '520px' }} />

      {/* Floating Toolbar Controls */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          display: 'flex',
          gap: '6px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '5px',
          zIndex: 10,
          boxShadow: 'var(--shadow-sm)',
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
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px',
          fontSize: '11.5px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center',
          flexWrap: 'wrap',
          zIndex: 10,
          boxShadow: 'var(--shadow-sm)',
          color: 'var(--text-primary)',
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: ENTITY_COLORS.phone.bg, border: `2px solid ${ENTITY_COLORS.phone.border}` }} />
          <span>Phone</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: ENTITY_COLORS.url.bg, border: `2px solid ${ENTITY_COLORS.url.border}` }} />
          <span>URL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: ENTITY_COLORS.bank.bg, border: `2px solid ${ENTITY_COLORS.bank.border}` }} />
          <span>Bank/UPI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '11px', height: '11px', borderRadius: '50%', backgroundColor: ENTITY_COLORS.wallet.bg, border: `2px solid ${ENTITY_COLORS.wallet.border}` }} />
          <span>Crypto Wallet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid var(--border-color)', paddingLeft: '10px' }}>
          <span style={{ width: '11px', height: '11px', border: '2px dashed #7C3AED', borderRadius: '2px', backgroundColor: '#F3E8FF' }} />
          <span>Synthetic</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;
