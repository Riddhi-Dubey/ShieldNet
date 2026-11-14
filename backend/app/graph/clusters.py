import networkx as nx
from typing import List, Dict, Any


def identify_network_clusters(G: nx.MultiDiGraph) -> List[Dict[str, Any]]:
    """
    Identifies connected components (fraud rings/clusters) in the entity graph.
    Returns structured metrics for each component.
    """
    # Convert to undirected graph for connected component analysis
    undirected_G = G.to_undirected()

    components = sorted(nx.connected_components(undirected_G), key=len, reverse=True)
    clusters: List[Dict[str, Any]] = []

    for idx, comp in enumerate(components):
        node_ids = list(comp)
        subG = G.subgraph(node_ids)

        # Aggregate risk and entity types
        scores = [G.nodes[n].get("risk_score", 0.0) for n in node_ids]
        avg_risk = round(sum(scores) / len(scores), 2) if scores else 0.0
        max_risk = max(scores) if scores else 0.0

        types = {}
        for n in node_ids:
            t = G.nodes[n].get("entity_type", "UNKNOWN")
            types[t] = types.get(t, 0) + 1

        clusters.append({
            "cluster_id": f"cluster_{idx + 1}",
            "size": len(node_ids),
            "edge_count": subG.number_of_edges(),
            "average_risk_score": avg_risk,
            "max_risk_score": max_risk,
            "entity_types": types,
            "member_ids": node_ids[:25],  # preview first 25
            "description": (
                f"Connected cluster of {len(node_ids)} entities sharing {subG.number_of_edges()} relationships. "
                f"Average risk score: {avg_risk}/100."
            )
        })

    return clusters
