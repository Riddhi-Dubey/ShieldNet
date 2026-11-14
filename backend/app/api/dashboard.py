from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database.database import get_db
from backend.app.models.entity import Entity
from backend.app.models.relationship import Relationship
from backend.app.models.report import Report
from backend.app.models.consent import Consent
from backend.app.schemas.dashboard import DashboardStatsResponse, RiskDistribution
from backend.app.graph.graph_builder import build_networkx_graph
from backend.app.graph.clusters import identify_network_clusters

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_statistics(db: Session = Depends(get_db)):
    """
    Returns aggregated metrics across all entities, relationships, reports,
    risk tiers, and active network threat clusters.
    """
    total_entities = db.query(Entity).count()
    total_relationships = db.query(Relationship).count()
    total_reports = db.query(Report).count()
    total_consents = db.query(Consent).count()

    # Risk distribution
    low_cnt = db.query(Entity).filter(Entity.risk_level == "LOW").count()
    med_cnt = db.query(Entity).filter(Entity.risk_level == "MEDIUM").count()
    high_cnt = db.query(Entity).filter(Entity.risk_level == "HIGH").count()
    crit_cnt = db.query(Entity).filter(Entity.risk_level == "CRITICAL").count()

    risk_dist = RiskDistribution(
        low=low_cnt,
        medium=med_cnt,
        high=high_cnt,
        critical=crit_cnt
    )

    # Breakdown by entity type
    type_counts = (
        db.query(Entity.entity_type, func.count(Entity.entity_id))
        .group_by(Entity.entity_type)
        .all()
    )
    entity_type_breakdown = {t: c for t, c in type_counts}

    # Breakdown by scam type
    scam_counts = (
        db.query(Report.scam_type, func.count(Report.report_id))
        .group_by(Report.scam_type)
        .all()
    )
    top_scam_types = {s: c for s, c in scam_counts}

    # Breakdown by dataset source
    source_counts = (
        db.query(Entity.source_dataset, func.count(Entity.entity_id))
        .group_by(Entity.source_dataset)
        .all()
    )
    dataset_sources = {s: c for s, c in source_counts}

    # Active threat clusters
    G = build_networkx_graph(db)
    clusters = identify_network_clusters(G)
    active_clusters_count = sum(1 for c in clusters if c["size"] >= 2 and c["average_risk_score"] >= 50.0)

    # Formatted array structures for Recharts in Dashboard.jsx
    risk_dist_array = [
        {"level": "Low", "count": low_cnt},
        {"level": "Medium", "count": med_cnt},
        {"level": "High", "count": high_cnt},
        {"level": "Critical", "count": crit_cnt},
    ]

    entity_dist_array = [
        {"type": t.replace("_", " ").title(), "count": c}
        for t, c in type_counts
    ]

    recent_entities = db.query(Entity).order_by(Entity.created_at.desc()).limit(5).all()
    recent_investigations = [
        {
            "id": e.entity_id,
            "identifier": e.identifier,
            "type": e.entity_type,
            "riskLevel": e.risk_level,
            "riskScore": e.risk_score,
            "source": e.source_dataset,
            "isSynthetic": bool(e.source_dataset and "synthetic" in e.source_dataset.lower() or e.evidence_status == "SYNTHETIC")
        }
        for e in recent_entities
    ]

    recent_reports = db.query(Report).order_by(Report.reported_at.desc()).limit(4).all()
    recent_activity = [
        {
            "action": f"Incident Registered ({r.scam_type.replace('_', ' ')})",
            "resource": r.description[:40] + "..." if r.description and len(r.description) > 40 else (r.description or "Report logged"),
            "timestamp": r.reported_at.strftime("%H:%M:%S") if r.reported_at else "Recent",
            "severity": "critical" if r.verification_status == "VERIFIED" else "normal"
        }
        for r in recent_reports
    ]
    if not recent_activity and recent_entities:
        recent_activity = [
            {
                "action": "Threat Node Indexed",
                "resource": f"{e.entity_type}: {e.identifier}",
                "timestamp": e.created_at.strftime("%H:%M:%S") if e.created_at else "Recent",
                "severity": "critical" if e.risk_level in ["HIGH", "CRITICAL"] else "normal"
            }
            for e in recent_entities[:4]
        ]

    suspicious_count = high_cnt + crit_cnt

    return DashboardStatsResponse(
        total_entities=total_entities,
        totalEntities=total_entities,
        total_relationships=total_relationships,
        totalRelationships=total_relationships,
        total_reports=total_reports,
        total_consents=total_consents,
        suspicious_entities=suspicious_count,
        suspiciousEntities=suspicious_count,
        connected_clusters=active_clusters_count,
        connectedClusters=active_clusters_count,
        risk_distribution=risk_dist,
        riskDistribution=risk_dist_array,
        entity_type_breakdown=entity_type_breakdown,
        entityDistribution=entity_dist_array,
        entity_distribution=entity_dist_array,
        top_scam_types=top_scam_types,
        active_threat_clusters=active_clusters_count,
        dataset_sources=dataset_sources,
        recentInvestigations=recent_investigations,
        recentActivity=recent_activity
    )
