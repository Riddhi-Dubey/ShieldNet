import os
import re
from typing import List, Dict, Any, Tuple, Optional
import joblib
from backend.app.schemas.analysis import SignalDetail, MessageAnalysisResponse
from backend.app.services.risk_thresholds import (
    MESSAGE_PROBABILITY_THRESHOLDS,
    calculate_message_risk_from_probability
)
from backend.app.security.redaction import redact_sensitive_text
from backend.app.services.report_generator import generate_plain_text_report
from backend.app.services.llm_explainer import generate_llm_explanation

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


def extract_model_features(model, vectorizer, text: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Extracts the genuine strongest positive features (tokens/n-grams) from the calibrated
    Logistic Regression model that contributed to the scam probability prediction.
    Never fabricates attributions; returns [] if no positive coefficients match.
    """
    if model is None or vectorizer is None:
        return []

    try:
        import numpy as np
        if hasattr(model, "calibrated_classifiers_"):
            coefs = np.mean([cc.estimator.coef_[0] for cc in model.calibrated_classifiers_], axis=0)
        elif hasattr(model, "coef_"):
            coefs = model.coef_[0]
        else:
            return []

        feature_names = vectorizer.get_feature_names_out()
        vec = vectorizer.transform([text]).toarray()[0]
        contributions = vec * coefs

        positive_indices = [i for i in range(len(contributions)) if contributions[i] > 0.001]
        if not positive_indices:
            return []

        sorted_indices = sorted(positive_indices, key=lambda i: contributions[i], reverse=True)[:top_k]
        return [
            {
                "feature": str(feature_names[i]),
                "weight": round(float(contributions[i]), 4)
            }
            for i in sorted_indices
        ]
    except Exception:
        return []

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
            r"\b(share\s+(?:your\s+|the\s+)?(?:one[\s-]*time[\s-]*password\s+)?(?:otp|code)|send\s+(?:your\s+|the\s+)?(?:otp|code)|forward\s+(?:the\s+)?code|verify\s+(?:your\s+)?otp|tell\s+me\s+the\s+otp|enter\s+otp\s+on\s+call|one[\s-]*time[\s-]*password)\b"
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


def analyze_scam_message(message: str, sender: str = None, consent_for_llm: bool = False) -> MessageAnalysisResponse:
    """
    Performs explainable, privacy-preserving risk evaluation of a suspicious message.
    Redacts sensitive text in memory, applies compound risk multipliers, synthesizes calibrated ML probability,
    and generates actionable safety guidance without declaring definitive legal guilt.
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

    # 5. OTP / PIN Request + Urgency, Cancellation or Payment Alert
    if ("OTP_REQUEST" in signal_keys or "PIN_OR_PASSWORD" in signal_keys) and (
        "URGENCY" in signal_keys or any(term in lower_text for term in ["cancel", "debit", "pending", "block", "verify", "payment"])
    ):
        compound_boost += 30.0

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
            model_version = meta.get("model_version", "v1.1.0") if meta else "v1.1.0"
            model_type = meta.get("model_type", "TF-IDF + Calibrated Logistic Regression") if meta else "TF-IDF + Calibrated Logistic Regression"
        except Exception:
            ml_prob = None
            model_version = "heuristic-fallback-v1.0"
            model_type = "Rule-Based Heuristic Parser (ML Offline)"
    else:
        ml_prob = None
        model_version = "heuristic-fallback-v1.0"
        model_type = "Rule-Based Heuristic Parser (ML Offline)"

    raw_total = base_score + compound_boost
    heuristic_score = min(100.0, round(raw_total, 1))

    # Derive risk tier directly from calibrated model probability
    risk_assessment = calculate_message_risk_from_probability(ml_prob)
    risk_level = risk_assessment["risk_level"]
    display_label = risk_assessment["display_label"]

    # Extract genuine contributing features from model (if model is available)
    model_features = extract_model_features(model, vectorizer, message, top_k=5) if (model is not None and vectorizer is not None) else []

    if ml_prob is None:
        # Handle missing or invalid model probabilities with an "Unable to assess" state
        risk_score = None
        ml_prediction = "UNABLE_TO_ASSESS"
        verdict = "UNABLE TO ASSESS — STATISTICAL MODEL PROBABILITY UNAVAILABLE"
        summary = "Unable to assess: Machine learning model probability unavailable."
        explanation = (
            "The statistical machine learning model was unable to compute a calibrated scam probability "
            "for this message. As a result, no automated risk level has been assigned. "
            "Please exercise heightened caution with unsolicited messages."
        )
    else:
        # Model probability is the sole source of truth for scam probability and risk level
        risk_score = ml_prob
        ml_prediction = "SCAM_OR_FRAUD" if ml_prob >= 50.0 else "BENIGN"
        verdict = f"{risk_level} RISK ASSESSMENT — {ml_prob:.1f}% SCAM PROBABILITY"
        summary = f"{display_label}: Evaluated at {ml_prob:.1f}% scam probability by calibrated model."

        if risk_level in ["MEDIUM", "HIGH"]:
            explanation_parts = [
                f"The model evaluated a {ml_prob:.1f}% scam probability ({display_label})."
            ]

            if model_features:
                feat_tokens = [f'"{f["feature"]}"' for f in model_features]
                explanation_parts.append(
                    f"Strongest model text features contributing to this prediction: {', '.join(feat_tokens)}."
                )
            else:
                explanation_parts.append(
                    "The model estimates elevated scam risk from the message’s overall text patterns, but no individual warning trigger was identified."
                )

            if not detected_signals:
                explanation_parts.append(
                    "Separately, no explicit heuristic warning triggers were matched (Heuristic Indicator Score: 0/100). "
                    "Note: A 0/100 heuristic score does not cancel or disprove the model's statistical assessment; "
                    "the heuristic scan checks for predefined trigger phrases, whereas the model evaluates broader linguistic patterns."
                )
            else:
                sig_names = [s.signal_name.replace("_", " ").title() for s in detected_signals]
                explanation_parts.append(
                    f"Separately, {len(detected_signals)} rule-based warning trigger(s) were flagged: {', '.join(sig_names)} "
                    f"(Heuristic Indicator Score: {heuristic_score}/100)."
                )

            explanation = " ".join(explanation_parts)

        else: # LOW RISK (< 30%)
            explanation_parts = [
                f"The statistical model evaluated a {ml_prob:.1f}% scam probability ({display_label})."
            ]
            if not detected_signals:
                explanation_parts.append(
                    "No rule-based warning triggers were identified (Heuristic Indicator Score: 0/100). "
                    "Note: A low probability or absence of matched triggers indicates low statistical risk but does not guarantee absolute safety."
                )
            else:
                sig_names = [s.signal_name.replace("_", " ").title() for s in detected_signals]
                explanation_parts.append(
                    f"Heuristic pattern scan noted isolated signal(s): {', '.join(sig_names)} "
                    f"(Heuristic Indicator Score: {heuristic_score}/100), but overall linguistic composition remains in the low risk band."
                )
            explanation = " ".join(explanation_parts)

    # Safe next steps tailored strictly to the displayed risk band
    if risk_level == "HIGH":
        safe_steps: List[str] = [
            "CRITICAL: Do not click any links, open attachments, or call numbers listed in the message.",
            "Never disclose OTPs, banking passwords, UPI PINs, or identity documents (Aadhaar/PAN).",
            "Verify sender identity independently through official customer support channels or official apps.",
            "Report potential cyber fraud immediately to the National Cyber Crime Helpline at 1930 or https://cybercrime.gov.in.",
            "Block and report the sender on your messaging or mobile carrier platform."
        ]
    elif risk_level == "MEDIUM":
        safe_steps: List[str] = [
            "Exercise caution: The model identified elevated scam risk resembling known fraudulent lures.",
            "Do not click unverified links, forward codes, or transfer funds without independent verification.",
            "Verify the claim independently: Contact the supposed organization directly using an official number from their official website.",
            "Remember that genuine organizations will never pressure you to make immediate payments or share sensitive security codes.",
            "If suspicious, report the sender or forward the message to 1909 (National DND/Spam registry)."
        ]
    elif risk_level == "LOW":
        safe_steps: List[str] = [
            "No overt scam indicators or high statistical risk detected in this message.",
            "Always exercise standard caution: A low probability assessment does not guarantee absolute authenticity.",
            "Never disclose OTPs, passwords, or UPI PINs even if a communication appears familiar."
        ]
    else: # UNABLE_TO_ASSESS
        safe_steps: List[str] = [
            "Treat unsolicited communications with heightened caution when automated probability cannot be evaluated.",
            "Verify the sender independently through official customer care channels.",
            "Never disclose passwords, OTPs, or financial information to unknown parties."
        ]

    # Specific contextual triggers
    if any(s.signal_name in ["OTP_REQUEST", "PIN_OR_PASSWORD"] for s in detected_signals):
        safe_steps.insert(0, "CRITICAL: Do NOT send or disclose any one-time code or PIN.")
    if any(s.signal_name in ["IMPERSONATION", "KYC_HARVESTING"] for s in detected_signals):
        safe_steps.insert(0, "IMPORTANT: Banks NEVER suspend accounts via SMS links demanding online KYC updates.")

    limitations = (
        "This evaluation is an automated risk assessment based on calibrated statistical machine learning. "
        "It does NOT represent a legal determination or guaranteed proof of fraud. "
        "A low probability score does NOT guarantee that an unsolicited message is benign."
    )

    redacted_preview = redact_sensitive_text(message)

    warning_signals = [
        {
            "signal": s.signal_name,
            "title": s.signal_name.replace("_", " ").title(),
            "severity": "CRITICAL" if (s.weight >= 26.0 and risk_level == "HIGH") else "HIGH" if risk_level == "HIGH" else "MEDIUM" if risk_level == "MEDIUM" else "LOW",
            "explanation": s.description,
            "description": s.description,
            "evidence_snippet": s.evidence_snippet
        }
        for s in detected_signals
    ]

    assessment_notice = (
        "Automated risk assessment based on behavioral and structural patterns. "
        "Does not constitute legal proof or a guaranteed fraud determination."
    )

    # Assemble data dict for report and optional LLM explainer
    report_data = {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "heuristic_score": heuristic_score,
        "verdict": verdict,
        "detected_signals": detected_signals,
        "warning_signals": warning_signals,
        "model_contributing_features": model_features,
        "explanation": explanation,
        "summary": summary,
        "safe_next_steps": safe_steps,
        "redacted_message_preview": redacted_preview,
        "ml_probability": ml_prob,
        "ml_prediction": ml_prediction,
        "model_version": model_version,
        "model_type": model_type,
    }

    report_text = generate_plain_text_report("message", report_data)
    llm_explanation = generate_llm_explanation("message", report_data, user_consent=consent_for_llm)

    return MessageAnalysisResponse(
        risk_score=risk_score,
        risk_level=risk_level,
        heuristic_score=heuristic_score,
        detected_signals=detected_signals,
        warning_signals=warning_signals,
        model_contributing_features=model_features,
        verdict=verdict,
        summary=summary,
        explanation=explanation,
        safe_next_steps=safe_steps,
        limitations=limitations,
        redacted_message_preview=redacted_preview,
        ml_prediction=ml_prediction,
        ml_probability=ml_prob,
        model_version=model_version,
        model_type=model_type,
        assessment_notice=assessment_notice,
        report_text=report_text,
        llm_explanation=llm_explanation
    )
