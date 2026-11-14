import io
import csv
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.app.models.entity import Entity
from backend.app.models.report import Report
from backend.app.models.relationship import Relationship
from backend.app.graph.graph_builder import build_networkx_graph
from backend.app.graph.traversal import multi_hop_traversal


def generate_entity_investigation_data(db: Session, entity_id: str) -> Dict[str, Any]:
    """Compiles complete verifiable evidence and intelligence for an entity."""
    entity = db.query(Entity).filter(
        (Entity.entity_id == entity_id) |
        (Entity.identifier == entity_id) |
        (Entity.normalized_value == entity_id)
    ).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found in threat database")

    actual_id = entity.entity_id
    reports = db.query(Report).filter(Report.entity_id == actual_id).all()
    out_rels = db.query(Relationship).filter(Relationship.source_entity_id == actual_id).all()
    in_rels = db.query(Relationship).filter(Relationship.target_entity_id == actual_id).all()

    # Graph multi-hop
    G = build_networkx_graph(db)
    connected_summaries, _ = multi_hop_traversal(G, actual_id, max_hops=2)

    return {
        "entity_id": entity.entity_id,
        "identifier": entity.identifier,
        "normalized_value": entity.normalized_value,
        "entity_type": entity.entity_type,
        "risk_score": entity.risk_score,
        "risk_level": entity.risk_level,
        "source_dataset": entity.source_dataset,
        "evidence_status": entity.evidence_status,
        "created_at": entity.created_at.isoformat() if entity.created_at else None,
        "reports": [
            {
                "report_id": r.report_id,
                "scam_type": r.scam_type,
                "description": r.description,
                "verification_status": r.verification_status,
                "reported_at": r.reported_at.isoformat() if r.reported_at else None
            }
            for r in reports
        ],
        "relationships": [
            {
                "direction": "OUTBOUND",
                "target_entity_id": r.target_entity_id,
                "relationship_type": r.relationship_type,
                "confidence": r.confidence,
                "evidence_source": r.evidence_source,
                "evidence_status": r.evidence_status
            }
            for r in out_rels
        ] + [
            {
                "direction": "INBOUND",
                "source_entity_id": r.source_entity_id,
                "relationship_type": r.relationship_type,
                "confidence": r.confidence,
                "evidence_source": r.evidence_source,
                "evidence_status": r.evidence_status
            }
            for r in in_rels
        ],
        "connected_nodes_count": len(connected_summaries),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "limitations": (
            "This report is generated automatically by ScamShield + ScamTrace from stored dataset evidence "
            "and consented incident submissions. Risk metrics are heuristic decision-support indicators and "
            "do not represent legal proof of fraud or calibrated probability. Corroboration required."
        )
    }


def export_entity_report_csv(data: Dict[str, Any]) -> str:
    """Exports the entity investigation file as a structured CSV string."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["SCAMTRACE THREAT INTELLIGENCE DOSSIER"])
    writer.writerow(["Generated At", data["generated_at"]])
    writer.writerow([])

    writer.writerow(["ENTITY PROFILE"])
    writer.writerow(["Entity ID", data["entity_id"]])
    writer.writerow(["Identifier", data["identifier"]])
    writer.writerow(["Normalized Value", data["normalized_value"]])
    writer.writerow(["Entity Type", data["entity_type"]])
    writer.writerow(["Risk Score", data["risk_score"]])
    writer.writerow(["Risk Level", data["risk_level"]])
    writer.writerow(["Source Dataset", data["source_dataset"]])
    writer.writerow(["Evidence Status", data["evidence_status"]])
    writer.writerow([])

    writer.writerow(["ASSOCIATED CITIZEN / SYSTEM REPORTS"])
    writer.writerow(["Report ID", "Scam Type", "Sanitized Description", "Verification Status", "Reported At"])
    for r in data["reports"]:
        writer.writerow([r["report_id"], r["scam_type"], r["description"], r["verification_status"], r["reported_at"]])
    writer.writerow([])

    writer.writerow(["DIRECT GRAPH RELATIONSHIPS"])
    writer.writerow(["Direction", "Connected Entity ID", "Relationship Type", "Confidence", "Evidence Source", "Status"])
    for rel in data["relationships"]:
        peer = rel.get("target_entity_id") or rel.get("source_entity_id")
        writer.writerow([rel["direction"], peer, rel["relationship_type"], rel["confidence"], rel["evidence_source"], rel["evidence_status"]])
    writer.writerow([])

    writer.writerow(["LIMITATIONS & FORENSIC DISCLAIMER"])
    writer.writerow([data["limitations"]])

    return output.getvalue()


def export_entity_report_markdown(data: Dict[str, Any]) -> str:
    """Exports printable Markdown/HTML dossier for investigators."""
    md = f"""# ScamTrace Threat Intelligence Dossier
**Generated At:** {data['generated_at']}

## 1. Entity Profile
- **Entity ID:** `{data['entity_id']}`
- **Identifier:** `{data['identifier']}`
- **Normalized Value:** `{data['normalized_value']}`
- **Type:** `{data['entity_type']}`
- **Risk Score:** **{data['risk_score']}/100** ({data['risk_level']})
- **Provenance Dataset:** `{data['source_dataset']}`
- **Evidence Status:** `{data['evidence_status']}`

## 2. Connected Reports ({len(data['reports'])})
"""
    if not data['reports']:
        md += "_No independent citizen reports filed directly against this identifier._\n"
    else:
        for r in data['reports']:
            md += f"- **[{r['scam_type']}]** ({r['verification_status']}) {r['description']} _(Filed: {r['reported_at']})_\n"

    md += f"\n## 3. Direct Network Relationships ({len(data['relationships'])})\n"
    if not data['relationships']:
        md += "_No direct relationships recorded in threat graph._\n"
    else:
        for rel in data['relationships']:
            peer = rel.get('target_entity_id') or rel.get('source_entity_id')
            md += f"- **{rel['direction']}** `[{rel['relationship_type']}]` -> `{peer}` (Confidence: {rel['confidence']}, Source: {rel['evidence_source']})\n"

    md += f"""
## 4. Investigative Limitations & Notice
> {data['limitations']}
"""
    return md
