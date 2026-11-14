import networkx as nx
from typing import Dict, Any, List
from backend.app.schemas.search import (
    CytoscapeGraph,
    CytoscapeNode,
    CytoscapeNodeData,
    CytoscapeEdge,
    CytoscapeEdgeData
)


def export_subgraph_to_cytoscape(G: nx.MultiDiGraph, node_subset: List[str] = None) -> CytoscapeGraph:
    """
    Exports a NetworkX graph or subgraph to Cytoscape-compatible JSON format.
    Every node and edge carries complete evidence and provenance metadata.
    """
    if node_subset is not None:
        subG = G.subgraph(node_subset)
    else:
        subG = G

    nodes: List[CytoscapeNode] = []
    for node_id, attrs in subG.nodes(data=True):
        label = attrs.get("identifier") or attrs.get("normalized_value") or node_id
        nodes.append(CytoscapeNode(
            data=CytoscapeNodeData(
                id=str(node_id),
                label=str(label),
                entity_type=str(attrs.get("entity_type", "UNKNOWN")),
                risk_score=float(attrs.get("risk_score", 0.0)),
                risk_level=str(attrs.get("risk_level", "LOW")),
                source_dataset=str(attrs.get("source_dataset", "UNKNOWN")),
                evidence_status=str(attrs.get("evidence_status", "UNVERIFIED"))
            )
        ))

    edges: List[CytoscapeEdge] = []
    for u, v, k, attrs in subG.edges(keys=True, data=True):
        rel_id = attrs.get("relationship_id") or f"{u}_{v}_{k}"
        rel_type = attrs.get("relationship_type", "CONNECTED_TO")
        source_ds = attrs.get("evidence_source", "UNKNOWN")
        ev_status = attrs.get("evidence_status", "UNVERIFIED")

        explanation = (
            f"Edge links {u[:8]}... to {v[:8]}... via {rel_type} "
            f"(Source: {source_ds}, Status: {ev_status}). Investigative link only."
        )

        edges.append(CytoscapeEdge(
            data=CytoscapeEdgeData(
                id=str(rel_id),
                source=str(u),
                target=str(v),
                relationship_type=str(rel_type),
                confidence=float(attrs.get("confidence", 1.0)),
                evidence_reference=str(rel_id),
                evidence_status=str(ev_status),
                source_dataset=str(source_ds),
                explanation=explanation
            )
        ))

    return CytoscapeGraph(nodes=nodes, edges=edges)
