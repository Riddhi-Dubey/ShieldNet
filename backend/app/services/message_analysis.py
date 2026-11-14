import os
import re
from typing import List, Dict, Any, Tuple, Optional
import joblib
from backend.app.schemas.analysis import SignalDetail, MessageAnalysisResponse
from backend.app.services.risk_scoring import calculate_risk_level
from backend.app.security.redaction import redact_sensitive_text

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml")
MSG_MODEL_PATH = os.path.join(MODEL_DIR, "message_model.joblib")
MSG_VEC_PATH = os.path.join(MODEL_DIR, "message_vectorizer.joblib")
MSG_META_PATH = os.path.join(MODEL_DIR, "message_metadata.joblib")

_model = None
_vectorizer = None
_metadata = None

def get_message_ml_artifacts():
    global _model, _vectorizer, _metadata
    if _model is None and os.path.exists(MSG_MODEL_PATH) and os.path.exists(MSG_VEC_PATH):
        try:
            _model = joblib.load(MSG_MODEL_PATH)
            _vectorizer = joblib.load(MSG_VEC_PATH)
            if os.path.exists(MSG_META_PATH):
                _metadata = joblib.load(MSG_META_PATH)
        except Exception:
            _model = None
            _vectorizer = None
    return _model, _vectorizer, _metadata

# Categorized threat pattern detectors
SIGNAL_PATTERNS = {
    "URGENCY": {
        "weight": 18.0,
        "category": "Psychological Coercion",
        "description": "High-pressure urgency tactics, threats of service disconnection, or legal panic",
        "patterns": [
            r"\b(urgent|immediately|within\s+\d+\s*(?:hours?|mins?|minutes?)|account\s+(?:has\s+been\s+)?(?:blocked|suspended|deactivated|closed|frozen)|deactivated\s+today|last\s+notice|final\s+warning|expire\s+soon|immediate\s+action|power\s+(?:will\s+be\s+)?disconnected|power\s+cutoff|bill\s+unpaid|permanent\s+deactivation|avoid\s+permanent\s+deactivation)\b"
        ]
    },
    "KYC_HARVESTING": {
        "weight": 28.0,
        "category": "Credential & Identity Harvesting",
        "description": "Deceptive solicitation of KYC verification, Aadhaar, or PAN card updates under penalty of suspension",
        "patterns": [
            r"\b(pending\s+kyc|kyc\s+update|complete\s+(?:your\s+)?kyc|kyc\s+(?:has\s+)?expired|pan\s+(?:card\s+)?(?:link|update)|update\s+(?:your\s+)?kyc|link\s+aadhar|sim\s+verification|sim\s+block|kyc\s+suspended|send\s+(?:your\s+)?aadhar|aadhar\s+card)\b"
        ]
    },
    "ADVANCE_PAYMENT": {
        "weight": 24.0,
        "category": "Financial Demand",
        "description": "Request for upfront advance fees, registration charges, or refundable security deposits",
        "patterns": [
            r"\b(processing\s+fee|registration\s+fee|security\s+deposit|advance\s+payment|refundable\s+deposit|customs\s+clearance\s+charge|pay\s+upfront|courier\s+fee)\b"
        ]
    },
    "OTP_REQUEST": {
        "weight": 30.0,
        "category": "Credential Extraction",
        "description": "Direct solicitation of One-Time Password (OTP) or authentication codes",
        "patterns": [
            r"\b(share\s+(?:the\s+)?otp|send\s+(?:the\s+)?(?:otp|code)|forward\s+(?:the\s+)?code|verify\s+(?:your\s+)?otp|tell\s+me\s+the\s+otp|enter\s+otp\s+on\s+call|one\s*time\s*password)\b"
        ]
    },
    "PIN_OR_PASSWORD": {
        "weight": 32.0,
        "category": "Credential Theft",
        "description": "Direct request for UPI PIN, ATM PIN, or banking passwords",
        "patterns": [
            r"\b(atm\s+pin|upi\s+pin|mpin|net\s*banking\s+password|login\s+password|secret\s+pin|enter\s+pin\s+to\s+receive)\b"
        ]
    },
    "PRIZE_OR_LOTTERY": {
        "weight": 24.0,
        "category": "Baiting / Lottery Scam",
        "description": "Unsolicited claims of winnings, lucky draws, or massive cash rewards",
        "patterns": [
            r"\b(won\s+lottery|congratulations\s+you\s+(?:have\s+)?won|cash\s+prize|lucky\s+draw|kbc\s+lottery|selected\s+winner|claim\s+your\s+prize|car\s+reward|jackpot|won\s+(?:₹|rs\.?))\b"
        ]
    },
    "FAKE_EMPLOYMENT": {
        "weight": 22.0,
        "category": "Job Fraud",
        "description": "Work-from-home offers promising excessive daily returns for trivial tasks",
        "patterns": [
            r"\b(work\s+from\s+home\s+daily|part\s*time\s+(?:job|telegram)|like\s+youtube\s+videos?\s+and\s+earn|earn\s+\d{3,5}\s+per\s+day|no\s+experience\s+needed|part-time\s+task|merchant\s+task)\b"
        ]
    },
    "SUSPICIOUS_PAYMENT": {
        "weight": 22.0,
        "category": "Payment Misdirection",
        "description": "Suspicious payment requests via gift cards, crypto transfers, or QR codes to receive funds",
        "patterns": [
            r"\b(scan\s+qr\s+to\s+receive|gift\s+card|crypto\s+transfer|usdt\s+deposit|send\s+money\s+to\s+vpa|pay\s+to\s+confirm)\b"
        ]
    },
    "IMPERSONATION": {
        "weight": 22.0,
        "category": "Brand / Authority Impersonation",
        "description": "Impersonation of established banks, utility boards, tax authorities, or courier services",
        "patterns": [
            r"\b(sbi(?:\b|\s+account|\s+yono|\s+card)|hdfc|icici|axis\s+bank|pnb\b|punjab\s+national|bank\s+of\s+baroda|kotak|canara|union\s+bank|rbi\b|reserve\s+bank|income\s*tax|mumbai\s+police|delhi\s+police|cyber\s*crime|electricity\s+(?:officer|board|dept)|fedex|dhl|india\s*post|post\s+office)\b"
        ]
    },
    "FAMILY_EMERGENCY": {
        "weight": 28.0,
        "category": "Social Engineering / Impersonation",
        "description": "Impersonation of family member or friend claiming emergency distress or phone loss",
        "patterns": [
            r"\b((?:hi|hello|hey)\s+(?:mom|dad|mama|papa|mum)|broke\s+my\s+phone|new\s+temporary\s+number|emergency\s+cab|pay\s+for\s+emergency|hospital\s+emergency)\b"
        ]
    },
    "SUSPICIOUS_CONTACT": {
        "weight": 16.0,
        "category": "Out-of-Band Channel",
        "description": "Redirection to unverified Telegram channels, WhatsApp numbers, or private chat handles",
        "patterns": [
            r"\b(t\.me\/[a-zA-Z0-9_]+|wa\.me\/\d+|telegram\s+channel|join\s+whatsapp\s+group|whatsapp\s+number|call\s+electricity\s+officer)\b"
        ]
    },
    "SUSPICIOUS_LINKS": {
        "weight": 24.0,
        "category": "Deceptive URL / Phishing Link",
        "description": "Unverified web link embedded in unsolicited SMS or instant message",
        "patterns": [
            r"\bhttps?:\/\/[^\s]+",
            r"\b(?:bit\.ly|tinyurl\.com|is\.gd|t\.co|cutt\.ly|rb\.gy)\/[a-zA-Z0-9_\-]+",
            r"\b[a-zA-Z0-9_\-]+\.(?:in|xyz|top|site|click|club|link|live|buzz|work|download|cc|tk|ml|ga|cf|gq)\b"
        ]
    }
}


def analyze_scam_message(message: str, sender: str = None) -> MessageAnalysisResponse:
    """
    Performs explainable, heuristic rule-based risk evaluation of a suspicious message.
    Redacts sensitive text, applies compound risk multipliers, and generates actionable safety guidance.
    """
    detected_signals: List[SignalDetail] = []
    base_score = 0.0

    lower_text = message.lower()

    for key, rule in SIGNAL_PATTERNS.items():
        matched = False
        evidence_snippet = None

        for pat in rule["patterns"]:
            match = re.search(pat, lower_text, re.IGNORECASE)
            if match:
                matched = True
                start, end = match.span()
                # Extract small context snippet
                snippet_start = max(0, start - 15)
                snippet_end = min(len(message), end + 15)
                evidence_snippet = message[snippet_start:snippet_end].strip()
                break

        if matched:
            weight = rule["weight"]
            contribution = round(weight, 1)
            base_score += contribution

            detected_signals.append(SignalDetail(
                category=rule["category"],
                signal_name=key,
                weight=weight,
                contribution=contribution,
                description=rule["description"],
                evidence_snippet=redact_sensitive_text(evidence_snippet) if evidence_snippet else None
            ))

    # Compound Multiplier: Detect textbook multi-vector attacks
    signal_keys = {s.signal_name for s in detected_signals}
    compound_boost = 0.0

    # 1. Impersonation + KYC Harvesting + Unverified Link = Textbook Phishing (e.g. SBI KYC suspension)
    if ("IMPERSONATION" in signal_keys or "URGENCY" in signal_keys) and \
       ("KYC_HARVESTING" in signal_keys or "SUSPICIOUS_LINKS" in signal_keys):
        compound_boost += 30.0

    # 2. Family Emergency + Money Request (UPI/Cab)
    if "FAMILY_EMERGENCY" in signal_keys and any(
        term in lower_text for term in ["upi", "send", "money", "pay", "₹", "rs"]
    ):
        compound_boost += 35.0

    # 3. Urgency/Threat + Utility Disconnection + Call/Contact redirection
    if "URGENCY" in signal_keys and ("SUSPICIOUS_CONTACT" in signal_keys or "IMPERSONATION" in signal_keys):
        compound_boost += 25.0

    # 4. Lottery / Prize + Advance Fee / Registration Fee
    if "PRIZE_OR_LOTTERY" in signal_keys and ("ADVANCE_PAYMENT" in signal_keys or "KYC_HARVESTING" in signal_keys):
        compound_boost += 25.0

    # ML Model Prediction (TF-IDF + Calibrated Logistic Regression)
    model, vectorizer, meta = get_message_ml_artifacts()
    ml_prob: Optional[float] = None
    ml_prediction: Optional[str] = None
    model_version: Optional[str] = None
    model_type: Optional[str] = None

    if model is not None and vectorizer is not None:
        try:
            vec = vectorizer.transform([message])
            prob = float(model.predict_proba(vec)[0][1]) * 100.0
            ml_prob = round(prob, 1)
            ml_prediction = "SCAM_OR_FRAUD" if ml_prob >= 50.0 else "BENIGN"
            model_version = meta.get("model_version", "v1.0.0") if meta else "v1.0.0"
            model_type = meta.get("model_type", "TF-IDF + Calibrated Logistic Regression") if meta else "TF-IDF + Calibrated Logistic Regression"
        except Exception:
            pass

    raw_total = base_score + compound_boost
    if ml_prob is not None:
        if raw_total == 0:
            # If no heuristic signals matched, keep benign messages Low
            risk_score = round(min(24.0, ml_prob * 0.25), 1)
        else:
            # Multi-layer defense: synthesize heuristic risk and ML probability
            risk_score = min(100.0, round(max(raw_total, (raw_total * 0.7) + (ml_prob * 0.3)), 1))
    else:
        risk_score = min(100.0, round(raw_total, 1))

    risk_level = calculate_risk_level(risk_score)

    # Explanation generation
    if not detected_signals:
        explanation = (
            "No explicit known scam triggers (urgency coercion, OTP solicitation, credential harvesting, "
            "fake job offers, lottery bait, or brand impersonation) were identified in this message."
        )
    else:
        sig_names = [s.signal_name.replace("_", " ").title() for s in detected_signals]
        explanation = (
            f"Evaluated {len(detected_signals)} suspicious behavioral signal(s): {', '.join(sig_names)}. "
            f"Compound threat correlation ({risk_score}/100) indicates significant risk of social engineering."
        )

    # Safe next steps tailored to findings
    safe_steps: List[str] = [
        "Never disclose OTPs, UPI PINs, or net banking passwords under any circumstances.",
        "Remember: Receiving money via UPI or QR code NEVER requires entering your UPI PIN.",
        "Do not click on unverified SMS links or install remote control apps (AnyDesk, TeamViewer, RustDesk).",
        "Verify suspicious communications directly through official banking apps or verified customer care lines."
    ]

    if any(s.signal_name in ["OTP_REQUEST", "PIN_OR_PASSWORD"] for s in detected_signals):
        safe_steps.insert(0, "CRITICAL: Do NOT send or disclose any one-time code or PIN.")
    if any(s.signal_name in ["IMPERSONATION", "KYC_HARVESTING"] for s in detected_signals):
        safe_steps.insert(0, "IMPORTANT: Banks NEVER suspend accounts via SMS links demanding online KYC updates.")
    if risk_score >= 60.0:
        safe_steps.append("Report financial cyber fraud immediately to the National Cyber Crime Helpline at 1930 or https://cybercrime.gov.in.")

    limitations = (
        "Heuristic analysis uses explainable pattern-matching rules and compound risk correlation. "
        "It does not represent calibrated mathematical probability or definitive legal proof of fraud. "
        "Zero detected indicators does NOT guarantee that an unknown message is benign."
    )

    redacted_preview = redact_sensitive_text(message)

    warning_signals = [
        {
            "signal": s.signal_name,
            "title": s.signal_name.replace("_", " ").title(),
            "severity": "CRITICAL" if s.weight >= 26.0 or risk_score >= 70.0 else "HIGH" if s.weight >= 20.0 else "MEDIUM",
            "explanation": s.description,
            "description": s.description,
            "evidence_snippet": s.evidence_snippet
        }
        for s in detected_signals
    ]

    if risk_score >= 70.0:
        verdict = f"CRITICAL SCAM / PHISHING PATTERN DETECTED ({risk_score}/100)"
    elif risk_score >= 40.0:
        verdict = f"HIGH / MEDIUM FRAUD RISK DETECTED ({risk_score}/100)"
    elif risk_score >= 15.0:
        verdict = f"SUSPICIOUS SIGNALS DETECTED — EXERCISE CAUTION ({risk_score}/100)"
    else:
        verdict = "NO PROMINENT SCAM SIGNALS DETECTED — VERIFY INDEPENDENTLY"

    return MessageAnalysisResponse(
        risk_score=risk_score,
        risk_level=risk_level,
        detected_signals=detected_signals,
        warning_signals=warning_signals,
        verdict=verdict,
        summary=explanation,
        explanation=explanation,
        safe_next_steps=safe_steps,
        limitations=limitations,
        redacted_message_preview=redacted_preview,
        ml_prediction=ml_prediction,
        ml_probability=ml_prob,
        model_version=model_version,
        model_type=model_type
    )
