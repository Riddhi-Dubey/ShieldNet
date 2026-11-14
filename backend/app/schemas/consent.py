from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class ConsentCreate(BaseModel):
    purpose: str = Field(..., description="Consent purpose, e.g. SCAM_REPORTING")
    destination: str = Field(..., description="Target destination, e.g. SCAMTRACE_INTELLIGENCE")
    data_scope: str = Field(..., description="Scope of data, e.g. SANITIZED_INDICATORS")
    session_id: Optional[str] = Field(None, description="Optional session tracking ID")
    consent_version: str = Field("1.0", description="Version of consent terms")


class ConsentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    consent_id: str
    purpose: str
    destination: str
    data_scope: str
    consent_version: str
    status: str
    created_at: datetime
    revoked_at: Optional[datetime] = None


class ConsentRevokeRequest(BaseModel):
    consent_id: str
    session_id: Optional[str] = None
