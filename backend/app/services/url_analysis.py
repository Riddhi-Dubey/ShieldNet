from urllib.parse import urlparse
from typing import List, Dict, Any, Optional
from backend.app.schemas.analysis import UrlAnalysisResponse
from backend.app.ml.predict import predict_url_phishing
from backend.app.services.risk_scoring import calculate_risk_level
from backend.app.security.validation import is_ssrf_risk, sanitize_and_redact_url
from backend.app.services.report_generator import generate_plain_text_report
from backend.app.services.llm_explainer import generate_llm_explanation
from backend.app.services.help_contacts import get_help_contacts


def analyze_scam_url(url: str, country: str = "IN", consent_for_llm: bool = False) -> UrlAnalysisResponse:
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

    # Assemble explainable heuristic findings and structured warning signals
    heuristic_findings: List[str] = []
    warning_signals: List[Dict[str, Any]] = []

    if ssrf_detected:
        heuristic_findings.append("Target resolves to internal, loopback, or private network space (SSRF Hazard).")
        warning_signals.append({
            "signal": "SSRF_HAZARD",
            "title": "Internal Network Destination",
            "severity": "Critical",
            "formatted_title": "[Critical] Internal Network Destination",
            "explanation": "The URL targets private, local, or loopback network addresses instead of a public internet website.",
            "safety_action": "Do not interact with or submit requests to private local network endpoints."
        })

    if meta.get("has_credentials"):
        heuristic_findings.append("URL contains embedded user credentials (user:password@host), commonly used to disguise destination.")
        warning_signals.append({
            "signal": "EMBEDDED_CREDENTIALS",
            "title": "Embedded Login Credentials in URL",
            "severity": "High",
            "formatted_title": "[High] Embedded Login Credentials in URL",
            "explanation": "The URL embeds username/password syntax (user:pass@domain), commonly used to disguise the real destination you are visiting.",
            "safety_action": "Never visit links containing '@' symbols before the host domain. Check the address bar to ensure you are on the intended site."
        })

    if meta.get("is_idn") or features.get("punycode_presence", 0) > 0:
        heuristic_findings.append(f"Domain utilizes Internationalized Domain Name (IDN) / Punycode ('{domain}') suggesting lookalike homoglyph spoofing.")
        warning_signals.append({
            "signal": "PUNYCODE_HOMOGLYPH",
            "title": "Lookalike / Punycode Spoofing",
            "severity": "High",
            "formatted_title": "[High] Lookalike / Punycode Spoofing",
            "explanation": f"The domain uses special Punycode characters ('{domain}') that visually imitate legitimate brand names.",
            "safety_action": "Type the website name manually into your browser instead of clicking this link."
        })

    if meta.get("is_ip") or features.get("ip_address_presence", 0) > 0:
        heuristic_findings.append("Host is a direct raw numeric IP address rather than an established domain name.")
        warning_signals.append({
            "signal": "RAW_IP_HOST",
            "title": "Direct IP Address Host",
            "severity": "High",
            "formatted_title": "[High] Direct IP Address Host",
            "explanation": "The link points directly to a raw numeric IP address rather than a verified registered domain name.",
            "safety_action": "Legitimate organizations and banks always use registered domain names. Avoid entering details on raw IP addresses."
        })

    if meta.get("has_sensitive_query"):
        heuristic_findings.append("URL query parameters contain sensitive authentication tokens, passwords, or personal credentials.")
        warning_signals.append({
            "signal": "SENSITIVE_QUERY",
            "title": "Exposed Sensitive Query Parameters",
            "severity": "High",
            "formatted_title": "[High] Exposed Sensitive Query Parameters",
            "explanation": "The link exposes sensitive credentials, session tokens, or passwords in unencrypted URL query parameters.",
            "safety_action": "Do not forward or share this link, as query parameters can leak credentials to web servers and third-party trackers."
        })

    if meta.get("port") and meta["port"] not in (80, 443):
        heuristic_findings.append(f"URL uses a non-standard network port ({meta['port']}).")
        warning_signals.append({
            "signal": "NON_STANDARD_PORT",
            "title": f"Non-Standard Network Port ({meta['port']})",
            "severity": "Medium",
            "formatted_title": f"[Medium] Non-Standard Network Port ({meta['port']})",
            "explanation": f"The URL connects via port {meta['port']} rather than standard web ports (80 or 443), frequently used to run rogue test servers.",
            "safety_action": "Avoid submitting sensitive data to non-standard ports unless verified by your network administrator."
        })

    if meta.get("trailing_dot_removed"):
        heuristic_findings.append("URL includes a trailing dot hostname trick (e.g. domain.com.) occasionally used to bypass simple filters.")

    if features.get("shortener_presence", 0) > 0:
        heuristic_findings.append("URL uses an obfuscating redirection shortener service.")
        warning_signals.append({
            "signal": "URL_SHORTENER",
            "title": "Obfuscated URL Shortener",
            "severity": "Medium",
            "formatted_title": "[Medium] Obfuscated URL Shortener",
            "explanation": "The URL uses a link shortening service to hide where the link will actually redirect you.",
            "safety_action": "Use a link expander tool or avoid clicking shortened links from unknown or unsolicited senders."
        })

    if features.get("suspicious_tld_presence", 0) > 0:
        heuristic_findings.append("Domain utilizes a high-abuse top-level domain frequently associated with disposable fraud infrastructure.")
        warning_signals.append({
            "signal": "SUSPICIOUS_TLD",
            "title": "High-Abuse Domain Extension",
            "severity": "Medium",
            "formatted_title": "[Medium] High-Abuse Domain Extension",
            "explanation": "The website uses a top-level domain frequently associated with disposable fraud campaigns and phishing setups.",
            "safety_action": "Verify the organization's official website address. Established institutions generally use standard domains like .com, .org, or official country domains."
        })

    if features.get("suspicious_keyword_count", 0) > 0:
        heuristic_findings.append(f"URL string contains {int(features['suspicious_keyword_count'])} sensitive security/banking keywords.")
        warning_signals.append({
            "signal": "SUSPICIOUS_KEYWORDS",
            "title": "Sensitive Banking / Security Keywords",
            "severity": "High",
            "formatted_title": "[High] Sensitive Banking / Security Keywords",
            "explanation": f"The URL includes sensitive keywords ({int(features['suspicious_keyword_count'])} keywords like verify, bank, or login) in an unverified hostname.",
            "safety_action": "Verify whether the root domain actually belongs to the bank before entering any login details."
        })

    if features.get("subdomain_count", 0) >= 3:
        heuristic_findings.append(f"Excessive subdomain nesting detected ({int(features['subdomain_count'])} subdomains).")
        warning_signals.append({
            "signal": "SUBDOMAIN_NESTING",
            "title": "Excessive Subdomain Nesting",
            "severity": "Medium",
            "formatted_title": "[Medium] Excessive Subdomain Nesting",
            "explanation": f"The URL chains multiple subdomains ({int(features['subdomain_count'])} levels) to mimic trusted brand portals.",
            "safety_action": "Look at the domain name right before the top-level extension (e.g. .com) to identify the true owner of the website."
        })

    if features.get("shannon_entropy", 0) > 4.2:
        heuristic_findings.append(f"High character randomness / Shannon entropy ({features['shannon_entropy']:.2f}) observed in hostname or path.")
        warning_signals.append({
            "signal": "HIGH_ENTROPY",
            "title": "High Character Randomness",
            "severity": "Low",
            "formatted_title": "[Low] High Character Randomness",
            "explanation": f"The web address contains an unusually high level of random characters (entropy {features['shannon_entropy']:.2f}), common in algorithmic phishing campaigns.",
            "safety_action": "Check whether this address was generated dynamically and avoid entering personal information."
        })

    if features.get("https_presence", 0) == 0:
        heuristic_findings.append("Insecure plain HTTP protocol in use (lacks transport encryption).")
        warning_signals.append({
            "signal": "INSECURE_HTTP",
            "title": "Unencrypted Plain HTTP Connection",
            "severity": "High",
            "formatted_title": "[High] Unencrypted Plain HTTP Connection",
            "explanation": "The website uses unencrypted HTTP instead of secure HTTPS, allowing anyone on your network to intercept passwords and data.",
            "safety_action": "Never enter passwords, card numbers, or personal info on unencrypted HTTP websites."
        })

    if features.get("url_length", 0) > 85:
        heuristic_findings.append(f"Unusually long URL length ({int(features['url_length'])} characters).")

    if features.get("hyphen_count", 0) >= 3:
        heuristic_findings.append(f"Multiple hyphens in domain or path ({int(features['hyphen_count'])} hyphens), typical of brand-spoofing domains.")
        warning_signals.append({
            "signal": "MULTIPLE_HYPHENS",
            "title": "Multiple Hyphens in Hostname",
            "severity": "Medium",
            "formatted_title": "[Medium] Multiple Hyphens in Hostname",
            "explanation": f"The domain uses multiple hyphens ({int(features['hyphen_count'])}) often seen in deceptive lookalike domains.",
            "safety_action": "Verify the official spelling of the brand website. Scammers use hyphens to create domains resembling authentic names."
        })

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
        if warning_signals:
            explanation = (
                f"The URL exhibits structural and lexical characteristics strongly resembling phishing lures or deceptive portals "
                f"(Structural risk score: {risk_score}/100). Primary indicators: "
                f"{'; '.join(heuristic_findings[:3])}."
            )
        else:
            explanation = (
                f"The model estimates elevated scam risk ({risk_score}/100) from the URL’s overall structural patterns, "
                f"but no individual warning trigger was identified."
            )
    elif risk_score >= 30.0:
        if warning_signals:
            explanation = (
                f"The URL displays moderate structural anomalies ({risk_score}/100) such as unusual parameters, high entropy, or lack of TLS. "
                f"Caution is advised when interacting with this link."
            )
        else:
            explanation = (
                f"The model estimates elevated scam risk ({risk_score}/100) from the URL’s overall structural patterns, "
                f"but no individual warning trigger was identified."
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

    help_contacts = get_help_contacts(country)

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
        "warning_signals": warning_signals,
        "explanation": explanation,
        "https_security_observation": https_observation,
        "model_availability": model_available,
        "model_version": model_version,
        "confidence": confidence,
        "calibrated_confidence": round(confidence * 100.0, 1) if confidence else None,
        "safe_next_steps": safe_next_steps,
        "country": country,
        "help_contacts": help_contacts,
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
        warning_signals=warning_signals,
        risk_score=risk_score,
        risk_level=risk_level,
        explanation=explanation,
        https_security_observation=https_observation,
        safe_next_steps=safe_next_steps,
        limitations=limitations,
        domain_info=domain_info,
        assessment_notice=assessment_notice,
        help_contacts=help_contacts,
        report_text=report_text,
        llm_explanation=llm_explanation
    )
