from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class SignalDetail(BaseModel):
    category: str
    signal_name: str
    weight: float
    contribution: float
    description: str
    title: Optional[str] = None
    severity: Optional[str] = None
    formatted_title: Optional[str] = None
    explanation: Optional[str] = None
    safety_action: Optional[str] = None
    evidence_snippet: Optional[str] = None


class MessageAnalysisRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=3000, description="The suspicious SMS, email, or instant message text")
    sender: Optional[str] = Field(None, max_length=100, description="Optional phone number, handle, or sender ID")
    country: Optional[str] = Field("IN", max_length=10, description="Selected country code for regional help contacts (e.g. IN, US, UK, CA, AU)")
    consent_for_llm: bool = Field(False, description="Optional user opt-in to generate plain-language explanation via LLM")


class MessageAnalysisResponse(BaseModel):
    risk_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="Calibrated risk assessment score / model scam probability (0-100)")
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, or UNABLE_TO_ASSESS")
    heuristic_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="Secondary heuristic score (0-100) based on pattern matching")
    detected_signals: List[SignalDetail]
    warning_signals: List[Dict[str, Any]] = Field(default_factory=list)
    verdict: Optional[str] = None
    summary: Optional[str] = None
    explanation: str
    safe_next_steps: List[str]
    limitations: str
    redacted_message_preview: str
    ml_prediction: Optional[str] = Field(None, description="SCAM_OR_FRAUD, BENIGN, or UNABLE_TO_ASSESS")
    ml_probability: Optional[float] = Field(None, description="Calibrated ML probability score (0-100)")
    model_contributing_features: List[Dict[str, Any]] = Field(default_factory=list, description="Top positive text features contributing to model prediction")
    model_version: Optional[str] = Field(None, description="Trained ML model version")
    model_type: Optional[str] = Field(None, description="ML architecture used")
    assessment_notice: str = Field(
        "Automated risk assessment based on behavioral and structural patterns. "
        "Does not constitute legal proof or a guaranteed fraud determination.",
        description="Disclaimer on assessment scope and non-definitive status"
    )
    help_contacts: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Official regional reporting and emergency contacts")
    report_text: Optional[str] = Field(None, description="Formatted plain-text analysis report")
    llm_explanation: Optional[str] = Field(None, description="Optional plain-language explanation generated via LLM")


class UrlAnalysisRequest(BaseModel):
    url: str = Field(..., min_length=3, max_length=2048, description="The URL or domain to inspect")
    country: Optional[str] = Field("IN", max_length=10, description="Selected country code for regional help contacts (e.g. IN, US, UK, CA, AU)")
    consent_for_llm: bool = Field(False, description="Optional user opt-in to generate plain-language explanation via LLM")


class UrlAnalysisResponse(BaseModel):
    url: str
    redacted_url: Optional[str] = None
    domain: str
    model_prediction: str = Field(..., description="PHISHING, BENIGN, or UNCERTAIN")
    confidence: Optional[float] = Field(None, description="Calibrated model confidence")
    calibrated_confidence: Optional[float] = Field(None, description="Calibrated probability percentage")
    model_version: Optional[str] = Field(None, description="Trained model version")
    model_availability: bool
    heuristic_findings: List[str]
    warning_signs: List[str] = Field(default_factory=list)
    warning_signals: List[Dict[str, Any]] = Field(default_factory=list)
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_level: str
    explanation: str
    https_security_observation: Optional[str] = None
    safe_next_steps: List[str]
    limitations: str
    domain_info: Optional[Dict[str, Any]] = None
    assessment_notice: str = Field(
        "Automated static risk assessment based on lexical and structural features. "
        "Does not constitute legal proof. HTTPS encryption does not guarantee domain legitimacy.",
        description="Disclaimer on assessment scope and non-definitive status"
    )
    help_contacts: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Official regional reporting and emergency contacts")
    report_text: Optional[str] = Field(None, description="Formatted plain-text analysis report")
    llm_explanation: Optional[str] = Field(None, description="Optional plain-language explanation generated via LLM")
