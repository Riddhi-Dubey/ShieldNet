import networkx as nx
from typing import Set, Dict, Any, List, Tuple
from collections import deque
from backend.app.schemas.search import ConnectedEntitySummary, CytoscapeGraph
from backend.app.graph.evidence import export_subgraph_to_cytoscape


def multi_hop_traversal(
    G: nx.MultiDiGraph,
    start_entity_id: str,
    max_hops: int = 2
) -> Tuple[List[ConnectedEntitySummary], CytoscapeGraph]:
    """
    Performs multi-hop BFS traversal from a target entity up to max_hops (max 3).
    Returns connected entity summaries and the Cytoscape subgraph.
    """
    if not G.has_node(start_entity_id):
        return [], CytoscapeGraph(nodes=[], edges=[])

    max_hops = max(1, min(max_hops, 3))

    visited_nodes: Set[str] = {start_entity_id}
    queue = deque([(start_entity_id, 0)])
    node_distance: Dict[str, int] = {start_entity_id: 0}

    connected_summaries: List[ConnectedEntitySummary] = []

    # BFS traversal treating edges as bidirectional for exploration
    while queue:
        current, dist = queue.popleft()
        if dist >= max_hops:
            continue

        # Outbound edges
        for _, neighbor, k, data in G.out_edges(current, keys=True, data=True):
            if neighbor not in visited_nodes:
                visited_nodes.add(neighbor)
                node_distance[neighbor] = dist + 1
                queue.append((neighbor, dist + 1))

                n_attrs = G.nodes[neighbor]
                connected_summaries.append(ConnectedEntitySummary(
                    entity_id=neighbor,
                    entity_type=n_attrs.get("entity_type", "UNKNOWN"),
                    identifier=n_attrs.get("identifier", neighbor),
                    relationship_type=data.get("relationship_type", "CONNECTED_TO"),
                    direction="OUTBOUND",
                    confidence=float(data.get("confidence", 1.0)),
                    hops=dist + 1,
                    risk_score=float(n_attrs.get("risk_score", 0.0)),
                    risk_level=n_attrs.get("risk_level", "LOW"),
                    evidence_status=data.get("evidence_status", "UNVERIFIED")
                ))

        # Inbound edges
        for predecessor, _, k, data in G.in_edges(current, keys=True, data=True):
            if predecessor not in visited_nodes:
                visited_nodes.add(predecessor)
                node_distance[predecessor] = dist + 1
                queue.append((predecessor, dist + 1))

                p_attrs = G.nodes[predecessor]
                connected_summaries.append(ConnectedEntitySummary(
                    entity_id=predecessor,
                    entity_type=p_attrs.get("entity_type", "UNKNOWN"),
                    identifier=p_attrs.get("identifier", predecessor),
                    relationship_type=data.get("relationship_type", "CONNECTED_TO"),
                    direction="INBOUND",
                    confidence=float(data.get("confidence", 1.0)),
                    hops=dist + 1,
                    risk_score=float(p_attrs.get("risk_score", 0.0)),
                    risk_level=p_attrs.get("risk_level", "LOW"),
                    evidence_status=data.get("evidence_status", "UNVERIFIED")
                ))

    # Build Cytoscape subgraph
    subgraph_cytoscape = export_subgraph_to_cytoscape(G, list(visited_nodes))
    return connected_summaries, subgraph_cytoscape


def find_transaction_pathways(
    G: nx.MultiDiGraph,
    source_entity_id: str,
    target_entity_id: str,
    cutoff: int = 4
) -> List[List[Dict[str, Any]]]:
    """
    Finds simple directed transaction pathways between two entities in the network.
    """
    if not (G.has_node(source_entity_id) and G.has_node(target_entity_id)):
        return []

    # Convert to simple DiGraph to find simple paths
    simple_di = nx.DiGraph(G)
    pathways = []

    try:
        paths = list(nx.all_simple_paths(simple_di, source_entity_id, target_entity_id, cutoff=cutoff))
        for p in paths[:10]:  # limit to top 10 pathways
            path_details = []
            for i in range(len(p)):
                node_id = p[i]
                node_data = G.nodes[node_id]
                step = {
                    "step": i + 1,
                    "entity_id": node_id,
                    "identifier": node_data.get("identifier"),
                    "entity_type": node_data.get("entity_type"),
                    "risk_score": node_data.get("risk_score")
                }
                path_details.append(step)
            pathways.append(path_details)
    except Exception:
        pass

    return pathways
