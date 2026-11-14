from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class SignalDetail(BaseModel):
    category: str
    signal_name: str
    weight: float
    contribution: float
    description: str
    evidence_snippet: Optional[str] = None


class MessageAnalysisRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000, description="The suspicious SMS, email, or instant message text")
    sender: Optional[str] = Field(None, max_length=100, description="Optional phone number, handle, or sender ID")


class MessageAnalysisResponse(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Prototype risk score (0-100)")
    risk_level: str = Field(..., description="Low, Medium, High, or Critical")
    detected_signals: List[SignalDetail]
    warning_signals: List[Dict[str, Any]] = Field(default_factory=list)
    verdict: Optional[str] = None
    summary: Optional[str] = None
    explanation: str
    safe_next_steps: List[str]
    limitations: str
    redacted_message_preview: str
    ml_prediction: Optional[str] = Field(None, description="SCAM_OR_FRAUD, BENIGN, or SUSPICIOUS")
    ml_probability: Optional[float] = Field(None, description="Calibrated ML probability score (0-100)")
    model_version: Optional[str] = Field(None, description="Trained ML model version")
    model_type: Optional[str] = Field(None, description="ML architecture used")


class UrlAnalysisRequest(BaseModel):
    url: str = Field(..., min_length=3, max_length=2000, description="The URL or domain to inspect")


class UrlAnalysisResponse(BaseModel):
    url: str
    domain: str
    model_prediction: str = Field(..., description="PHISHING, BENIGN, or SUSPICIOUS")
    confidence: Optional[float] = Field(None, description="Calibrated model confidence")
    calibrated_confidence: Optional[float] = Field(None, description="Calibrated probability percentage")
    model_version: Optional[str] = Field(None, description="Trained model version")
    model_availability: bool
    heuristic_findings: List[str]
    warning_signs: List[str] = Field(default_factory=list)
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: str
    explanation: str
    https_security_observation: Optional[str] = None
    safe_next_steps: List[str]
    limitations: str
    domain_info: Optional[Dict[str, Any]] = None
