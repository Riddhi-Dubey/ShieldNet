from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.models.entity import Entity
from backend.app.models.relationship import Relationship
from backend.app.models.report import Report
from backend.app.schemas.search import (
    EntitySearchRequest,
    EntitySearchResponse,
    EntityDetail,
    CytoscapeGraph
)
from backend.app.services.entity_search import search_entity_intelligence
from backend.app.graph.graph_builder import build_networkx_graph
from backend.app.graph.traversal import multi_hop_traversal
from backend.app.graph.clusters import identify_network_clusters
from backend.app.graph.centrality import calculate_centrality_and_rankings
from backend.app.graph.evidence import export_subgraph_to_cytoscape

router = APIRouter(tags=["ScamTrace Intelligence"])


@router.post("/search", response_model=EntitySearchResponse)
def search_entities(request: EntitySearchRequest, db: Session = Depends(get_db)):
    """
    Investigative search across Phone numbers, URLs/domains, Bank accounts, and Crypto wallets.
    Supports auto-type detection, normalisation, multi-hop graph retrieval, and risk scoring.
    """
    if len(request.identifier.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identifier query must be at least 2 characters"
        )

    return search_entity_intelligence(db, request)


@router.get("/entities/{entity_id}", response_model=EntityDetail)
def get_entity_by_id(entity_id: str, db: Session = Depends(get_db)):
    """Retrieves full profile of a single entity by its identifier ID, normalized value, or raw identifier."""
    entity = db.query(Entity).filter(
        (Entity.entity_id == entity_id) |
        (Entity.identifier == entity_id) |
        (Entity.normalized_value == entity_id)
    ).first()
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entity not found in threat database for '{entity_id}'")

    report_count = db.query(Report).filter(Report.entity_id == entity.entity_id).count()
    detail = EntityDetail.model_validate(entity)
    detail.reportCount = report_count
    return detail


@router.get("/entities/{entity_id}/connections")
def get_entity_connections(entity_id: str, db: Session = Depends(get_db)):
    """Retrieves all direct 1-hop inbound and outbound relationships for an entity."""
    entity = db.query(Entity).filter(
        (Entity.entity_id == entity_id) |
        (Entity.identifier == entity_id) |
        (Entity.normalized_value == entity_id)
    ).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    actual_id = entity.entity_id
    outbound = db.query(Relationship).filter(Relationship.source_entity_id == actual_id).all()
    inbound = db.query(Relationship).filter(Relationship.target_entity_id == actual_id).all()

    connections_list = []
    # Collect targets
    for r in outbound:
        other = db.query(Entity).filter(Entity.entity_id == r.target_entity_id).first()
        target_name = other.identifier if other else r.target_entity_id
        target_type = (other.entity_type if other else "Unknown").lower()
        connections_list.append({
            "id": r.target_entity_id,
            "target": target_name,
            "identifier": target_name,
            "type": target_type,
            "relation": r.relationship_type.replace("_", " ").title(),
            "riskLevel": other.risk_level if other else "MEDIUM",
            "riskScore": other.risk_score if other else 50.0,
            "confidence": r.confidence,
            "evidenceStatus": r.evidence_status,
            "direction": "OUTBOUND"
        })

    for r in inbound:
        other = db.query(Entity).filter(Entity.entity_id == r.source_entity_id).first()
        target_name = other.identifier if other else r.source_entity_id
        target_type = (other.entity_type if other else "Unknown").lower()
        connections_list.append({
            "id": r.source_entity_id,
            "target": target_name,
            "identifier": target_name,
            "type": target_type,
            "relation": f"Received From ({r.relationship_type.replace('_', ' ').title()})",
            "riskLevel": other.risk_level if other else "MEDIUM",
            "riskScore": other.risk_score if other else 50.0,
            "confidence": r.confidence,
            "evidenceStatus": r.evidence_status,
            "direction": "INBOUND"
        })

    return {
        "entity_id": actual_id,
        "identifier": entity.identifier,
        "outbound_connections": [
            {
                "target_entity_id": r.target_entity_id,
                "relationship_type": r.relationship_type,
                "confidence": r.confidence,
                "evidence_status": r.evidence_status,
                "evidence_source": r.evidence_source
            }
            for r in outbound
        ],
        "inbound_connections": [
            {
                "source_entity_id": r.source_entity_id,
                "relationship_type": r.relationship_type,
                "confidence": r.confidence,
                "evidence_status": r.evidence_status,
                "evidence_source": r.evidence_source
            }
            for r in inbound
        ],
        "connections": connections_list
    }


@router.get("/entities/{entity_id}/graph", response_model=CytoscapeGraph)
def get_entity_subgraph(
    entity_id: str,
    hops: int = Query(2, ge=1, le=3),
    db: Session = Depends(get_db)
):
    """
    Returns a Cytoscape-compatible JSON subgraph representing the multi-hop neighborhood
    centered around the specified entity.
    """
    entity = db.query(Entity).filter(
        (Entity.entity_id == entity_id) |
        (Entity.identifier == entity_id) |
        (Entity.normalized_value == entity_id)
    ).first()

    lookup_id = entity.entity_id if entity else entity_id

    G = build_networkx_graph(db)
    if not G.has_node(lookup_id):
        raise HTTPException(status_code=404, detail="Entity not found in network graph")

    _, cytoscape_graph = multi_hop_traversal(G, lookup_id, max_hops=hops)
    return cytoscape_graph


@router.get("/network/overview", response_model=CytoscapeGraph)
def get_network_overview(
    max_nodes: int = Query(100, ge=10, le=500),
    db: Session = Depends(get_db)
):
    """
    Returns global Cytoscape network overview for investigative mapping.
    Capped at max_nodes to ensure performant browser rendering.
    """
    G = build_networkx_graph(db)
    if G.number_of_nodes() == 0:
        return CytoscapeGraph(nodes=[], edges=[])

    # If graph is larger than max_nodes, select highest degree nodes
    if G.number_of_nodes() > max_nodes:
        ranked = calculate_centrality_and_rankings(G, top_k=max_nodes)
        selected_ids = [r["entity_id"] for r in ranked]
        return export_subgraph_to_cytoscape(G, selected_ids)

    return export_subgraph_to_cytoscape(G)


@router.get("/network/clusters")
def get_network_clusters(db: Session = Depends(get_db)):
    """
    Detects and returns all connected fraud components / scam clusters in the network graph.
    """
    G = build_networkx_graph(db)
    clusters = identify_network_clusters(G)
    return {
        "total_clusters": len(clusters),
        "clusters": clusters
    }
