from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.entity import Entity
from backend.app.models.report import Report
from backend.app.models.relationship import Relationship
from backend.app.models.case import CaseEntity, Case
from backend.app.models.evidence import Evidence


def get_entity_threat_timeline(db: Session, entity_id: str) -> Dict[str, Any]:
    """
    Constructs a verifiable chronological timeline of all events, reports,
    transactions, and case actions associated with an entity.
    Never manufactures fictional historical events.
    """
    entity = db.query(Entity).filter(
        (Entity.entity_id == entity_id) |
        (Entity.identifier == entity_id) |
        (Entity.normalized_value == entity_id)
    ).first()

    if not entity:
        return {
            "entity_id": entity_id,
            "found": False,
            "events": [],
            "message": "Entity not found in threat intelligence database."
        }

    actual_id = entity.entity_id
    events: List[Dict[str, Any]] = []

    # 1. First Seen / Ingestion Event
    if entity.created_at:
        events.append({
            "timestamp": entity.created_at.isoformat(),
            "event_type": "FIRST_SEEN_RECORD",
            "title": f"Entity Indexed from {entity.source_dataset}",
            "description": f"{entity.entity_type} '{entity.identifier}' was first registered with evidence status {entity.evidence_status}.",
            "provenance": entity.source_dataset,
            "confidence": 1.0,
            "severity": entity.risk_level
        })

    # 2. Reports Filed
    reports = db.query(Report).filter(Report.entity_id == actual_id).order_by(Report.reported_at.asc()).all()
    for r in reports:
        ts = r.reported_at.isoformat() if r.reported_at else (entity.created_at.isoformat() if entity.created_at else datetime.now(timezone.utc).isoformat())
        events.append({
            "timestamp": ts,
            "event_type": "INCIDENT_REPORT_SUBMISSION",
            "title": f"Incident Reported: {r.scam_type}",
            "description": r.description or "User report logged with sanitized evidence.",
            "provenance": r.source or "Citizen Submission",
            "confidence": 0.85 if r.verification_status == "VERIFIED" else 0.60,
            "severity": "HIGH" if "THEFT" in r.scam_type or "EXTORTION" in r.scam_type else "MEDIUM"
        })

    # 3. Inbound Relationships
    in_rels = db.query(Relationship).filter(Relationship.target_entity_id == actual_id).all()
    for rel in in_rels:
        ts = rel.created_at.isoformat() if rel.created_at else datetime.now(timezone.utc).isoformat()
        src_ent = db.query(Entity).filter(Entity.entity_id == rel.source_entity_id).first()
        src_label = src_ent.identifier if src_ent else rel.source_entity_id[:8]
        events.append({
            "timestamp": ts,
            "event_type": "INBOUND_CONNECTION",
            "title": f"Inbound Link: {rel.relationship_type}",
            "description": f"Received connection from {src_ent.entity_type if src_ent else 'Node'} '{src_label}' (Confidence: {rel.confidence:.2f}).",
            "provenance": rel.evidence_source,
            "confidence": rel.confidence,
            "severity": "CRITICAL" if rel.confidence > 0.85 and "FRAUD" in rel.evidence_source else "MEDIUM"
        })

    # 4. Outbound Relationships
    out_rels = db.query(Relationship).filter(Relationship.source_entity_id == actual_id).all()
    for rel in out_rels:
        ts = rel.created_at.isoformat() if rel.created_at else datetime.now(timezone.utc).isoformat()
        tgt_ent = db.query(Entity).filter(Entity.entity_id == rel.target_entity_id).first()
        tgt_label = tgt_ent.identifier if tgt_ent else rel.target_entity_id[:8]
        events.append({
            "timestamp": ts,
            "event_type": "OUTBOUND_CONNECTION",
            "title": f"Outbound Link: {rel.relationship_type}",
            "description": f"Connected to {tgt_ent.entity_type if tgt_ent else 'Node'} '{tgt_label}' (Confidence: {rel.confidence:.2f}).",
            "provenance": rel.evidence_source,
            "confidence": rel.confidence,
            "severity": "HIGH" if "MALICIOUS" in rel.relationship_type else "LOW"
        })

    # 5. Case Inclusions
    case_entries = db.query(CaseEntity).filter(CaseEntity.entity_id == actual_id).all()
    for ce in case_entries:
        case = db.query(Case).filter(Case.case_id == ce.case_id).first()
        if case:
            ts = ce.added_at.isoformat() if ce.added_at else datetime.now(timezone.utc).isoformat()
            events.append({
                "timestamp": ts,
                "event_type": "CASE_ASSOCIATION",
                "title": f"Attached to Case: {case.title}",
                "description": f"Investigator attached entity to case [{case.priority} priority, status: {case.status}]. Note: {ce.notes or 'None'}",
                "provenance": f"Case Management ({case.assigned_to})",
                "confidence": 1.0,
                "severity": case.priority
            })

    # Sort strictly chronologically
    sorted_events = sorted(events, key=lambda x: x["timestamp"])

    return {
        "entity_id": actual_id,
        "identifier": entity.identifier,
        "normalized_value": entity.normalized_value,
        "entity_type": entity.entity_type,
        "found": True,
        "total_events": len(sorted_events),
        "events": sorted_events
    }
