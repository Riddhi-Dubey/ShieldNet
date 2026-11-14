from pydantic import BaseModel, Field, ConfigDict, model_validator
from typing import Optional, List, Any
from datetime import datetime


class ReportPreviewRequest(BaseModel):
    raw_identifier: Optional[str] = Field(None, description="Phone, URL, bank account, or wallet identifier")
    entity_type: Optional[str] = Field("AUTO", description="PHONE, URL, DOMAIN, BANK_ACCOUNT, CRYPTO_WALLET, or AUTO")
    scam_type: Optional[str] = Field(None, description="UPI_FRAUD, OTP_THEFT, PHISHING, FAKE_JOB, etc.")
    description: str = Field(..., min_length=5, max_length=2000)
    category: Optional[str] = None
    phoneNumber: Optional[str] = None
    url: Optional[str] = None
    upiId: Optional[str] = None
    email: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def unify_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            raw_id = (
                values.get("raw_identifier")
                or values.get("phoneNumber")
                or values.get("url")
                or values.get("upiId")
                or values.get("email")
            )
            if not raw_id:
                raw_id = "CITIZEN_INCIDENT_REPORT"
            values["raw_identifier"] = str(raw_id).strip()

            scam_t = values.get("scam_type") or values.get("category") or "OTHER_CYBER_FRAUD"
            values["scam_type"] = str(scam_t).replace(" / ", "_").replace(" ", "_").upper()
        return values


class ReportPreviewResponse(BaseModel):
    proposed_identifier: str
    proposed_entity_type: str
    proposed_scam_type: str
    sanitized_description: str
    redacted_items_summary: List[str]
    proposed_destination: str = "SCAMTRACE_INTELLIGENCE"
    proposed_purpose: str = "SCAM_REPORTING"
    proposed_scope: str = "SANITIZED_INDICATORS"
    consent_notice: str


class ReportCreateRequest(BaseModel):
    consent_id: Optional[str] = Field(None, description="ID of the verified consent record")
    consent_given: Optional[bool] = False
    share_with_scamtrace: Optional[bool] = False
    raw_identifier: Optional[str] = Field(None, min_length=1, max_length=255)
    entity_type: Optional[str] = Field("AUTO")
    scam_type: Optional[str] = Field(None, description="UPI_FRAUD, OTP_THEFT, PHISHING, FAKE_JOB, etc.")
    description: str = Field(..., min_length=5, max_length=2000)
    category: Optional[str] = None
    phoneNumber: Optional[str] = None
    url: Optional[str] = None
    upiId: Optional[str] = None
    email: Optional[str] = None
    session_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def unify_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            raw_id = (
                values.get("raw_identifier")
                or values.get("phoneNumber")
                or values.get("url")
                or values.get("upiId")
                or values.get("email")
            )
            if not raw_id:
                raw_id = "CITIZEN_INCIDENT_REPORT"
            values["raw_identifier"] = str(raw_id).strip()

            scam_t = values.get("scam_type") or values.get("category") or "OTHER_CYBER_FRAUD"
            values["scam_type"] = str(scam_t).replace(" / ", "_").replace(" ", "_").upper()
        return values


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    report_id: str
    entity_id: str
    entity_type: str
    normalized_identifier: str
    scam_type: str
    sanitized_description: str
    verification_status: str
    reported_at: datetime
    message: str
