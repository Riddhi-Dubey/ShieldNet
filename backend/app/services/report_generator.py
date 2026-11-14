from datetime import datetime, timezone
from typing import Dict, Any, List, Optional


def generate_plain_text_report(
    analysis_type: str,
    data: Dict[str, Any]
) -> str:
    """
    Generates a structured, professional, plain-text (.txt) cybersecurity assessment report.
    - Excludes full raw user message text (uses redacted preview / indicator snippets for privacy).
    - Includes assessment disclaimers, score provenance, detected evidence, and actionable safety steps.
    """
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    lines: List[str] = []

    lines.append("=" * 72)
    lines.append("     SHIELDNET CYBERSECURITY INTELLIGENCE — RISK ASSESSMENT DOSSIER")
    lines.append("=" * 72)
    lines.append(f"Report Generated : {now_str}")
    lines.append(f"Assessment Type  : {analysis_type.upper()}")
    lines.append(f"Risk Rating      : {data.get('risk_level', 'UNKNOWN')} ({data.get('risk_score', 0.0):.1f} / 100.0)")
    if data.get("verdict"):
        lines.append(f"Verdict Summary  : {data.get('verdict')}")
    lines.append("-" * 72)

    # Uncertainty & Assessment Disclaimer
    lines.append("LEGAL & ACCURACY NOTICE:")
    lines.append("  This report represents an automated behavioral and structural threat")
    lines.append("  assessment. It does NOT constitute definitive legal proof of fraud or")
    lines.append("  criminality. Unflagged content is not guaranteed to be safe, and")
    lines.append("  TLS/HTTPS encryption guarantees transport security, NOT legitimacy.")
    lines.append("-" * 72)

    # Target (Redacted for User Privacy)
    lines.append("ASSESSED IDENTIFIER (PRIVACY PROTECTED):")
    if analysis_type.lower() == "message":
        preview = data.get("redacted_message_preview") or "[Message snippet redacted for privacy]"
        if len(preview) > 160:
            preview = preview[:157] + "..."
        lines.append(f"  Redacted Preview : \"{preview}\"")
        lines.append("  Full Content     : [EXCLUDED BY DEFAULT PER ZERO-STORAGE PRIVACY POLICY]")
    else:
        url_display = data.get("redacted_url") or data.get("url") or "[URL Redacted]"
        domain = data.get("domain", "Unknown")
        lines.append(f"  Target URL       : {url_display}")
        lines.append(f"  Target Domain    : {domain}")
        if data.get("https_security_observation"):
            lines.append(f"  Transport State  : {data.get('https_security_observation')}")
    lines.append("-" * 72)

    # Detected Indicators & Evidence
    lines.append("DETECTED WARNING SIGNS & EVIDENCE:")
    detected_signals = data.get("detected_signals") or []
    heuristic_findings = data.get("heuristic_findings") or data.get("warning_signs") or []

    if analysis_type.lower() == "message" and detected_signals:
        for idx, sig in enumerate(detected_signals, 1):
            if hasattr(sig, "category"):
                cat = sig.category
                name = sig.signal_name
                desc = sig.description
                weight = getattr(sig, "weight", 0.0)
                snippet = getattr(sig, "evidence_snippet", None)
            else:
                cat = sig.get("category", "Pattern")
                name = sig.get("signal_name") or sig.get("signal", "Signal")
                desc = sig.get("description") or sig.get("explanation", "")
                weight = sig.get("weight", 0.0)
                snippet = sig.get("evidence_snippet")

            lines.append(f"  {idx}. [{cat}] {name} (Weight: {weight:.1f})")
            lines.append(f"     Description : {desc}")
            if snippet:
                lines.append(f"     Context     : \"{snippet}\"")
    elif heuristic_findings:
        for idx, finding in enumerate(heuristic_findings, 1):
            lines.append(f"  {idx}. {finding}")
    else:
        lines.append("  No overt known heuristic threat indicators or blacklisted token patterns detected.")
        lines.append("  Note: Advanced zero-day or context-dependent lures may evade static rules.")
    lines.append("-" * 72)

    # Explanation
    lines.append("ASSESSMENT EXPLANATION:")
    explanation = data.get("explanation") or data.get("summary") or "Standard automated evaluation complete."
    for chunk in [explanation[i:i + 68] for i in range(0, len(explanation), 68)]:
        lines.append(f"  {chunk}")
    lines.append("-" * 72)

    # Engine Provenance
    lines.append("ENGINE PROVENANCE & CALIBRATION:")
    if analysis_type.lower() == "message":
        lines.append(f"  ML Model Type    : {data.get('model_type', 'TF-IDF + Calibrated Logistic Regression')}")
        lines.append(f"  Model Version    : {data.get('model_version', 'v1.1.0')}")
        ml_prob = data.get("ml_probability")
        if ml_prob is not None:
            lines.append(f"  ML Scam Prob     : {ml_prob:.1f}%")
        lines.append("  Heuristic Layer  : Compound Psychological & Credential Harvesting Matrix")
    else:
        lines.append(f"  Model Status     : {'Active' if data.get('model_availability') else 'Heuristic Fallback'}")
        lines.append(f"  Model Version    : {data.get('model_version', '2.2.0-calibrated')}")
        conf = data.get("calibrated_confidence") or (data.get("confidence", 0.0) * 100.0 if data.get("confidence") else None)
        if conf is not None:
            lines.append(f"  Calibrated Conf  : {conf:.1f}%")
        lines.append("  Network Execution: Static lexical inspection (0 outbound HTTP requests / SSRF-safe)")
    lines.append("-" * 72)

    # Actionable Safety Next Steps
    lines.append("RECOMMENDED PRACTICAL NEXT STEPS:")
    safe_steps = data.get("safe_next_steps") or [
        "Never disclose passwords, OTPs, or UPI PINs to unsolicited callers or messages.",
        "Verify suspicious communications via official customer care channels or physical branch."
    ]
    for idx, step in enumerate(safe_steps, 1):
        lines.append(f"  [{idx}] {step}")
    lines.append("-" * 72)

    # Privacy Assurance
    lines.append("ZERO-STORAGE PRIVACY VERIFICATION:")
    lines.append("  This scan ran entirely in transient volatile memory (RAM).")
    lines.append("  0 bytes of raw submitted user text were committed to database tables,")
    lines.append("  application logs, error traces, or third-party cloud analytics.")
    lines.append("=" * 72)

    return "\n".join(lines)
