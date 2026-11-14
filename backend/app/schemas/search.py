from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import List, Dict, Any, Optional
from datetime import datetime


class CytoscapeNodeData(BaseModel):
    id: str
    label: str
    entity_type: str
    risk_score: float
    risk_level: str
    source_dataset: str
    evidence_status: str


class CytoscapeNode(BaseModel):
    data: CytoscapeNodeData


class CytoscapeEdgeData(BaseModel):
    id: str
    source: str
    target: str
    relationship_type: str
    confidence: float
    evidence_reference: Optional[str] = None
    evidence_status: str
    source_dataset: str
    explanation: Optional[str] = None


class CytoscapeEdge(BaseModel):
    data: CytoscapeEdgeData


class CytoscapeGraph(BaseModel):
    nodes: List[CytoscapeNode]
    edges: List[CytoscapeEdge]


class EntitySearchRequest(BaseModel):
    identifier: Optional[str] = Field(None, min_length=1, max_length=255, description="Search term (phone, URL, account, wallet)")
    query: Optional[str] = Field(None, description="Alias for identifier")
    entity_type: Optional[str] = Field("AUTO", description="PHONE, URL, DOMAIN, BANK_ACCOUNT, CRYPTO_WALLET, or AUTO")
    type: Optional[str] = Field(None, description="Alias for entity_type")
    max_hops: Optional[int] = Field(2, ge=1, le=3, description="Graph traversal depth (1 to 3)")

    @model_validator(mode="before")
    @classmethod
    def unify_search_inputs(cls, data: Any) -> Any:
        if isinstance(data, dict):
            identifier = data.get("identifier") or data.get("query")
            if identifier:
                data["identifier"] = str(identifier).strip()
            etype = data.get("entity_type") or data.get("type") or "AUTO"
            data["entity_type"] = str(etype).upper() if etype else "AUTO"
        return data


class EntityDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    entity_id: str
    id: Optional[str] = None
    entity_type: str
    type: Optional[str] = None
    identifier: str
    normalized_value: str
    risk_score: float
    riskScore: Optional[float] = None
    risk_level: str
    riskLevel: Optional[str] = None
    source_dataset: str
    sourceDataset: Optional[str] = None
    evidence_status: str
    evidenceStatus: Optional[str] = None
    isSynthetic: Optional[bool] = None
    reportCount: Optional[int] = None
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            e_id = getattr(data, "entity_id", None)
            e_type = getattr(data, "entity_type", None)
            r_score = getattr(data, "risk_score", None)
            r_level = getattr(data, "risk_level", None)
            src = getattr(data, "source_dataset", None)
            ev = getattr(data, "evidence_status", None)
            return {
                "entity_id": e_id,
                "id": e_id,
                "entity_type": e_type,
                "type": e_type,
                "identifier": getattr(data, "identifier", None),
                "normalized_value": getattr(data, "normalized_value", None),
                "risk_score": r_score,
                "riskScore": r_score,
                "risk_level": r_level,
                "riskLevel": r_level,
                "source_dataset": src,
                "sourceDataset": src,
                "evidence_status": ev,
                "evidenceStatus": ev,
                "isSynthetic": bool(src and "synthetic" in str(src).lower() or ev == "SYNTHETIC"),
                "reportCount": 0,
                "created_at": getattr(data, "created_at", datetime.now()),
            }
        elif isinstance(data, dict):
            data["id"] = data.get("id") or data.get("entity_id")
            data["type"] = data.get("type") or data.get("entity_type")
            data["riskScore"] = data.get("riskScore", data.get("risk_score"))
            data["riskLevel"] = data.get("riskLevel") or data.get("risk_level")
            data["sourceDataset"] = data.get("sourceDataset") or data.get("source_dataset")
            data["evidenceStatus"] = data.get("evidenceStatus") or data.get("evidence_status")
            if "isSynthetic" not in data:
                src = data.get("source_dataset", "")
                ev = data.get("evidence_status", "")
                data["isSynthetic"] = bool(src and "synthetic" in str(src).lower() or ev == "SYNTHETIC")
        return data


class ReportSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    report_id: str
    scam_type: str
    description: Optional[str]
    source: str
    verification_status: str
    reported_at: datetime


class ConnectedEntitySummary(BaseModel):
    entity_id: str
    entity_type: str
    identifier: str
    relationship_type: str
    direction: str  # OUTBOUND, INBOUND
    confidence: float
    hops: int
    risk_score: float
    risk_level: str
    evidence_status: str


class EntitySearchResponse(BaseModel):
    found: bool
    searched_identifier: str
    detected_type: str
    normalized_value: str
    message: str
    entity: Optional[EntityDetail] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    risk_explanation: Optional[Dict[str, Any]] = None
    connected_entities: List[ConnectedEntitySummary] = []
    related_reports: List[ReportSummary] = []
    graph: Optional[CytoscapeGraph] = None
    investigative_warning: str
    results: List[Dict[str, Any]] = []
