from pydantic import BaseModel
from typing import Dict, List, Any, Optional


class RiskDistribution(BaseModel):
    low: int
    medium: int
    high: int
    critical: int


class DashboardStatsResponse(BaseModel):
    total_entities: int
    totalEntities: Optional[int] = None
    total_relationships: int
    totalRelationships: Optional[int] = None
    total_reports: int
    total_consents: int
    suspicious_entities: Optional[int] = None
    suspiciousEntities: Optional[int] = None
    connected_clusters: Optional[int] = None
    connectedClusters: Optional[int] = None
    risk_distribution: RiskDistribution
    riskDistribution: List[Dict[str, Any]] = []
    entity_type_breakdown: Dict[str, int]
    entityDistribution: List[Dict[str, Any]] = []
    entity_distribution: List[Dict[str, Any]] = []
    top_scam_types: Dict[str, int]
    active_threat_clusters: int
    dataset_sources: Dict[str, int]
    recentInvestigations: List[Dict[str, Any]] = []
    recentActivity: List[Dict[str, Any]] = []


class AnalyticsSummaryResponse(BaseModel):
    graph_density: float
    total_connected_components: int
    largest_cluster_size: int
    average_degree: float
    high_risk_centrality_nodes: List[Dict[str, Any]]
    scam_distribution_by_type: Dict[str, int]
    evidence_status_breakdown: Dict[str, int]
    categories: List[Dict[str, Any]] = []
    scamCategories: List[Dict[str, Any]] = []
    entityDistribution: List[Dict[str, Any]] = []
    topEntities: List[Dict[str, Any]] = []
    transactionTrends: List[Dict[str, Any]] = []
