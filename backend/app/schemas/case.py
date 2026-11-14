from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class CaseCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    priority: str = Field("MEDIUM", pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    status: str = Field("OPEN", pattern="^(OPEN|UNDER_INVESTIGATION|ESCALATED|RESOLVED|CLOSED)$")
    assigned_to: Optional[str] = "Unassigned"


class CaseUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None


class CaseEntityAddRequest(BaseModel):
    entity_id: str
    notes: Optional[str] = None


class CaseNoteCreateRequest(BaseModel):
    content: str = Field(..., min_length=2)
    author: Optional[str] = "Investigator"


class CaseNoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    note_id: str
    case_id: str
    author: str
    content: str
    created_at: Optional[datetime] = None


class CaseEntityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    entity_id: str
    notes: Optional[str] = None
    added_at: Optional[datetime] = None
    entity_identifier: Optional[str] = None
    entity_type: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None


class CaseSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    case_id: str
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    assigned_to: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    entity_count: int = 0
    note_count: int = 0


class CaseDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    case_id: str
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    assigned_to: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    entities: List[CaseEntityOut] = []
    notes: List[CaseNoteOut] = []
