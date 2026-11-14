import networkx as nx
from typing import List, Dict, Any


def calculate_centrality_and_rankings(G: nx.MultiDiGraph, top_k: int = 10) -> List[Dict[str, Any]]:
    """
    Computes degree centrality and combines it with risk scores to rank suspicious hub nodes.
    High degree alone does not determine criminality; it indicates investigative priority.
    """
    if G.number_of_nodes() == 0:
        return []

    # Degree centrality on undirected version
    undirected = nx.Graph(G)
    deg_centrality = nx.degree_centrality(undirected)

    ranked_nodes: List[Dict[str, Any]] = []

    for node_id, cent_val in deg_centrality.items():
        node_data = G.nodes[node_id]
        risk_score = float(node_data.get("risk_score", 0.0))
        in_deg = G.in_degree(node_id)
        out_deg = G.out_degree(node_id)
        total_deg = in_deg + out_deg

        # Hub priority: weight of high degree and elevated risk score
        investigative_priority = round((cent_val * 50.0) + (risk_score * 0.5), 2)

        ranked_nodes.append({
            "entity_id": node_id,
            "identifier": node_data.get("identifier"),
            "entity_type": node_data.get("entity_type"),
            "risk_score": risk_score,
            "risk_level": node_data.get("risk_level"),
            "degree_centrality": round(cent_val, 4),
            "in_degree": in_deg,
            "out_degree": out_deg,
            "total_degree": total_deg,
            "investigative_priority": investigative_priority,
            "evidence_status": node_data.get("evidence_status"),
            "source_dataset": node_data.get("source_dataset")
        })

    # Sort by investigative priority descending
    ranked_nodes.sort(key=lambda x: x["investigative_priority"], reverse=True)
    return ranked_nodes[:top_k]
