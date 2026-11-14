import pytest
from sqlalchemy.orm import Session
from backend.app.graph.graph_builder import build_networkx_graph
from backend.app.graph.traversal import multi_hop_traversal, find_transaction_pathways
from backend.app.graph.clusters import identify_network_clusters
from backend.app.graph.centrality import calculate_centrality_and_rankings
from backend.app.security.validation import generate_stable_entity_id, normalize_identifier


def test_graph_builder_and_traversal(db_session: Session):
    G = build_networkx_graph(db_session)
    assert G.number_of_nodes() >= 30
    assert G.number_of_edges() >= 25

    # Target entity: +91 98765 00001 (Phone)
    _, norm_val = normalize_identifier("PHONE", "+91 98765 00001")
    start_id = generate_stable_entity_id("PHONE", norm_val)

    # 2-hop traversal
    connected, cytoscape = multi_hop_traversal(G, start_id, max_hops=2)
    assert len(connected) > 0
    assert len(cytoscape.nodes) > 1
    assert len(cytoscape.edges) > 0

    # Ensure Cytoscape edge metadata has provenance fields
    edge_sample = cytoscape.edges[0].data
    assert edge_sample.relationship_type is not None
    assert edge_sample.evidence_status is not None
    assert edge_sample.source_dataset is not None
    assert edge_sample.explanation is not None


def test_network_clusters_and_centrality(db_session: Session):
    G = build_networkx_graph(db_session)

    # Identify connected components
    clusters = identify_network_clusters(G)
    assert len(clusters) >= 2
    # At least one cluster should have size >= 3
    assert any(c["size"] >= 3 for c in clusters)

    # Centrality ranking
    ranked = calculate_centrality_and_rankings(G, top_k=5)
    assert len(ranked) == 5
    assert ranked[0]["investigative_priority"] >= ranked[-1]["investigative_priority"]
    assert "degree_centrality" in ranked[0]


def test_transaction_pathways(db_session: Session):
    G = build_networkx_graph(db_session)

    # Check pathway from SIMBANK9001001 to SIMBANK9001004
    _, s_norm = normalize_identifier("BANK_ACCOUNT", "SIMBANK9001001")
    _, t_norm = normalize_identifier("BANK_ACCOUNT", "SIMBANK9001004")
    sid = generate_stable_entity_id("BANK_ACCOUNT", s_norm)
    tid = generate_stable_entity_id("BANK_ACCOUNT", t_norm)

    pathways = find_transaction_pathways(G, sid, tid, cutoff=3)
    assert len(pathways) > 0
    assert pathways[0][0]["entity_id"] == sid
    assert pathways[0][-1]["entity_id"] == tid
