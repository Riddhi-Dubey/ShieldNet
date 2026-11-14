import re
from typing import List, Dict, Any, Tuple
from backend.app.schemas.analysis import SignalDetail, MessageAnalysisResponse
from backend.app.services.risk_scoring import calculate_risk_level
from backend.app.security.redaction import redact_sensitive_text

# Categorized threat pattern detectors
SIGNAL_PATTERNS = {
    "URGENCY": {
        "weight": 14.0,
        "category": "Psychological Coercion",
        "description": "High-pressure urgency tactics to prevent critical reflection",
        "patterns": [
            r"\b(urgent|immediately|within\s+24\s*hours?|account\s+blocked|account\s+suspended|deactivated\s+today|last\s+notice|final\s+warning|expire\s+soon|immediate\s+action)\b"
        ]
    },
    "ADVANCE_PAYMENT": {
        "weight": 22.0,
        "category": "Financial Demand",
        "description": "Request for advance fees, registration charges, or refundable security deposits",
        "patterns": [
            r"\b(processing\s+fee|registration\s+fee|security\s+deposit|advance\s+payment|refundable\s+deposit|customs\s+clearance\s+charge|pay\s+upfront|courier\s+fee)\b"
        ]
    },
    "OTP_REQUEST": {
        "weight": 28.0,
        "category": "Credential Extraction",
        "description": "Direct solicitation of One-Time Password (OTP) or authentication codes",
        "patterns": [
            r"\b(share\s+(?:the\s+)?otp|send\s+(?:the\s+)?(?:otp|code)|forward\s+(?:the\s+)?code|verify\s+(?:your\s+)?otp|tell\s+me\s+the\s+otp|enter\s+otp\s+on\s+call)\b"
        ]
    },
    "PIN_OR_PASSWORD": {
        "weight": 30.0,
        "category": "Credential Theft",
        "description": "Direct request for UPI PIN, ATM PIN, or banking passwords",
        "patterns": [
            r"\b(atm\s+pin|upi\s+pin|mpin|net\s*banking\s+password|login\s+password|secret\s+pin|enter\s+pin\s+to\s+receive)\b"
        ]
    },
    "PRIZE_OR_LOTTERY": {
        "weight": 20.0,
        "category": "Baiting / Lottery Scam",
        "description": "Unsolicited claims of winnings, lucky draws, or massive cash rewards",
        "patterns": [
            r"\b(won\s+lottery|congratulations\s+you\s+(?:have\s+)?won|cash\s+prize|lucky\s+draw|kbc\s+lottery|selected\s+winner|claim\s+your\s+prize|car\s+reward|jackpot)\b"
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
        "weight": 18.0,
        "category": "Payment Misdirection",
        "description": "Suspicious payment requests via gift cards, crypto transfers, or QR codes to receive funds",
        "patterns": [
            r"\b(scan\s+qr\s+to\s+receive|gift\s+card|crypto\s+transfer|usdt\s+deposit|send\s+money\s+to\s+vpa|pay\s+to\s+confirm)\b"
        ]
    },
    "IMPERSONATION": {
        "weight": 20.0,
        "category": "Authority Impersonation",
        "description": "Impersonation of established banks, law enforcement, utility boards, or delivery services",
        "patterns": [
            r"\b(sbi\s+(?:bank|yono)|hdfc\s+bank|icici\s+bank|rbi|income\s+tax\s+department|customs\s+department|mumbai\s+police|cyber\s+crime\s+branch|electricity\s+officer|fedex\s+officer)\b"
        ]
    },
    "SUSPICIOUS_CONTACT": {
        "weight": 12.0,
        "category": "Out-of-Band Channel",
        "description": "Channel redirection to unverified Telegram channels or WhatsApp links",
        "patterns": [
            r"\b(t\.me\/[a-zA-Z0-9_]+|wa\.me\/\d+|telegram\s+channel|join\s+whatsapp\s+group)\b"
        ]
    },
    "SUSPICIOUS_LINKS": {
        "weight": 16.0,
        "category": "Obfuscated / Suspicious Link",
        "description": "URL shorteners, raw IP links, or deceptive domain links",
        "patterns": [
            r"\b(?:https?:\/\/)?(?:bit\.ly|tinyurl\.com|is\.gd|t\.co|cutt\.ly|rb\.gy)\/[a-zA-Z0-9_\-]+",
            r"\bhttps?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"
        ]
    }
}


def analyze_scam_message(message: str, sender: str = None) -> MessageAnalysisResponse:
    """
    Performs explainable, heuristic rule-based risk evaluation of a suspicious message.
    Redacts sensitive text and generates actionable safety steps and limitations.
    """
    detected_signals: List[SignalDetail] = []
    total_score = 0.0

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
            # Apply slight dampening if multiple signals are present to avoid linear runaway
            contribution = round(weight * (1.0 / (1.0 + 0.05 * len(detected_signals))), 2)
            total_score += contribution

            detected_signals.append(SignalDetail(
                category=rule["category"],
                signal_name=key,
                weight=weight,
                contribution=contribution,
                description=rule["description"],
                evidence_snippet=redact_sensitive_text(evidence_snippet) if evidence_snippet else None
            ))

    # Normalize score between 0 and 100
    risk_score = min(100.0, round(total_score, 1))
    risk_level = calculate_risk_level(risk_score)

    # Explanation generation
    if not detected_signals:
        explanation = (
            "No known prominent scam signatures (urgency, OTP solicitation, fake job offers, "
            "lottery lures, or bank impersonation) were identified in the submitted text."
        )
    else:
        sig_names = [s.signal_name.replace("_", " ").title() for s in detected_signals]
        explanation = (
            f"Evaluated {len(detected_signals)} suspicious behavioral signal(s): {', '.join(sig_names)}. "
            f"The combination of {detected_signals[0].category.lower()} indicators contributes significantly "
            f"to the overall heuristic risk classification."
        )

    # Safe next steps tailored to findings
    safe_steps: List[str] = [
        "Never share OTPs, UPI PINs, or banking passwords with anyone under any circumstances.",
        "Remember: You never need to enter your UPI PIN or scan a QR code to RECEIVE money.",
        "Do not click on unverified shortlinks or download remote access software (AnyDesk, TeamViewer).",
        "Verify suspicious communications directly through official banking apps or verified numbers."
    ]

    if any(s.signal_name in ["OTP_REQUEST", "PIN_OR_PASSWORD"] for s in detected_signals):
        safe_steps.insert(0, "CRITICAL: Do NOT send or disclose any one-time code or PIN.")
    if any(s.signal_name in ["IMPERSONATION", "URGENCY"] for s in detected_signals):
        safe_steps.append("If this claims to be your bank or an electricity board, contact their official branch directly.")
    if risk_score >= 60.0:
        safe_steps.append("Report financial cyber fraud immediately to the National Cyber Crime Helpline at 1930 or cybercrime.gov.in.")

    limitations = (
        "Heuristic analysis uses pattern-matching rules and explainable indicator weights. "
        "It does not represent calibrated mathematical probability or definitive legal proof of fraud. "
        "Zero detected indicators does not guarantee that a message is completely benign."
    )

    redacted_preview = redact_sensitive_text(message)

    warning_signals = [
        {
            "signal": s.signal_name,
            "title": s.signal_name,
            "severity": "CRITICAL" if s.weight >= 30 else "HIGH" if s.weight >= 20 else "MEDIUM" if s.weight >= 10 else "LOW",
            "explanation": s.description,
            "description": s.description,
            "evidence_snippet": s.evidence_snippet
        }
        for s in detected_signals
    ]

    verdict = f"{risk_level.upper()} FRAUD RISK DETECTED" if risk_score >= 40 else "LIKELY LOW RISK PATTERN"

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
        redacted_message_preview=redacted_preview
    )
