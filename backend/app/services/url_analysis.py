from urllib.parse import urlparse
from typing import List, Dict, Any, Optional
from backend.app.schemas.analysis import UrlAnalysisResponse
from backend.app.ml.predict import predict_url_phishing
from backend.app.services.risk_scoring import calculate_risk_level
from backend.app.security.validation import is_ssrf_risk, sanitize_and_redact_url
from backend.app.services.report_generator import generate_plain_text_report
from backend.app.services.llm_explainer import generate_llm_explanation


def analyze_scam_url(url: str, consent_for_llm: bool = False) -> UrlAnalysisResponse:
    """
    Performs comprehensive structural, lexical, and machine-learning risk assessment of a URL.
    - Safely inspects syntax without making any outbound network requests (SSRF-safe).
    - Robustly parses missing schemes, embedded credentials, IDN/Punycode, ports, IPv4/IPv6, and query parameters.
    - Redacts sensitive query parameters (passwords, tokens, OTPs) and embedded credentials in display output.
    - Distinguishes structural checks from verified threat matches; HTTPS alone never lowers risk.
    """
    clean_url = url.strip()
    canonical_url, redacted_url, meta = sanitize_and_redact_url(clean_url)

    parsed = urlparse(canonical_url)
    domain = meta.get("punycode_host") or (parsed.hostname or parsed.netloc or "").lower()

    # SSRF & Loopback Security Notice
    ssrf_detected = meta.get("is_ssrf_risk", False) or is_ssrf_risk(domain)

    # ML Model Prediction
    ml_result = predict_url_phishing(canonical_url)
    features = ml_result["features"]
    model_available = ml_result["model_available"]
    model_version = ml_result.get("model_version", "2.2.0-calibrated")
    model_pred = ml_result["prediction"]
    confidence = ml_result["confidence"]
    phishing_prob = ml_result.get("phishing_probability", 0.0)

    # Assemble explainable heuristic findings
    heuristic_findings: List[str] = []

    if ssrf_detected:
        heuristic_findings.append("Target resolves to internal, loopback, or private network space (SSRF Hazard).")

    if meta.get("has_credentials"):
        heuristic_findings.append("URL contains embedded user credentials (user:password@host), commonly used to disguise destination.")

    if meta.get("is_idn") or features.get("punycode_presence", 0) > 0:
        heuristic_findings.append(f"Domain utilizes Internationalized Domain Name (IDN) / Punycode ('{domain}') suggesting lookalike homoglyph spoofing.")

    if meta.get("is_ip") or features.get("ip_address_presence", 0) > 0:
        heuristic_findings.append("Host is a direct raw numeric IP address rather than an established domain name.")

    if meta.get("has_sensitive_query"):
        heuristic_findings.append("URL query parameters contain sensitive authentication tokens, passwords, or personal credentials.")

    if meta.get("port") and meta["port"] not in (80, 443):
        heuristic_findings.append(f"URL uses a non-standard network port ({meta['port']}).")

    if meta.get("trailing_dot_removed"):
        heuristic_findings.append("URL includes a trailing dot hostname trick (e.g. domain.com.) occasionally used to bypass simple filters.")

    if features.get("shortener_presence", 0) > 0:
        heuristic_findings.append("URL uses an obfuscating redirection shortener service.")

    if features.get("suspicious_tld_presence", 0) > 0:
        heuristic_findings.append("Domain utilizes a high-abuse top-level domain frequently associated with disposable fraud infrastructure.")

    if features.get("suspicious_keyword_count", 0) > 0:
        heuristic_findings.append(f"URL string contains {int(features['suspicious_keyword_count'])} sensitive security/banking keywords.")

    if features.get("subdomain_count", 0) >= 3:
        heuristic_findings.append(f"Excessive subdomain nesting detected ({int(features['subdomain_count'])} subdomains).")

    if features.get("shannon_entropy", 0) > 4.2:
        heuristic_findings.append(f"High character randomness / Shannon entropy ({features['shannon_entropy']:.2f}) observed in hostname or path.")

    if features.get("https_presence", 0) == 0:
        heuristic_findings.append("Insecure plain HTTP protocol in use (lacks transport encryption).")

    if features.get("url_length", 0) > 85:
        heuristic_findings.append(f"Unusually long URL length ({int(features['url_length'])} characters).")

    if features.get("hyphen_count", 0) >= 3:
        heuristic_findings.append(f"Multiple hyphens in domain or path ({int(features['hyphen_count'])} hyphens), typical of brand-spoofing domains.")

    # Risk score calculation
    if model_available:
        base_risk = phishing_prob * 75.0
    else:
        # Graceful fallback: heuristic baseline
        base_risk = 20.0 if heuristic_findings else 10.0

    # Add heuristic modifiers
    modifier = 0.0
    if meta.get("has_credentials"):
        modifier += 25.0
    if meta.get("is_ip") or features.get("ip_address_presence", 0) > 0:
        modifier += 20.0
    if meta.get("is_idn") or features.get("punycode_presence", 0) > 0:
        modifier += 20.0
    if features.get("shortener_presence", 0) > 0:
        modifier += 15.0
    if features.get("suspicious_tld_presence", 0) > 0:
        modifier += 15.0
    if features.get("suspicious_keyword_count", 0) >= 2:
        modifier += 15.0
    if ssrf_detected:
        modifier += 25.0

    raw_risk = min(100.0, base_risk + modifier)
    risk_score = round(raw_risk, 1)
    risk_level = calculate_risk_level(risk_score)

    # HTTPS Nuance Explanation
    if clean_url.lower().startswith("https://"):
        https_observation = (
            "TLS Encryption Active: Transport connection is encrypted. "
            "CRITICAL CAVEAT: HTTPS ensures transport encryption between your browser and the server; "
            "it does NOT guarantee that the recipient or domain is legitimate. "
            "Over 80% of modern phishing sites use free, automated TLS certificates."
        )
    else:
        https_observation = (
            "Plain Insecure HTTP: Connection is unencrypted. "
            "Any passwords, numbers, or details submitted over this connection can be intercepted in transit."
        )

    # Objective non-alarmist assessment explanation
    if not model_available:
        model_pred = "UNCERTAIN"
        explanation = (
            f"Machine learning inference engine was offline. Evaluation based strictly on structural heuristic indicators "
            f"({risk_score}/100). Indicators: {'; '.join(heuristic_findings[:3]) if heuristic_findings else 'None overt'}. "
            f"High uncertainty: verify link independently before proceeding."
        )
    elif model_pred == "PHISHING" or risk_score >= 60.0:
        explanation = (
            f"The URL exhibits structural and lexical characteristics strongly resembling phishing lures or deceptive portals "
            f"(Structural risk score: {risk_score}/100). Primary indicators: "
            f"{'; '.join(heuristic_findings[:3]) if heuristic_findings else 'High model confidence'}."
        )
    elif risk_score >= 30.0:
        explanation = (
            f"The URL displays moderate structural anomalies ({risk_score}/100) such as unusual parameters, high entropy, or lack of TLS. "
            f"Caution is advised when interacting with this link."
        )
    else:
        explanation = (
            f"Automated lexical scan detected no major structural phishing anomalies ({risk_score}/100). "
            f"Note: A low risk score does not guarantee safety; newly registered domains can host undetected threats."
        )

    safe_next_steps = [
        "Do not enter passwords, OTPs, or payment information on unverified portals.",
        "Check the address bar closely for misspelled domain names (typosquatting).",
        "Navigate to official banking or institutional portals by typing their verified URL directly.",
        "Remember that a green padlock or HTTPS does not prove a website is genuine."
    ]

    limitations = (
        "Analysis is performed entirely statically on the URL string without active HTTP network retrieval. "
        "Neither model confidence nor heuristic score constitutes a legal determination of criminality. "
        "A low score does NOT guarantee that a link is safe or benign."
    )

    domain_info = {
        "domain": domain,
        "punycode": meta.get("punycode_host"),
        "protocol": "HTTPS (TLS Active)" if clean_url.lower().startswith("https://") else "Insecure HTTP Protocol",
        "is_ip_host": meta.get("is_ip", False),
        "port": meta.get("port") or (443 if clean_url.lower().startswith("https://") else 80),
        "shannon_entropy": features.get("shannon_entropy", 0.0)
    }

    assessment_notice = (
        "Automated static risk assessment based on lexical and structural features. "
        "Does not constitute legal proof. HTTPS encryption does not guarantee domain legitimacy."
    )

    # Assemble report and optional LLM explainer data
    report_data = {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "url": clean_url,
        "redacted_url": redacted_url,
        "domain": domain,
        "heuristic_findings": heuristic_findings,
        "warning_signs": heuristic_findings,
        "explanation": explanation,
        "https_security_observation": https_observation,
        "model_availability": model_available,
        "model_version": model_version,
        "confidence": confidence,
        "calibrated_confidence": round(confidence * 100.0, 1) if confidence else None,
        "safe_next_steps": safe_next_steps
    }

    report_text = generate_plain_text_report("url", report_data)
    llm_explanation = generate_llm_explanation("url", report_data, user_consent=consent_for_llm)

    return UrlAnalysisResponse(
        url=clean_url,
        redacted_url=redacted_url,
        domain=domain,
        model_prediction=model_pred,
        confidence=confidence,
        calibrated_confidence=round(confidence * 100.0, 1) if confidence else None,
        model_version=model_version,
        model_availability=model_available,
        heuristic_findings=heuristic_findings,
        warning_signs=heuristic_findings,
        risk_score=risk_score,
        risk_level=risk_level,
        explanation=explanation,
        https_security_observation=https_observation,
        safe_next_steps=safe_next_steps,
        limitations=limitations,
        domain_info=domain_info,
        assessment_notice=assessment_notice,
        report_text=report_text,
        llm_explanation=llm_explanation
    )
