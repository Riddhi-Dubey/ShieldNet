from sqlalchemy.orm import Session
from typing import Optional
from backend.app.models.entity import Entity
from backend.app.models.report import Report
from backend.app.schemas.search import (
    EntitySearchRequest,
    EntitySearchResponse,
    EntityDetail,
    ReportSummary
)
from backend.app.security.validation import normalize_identifier
from backend.app.graph.graph_builder import build_networkx_graph
from backend.app.graph.traversal import multi_hop_traversal
from backend.app.services.risk_scoring import evaluate_entity_risk, calculate_risk_level


def search_entity_intelligence(db: Session, request: EntitySearchRequest) -> EntitySearchResponse:
    """
    Core search engine for ScamTrace.
    Normalizes identifier, queries threat database, runs multi-hop graph traversal,
    and returns Cytoscape visualization data with investigative warnings.
    """
    raw_id = request.identifier.strip()
    req_type = request.entity_type or "AUTO"

    detected_type, normalized_val = normalize_identifier(req_type, raw_id)

    # Search entity by normalized_value or identifier
    entity = db.query(Entity).filter(
        (Entity.normalized_value == normalized_val) |
        (Entity.identifier == raw_id)
    ).first()

    warning_text = (
        "Investigative Notice: Graph connections and risk scores indicate investigative correlation, "
        "not legal proof of common criminal ownership. Forensic verification is mandatory before action."
    )

    if not entity:
        # Entity not found in database: DO NOT classify as safe!
        return EntitySearchResponse(
            found=False,
            searched_identifier=raw_id,
            detected_type=detected_type,
            normalized_value=normalized_val,
            message=(
                f"No matching records found in threat intelligence database for {detected_type}: '{normalized_val}'. "
                "IMPORTANT: An unknown identifier must NOT be assumed to be safe or verified legitimate."
            ),
            entity=None,
            risk_score=None,
            risk_level=None,
            risk_explanation={
                "status": "UNKNOWN_ENTITY",
                "notice": "Unknown entities have an undetermined risk posture. Do not assume zero risk."
            },
            connected_entities=[],
            related_reports=[],
            graph=None,
            investigative_warning=warning_text,
            results=[]
        )

    # Retrieve related reports
    reports = db.query(Report).filter(Report.entity_id == entity.entity_id).all()
    report_summaries = [ReportSummary.model_validate(r) for r in reports]

    # Build graph and run multi-hop traversal
    G = build_networkx_graph(db)
    connected_entities, cytoscape_graph = multi_hop_traversal(
        G,
        entity.entity_id,
        max_hops=request.max_hops or 2
    )

    # Evaluate dynamic risk breakdown
    high_risk_neighbors = sum(1 for c in connected_entities if c.risk_score >= 60.0)
    risk_eval = evaluate_entity_risk(
        is_verified_malicious=(entity.evidence_status == "VERIFIED"),
        is_dataset_fraud=(entity.source_dataset in ["PAYSIM_SIMULATED", "ELLIPTIC_BITCOIN", "PHISHTANK"]),
        report_count=len(reports),
        connected_high_risk_count=high_risk_neighbors,
        evidence_status=entity.evidence_status
    )

    # Update entity risk score in database if modified
    dynamic_score = max(entity.risk_score, risk_eval["final_score"])
    entity.risk_score = dynamic_score
    entity.risk_level = calculate_risk_level(dynamic_score)
    db.commit()

    is_synth = bool(entity.source_dataset and "synthetic" in entity.source_dataset.lower() or entity.evidence_status == "SYNTHETIC")
    formatted_result_item = {
        "id": entity.entity_id,
        "entity_id": entity.entity_id,
        "identifier": entity.identifier,
        "type": entity.entity_type,
        "entity_type": entity.entity_type,
        "riskLevel": entity.risk_level,
        "risk_level": entity.risk_level,
        "riskScore": entity.risk_score,
        "risk_score": entity.risk_score,
        "sourceDataset": entity.source_dataset,
        "source_dataset": entity.source_dataset,
        "evidenceStatus": entity.evidence_status,
        "evidence_status": entity.evidence_status,
        "isSynthetic": is_synth,
        "reportCount": len(reports),
        "connectedEntitiesCount": len(connected_entities),
        "connectedEntities": [c.identifier for c in connected_entities],
    }

    return EntitySearchResponse(
        found=True,
        searched_identifier=raw_id,
        detected_type=entity.entity_type,
        normalized_value=entity.normalized_value,
        message=f"Entity identified in threat database with risk level {entity.risk_level}.",
        entity=EntityDetail.model_validate(entity),
        risk_score=entity.risk_score,
        risk_level=entity.risk_level,
        risk_explanation=risk_eval,
        connected_entities=connected_entities,
        related_reports=report_summaries,
        graph=cytoscape_graph,
        investigative_warning=warning_text,
        results=[formatted_result_item]
    )
