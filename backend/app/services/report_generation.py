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
from backend.app.services.timeline import get_entity_threat_timeline


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

    # Timeline events
    timeline_data = get_entity_threat_timeline(db, actual_id)

    # Recommendations based on risk score and type
    recommendations = []
    if entity.risk_score >= 80.0:
        recommendations.append("Immediate Threat Isolation: Coordinate with registrar/telecom provider for domain suspension or SIM blocking.")
        recommendations.append("Financial Freezing Request: Submit CFCFRMS / 1930 preservation notice to associated intermediary payment gateways.")
        recommendations.append("Cross-Jurisdictional Notice: Escalate to Cyber Cell coordination unit for cluster linkage.")
    elif entity.risk_score >= 50.0:
        recommendations.append("Active Monitoring: Place identifier on high-priority watch-list for recurring transaction alerts.")
        recommendations.append("Mule Account Traversal: Trace incoming and outgoing transfer hops to identify secondary layering nodes.")
    else:
        recommendations.append("Passive Intelligence Collection: Retain in threat registry pending corroborating reports.")

    executive_summary = (
        f"Forensic investigation profile for {entity.entity_type} '{entity.identifier}' indicates an aggregate risk score "
        f"of {entity.risk_score}/100 ({entity.risk_level} threat level). Source provenance traces to dataset '{entity.source_dataset}' "
        f"with verification posture '{entity.evidence_status}'. The identifier is linked to {len(reports)} independent report(s) "
        f"and {len(connected_summaries)} multi-hop graph neighbor(s)."
    )

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
        "executive_summary": executive_summary,
        "recommendations": recommendations,
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
        "timeline": timeline_data.get("events", []),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "limitations": (
            "This dossier is compiled programmatically by ScamShield + ScamTrace from stored dataset evidence, "
            "consented incident submissions, and graph topology. Algorithmic risk scores are heuristic investigative "
            "indicators, NOT calibrated criminal probabilities or definitive judicial findings. Independent human-in-the-loop "
            "verification and subpoena of carrier/banking records are required prior to enforcement action."
        )
    }


def export_entity_report_csv(data: Dict[str, Any]) -> str:
    """Exports the entity investigation file as a structured CSV string."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["SCAMTRACE THREAT INTELLIGENCE DOSSIER"])
    writer.writerow(["Generated At", data["generated_at"]])
    writer.writerow([])

    writer.writerow(["EXECUTIVE SUMMARY"])
    writer.writerow([data["executive_summary"]])
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
    writer.writerow(["Multi-Hop Neighbors Count", data["connected_nodes_count"]])
    writer.writerow([])

    writer.writerow(["CHRONOLOGICAL THREAT TIMELINE"])
    writer.writerow(["Timestamp", "Event Type", "Title", "Description", "Provenance", "Severity"])
    for ev in data.get("timeline", []):
        writer.writerow([ev.get("timestamp"), ev.get("event_type"), ev.get("title"), ev.get("description"), ev.get("provenance"), ev.get("severity")])
    writer.writerow([])

    writer.writerow(["CITIZEN & SYSTEM REPORTS"])
    writer.writerow(["Report ID", "Scam Type", "Verification Status", "Reported At", "Sanitized Description"])
    for rep in data["reports"]:
        writer.writerow([rep["report_id"], rep["scam_type"], rep["verification_status"], rep["reported_at"], rep["description"]])
    writer.writerow([])

    writer.writerow(["DIRECT GRAPH RELATIONSHIPS"])
    writer.writerow(["Direction", "Connected Entity ID", "Relationship Type", "Confidence", "Evidence Source", "Status"])
    for rel in data["relationships"]:
        peer = rel.get("target_entity_id") or rel.get("source_entity_id")
        writer.writerow([rel["direction"], peer, rel["relationship_type"], rel["confidence"], rel["evidence_source"], rel["evidence_status"]])
    writer.writerow([])

    writer.writerow(["RECOMMENDED NEXT STEPS"])
    for rec in data.get("recommendations", []):
        writer.writerow([rec])
    writer.writerow([])

    writer.writerow(["LIMITATIONS & FORENSIC DISCLAIMER"])
    writer.writerow([data["limitations"]])

    return output.getvalue()


def export_entity_report_markdown(data: Dict[str, Any]) -> str:
    """Exports printable Markdown/HTML dossier for investigators."""
    md = f"""# ScamTrace Threat Intelligence Dossier
**Generated At:** {data['generated_at']}  
**Classification:** RESTRICTED FORENSIC INTELLIGENCE  

---

## Executive Summary
> {data['executive_summary']}

---

## 1. Entity Profile & Provenance
- **Entity ID:** `{data['entity_id']}`
- **Identifier:** `{data['identifier']}`
- **Normalized Canonical Form:** `{data['normalized_value']}`
- **Entity Classification:** `{data['entity_type']}`
- **Assessed Risk Level:** **{data['risk_level']}** ({data['risk_score']}/100)
- **Primary Intelligence Source:** `{data['source_dataset']}`
- **Verification Posture:** `{data['evidence_status']}`
- **Network Footprint:** {data['connected_nodes_count']} multi-hop adjacent nodes

---

## 2. Chronological Threat Timeline
"""
    if not data.get("timeline"):
        md += "_No chronological events recorded for this entity._\n"
    else:
        md += "| Timestamp | Event Type | Details | Provenance | Severity |\n"
        md += "|---|---|---|---|---|\n"
        for ev in data["timeline"]:
            md += f"| {ev.get('timestamp', '')[:19]} | `{ev.get('event_type')}` | {ev.get('title')} - {ev.get('description')} | {ev.get('provenance')} | {ev.get('severity')} |\n"

    md += f"""
---

## 3. Connected Incident Reports ({len(data['reports'])})
"""
    if not data['reports']:
        md += "_No independent citizen incident reports logged directly against this identifier._\n"
    else:
        for r in data['reports']:
            md += f"- **[{r['scam_type']}]** ({r['verification_status']}): {r['description']} _(Reported: {r['reported_at']})_\n"

    md += f"""
---

## 4. Direct Network Relationships ({len(data['relationships'])})
"""
    if not data['relationships']:
        md += "_No direct relationships registered in the threat graph._\n"
    else:
        md += "| Direction | Target Node | Relationship | Confidence | Evidence Source |\n"
        md += "|---|---|---|---|---|\n"
        for rel in data['relationships']:
            peer = rel.get('target_entity_id') or rel.get('source_entity_id')
            md += f"| {rel['direction']} | `{peer}` | `{rel['relationship_type']}` | {rel['confidence']:.2f} | {rel['evidence_source']} |\n"

    md += f"""
---

## 5. Recommended Investigative Actions
"""
    for rec in data.get("recommendations", []):
        md += f"- {rec}\n"

    md += f"""
---

## 6. Limitations & Statutory Notice
> **Notice**: {data['limitations']}
"""
    return md
