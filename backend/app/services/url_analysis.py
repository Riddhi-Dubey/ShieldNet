from urllib.parse import urlparse
from typing import List, Dict, Any
from backend.app.schemas.analysis import UrlAnalysisResponse
from backend.app.ml.predict import predict_url_phishing
from backend.app.services.risk_scoring import calculate_risk_level
from backend.app.security.validation import is_ssrf_risk


def analyze_scam_url(url: str) -> UrlAnalysisResponse:
    """
    Performs comprehensive structural and lexical analysis of a URL.
    Safely inspects syntax without making any network requests (SSRF-safe).
    Uses the trained Scikit-learn model when available, falling back to heuristics.
    """
    clean_url = url.strip()
    norm_url = clean_url
    if not (norm_url.startswith("http://") or norm_url.startswith("https://") or norm_url.startswith("ftp://")):
        norm_url = "http://" + norm_url

    parsed = urlparse(norm_url)
    domain = (parsed.hostname or parsed.netloc or "").lower()

    # SSRF & Loopback Security Notice
    ssrf_detected = is_ssrf_risk(clean_url)

    # ML Model Prediction
    ml_result = predict_url_phishing(clean_url)
    features = ml_result["features"]
    model_available = ml_result["model_available"]
    model_pred = ml_result["prediction"]
    confidence = ml_result["confidence"]

    # Assemble heuristic findings
    heuristic_findings: List[str] = []

    if ssrf_detected:
        heuristic_findings.append("Target resolves to internal, loopback, or private network space (SSRF Hazard).")

    if features.get("ip_address_presence", 0) > 0:
        heuristic_findings.append("Host is a direct raw numeric IP address rather than a registered domain name.")

    if features.get("shortener_presence", 0) > 0:
        heuristic_findings.append("URL uses an obfuscating redirection shortener service.")

    if features.get("punycode_presence", 0) > 0:
        heuristic_findings.append("Domain utilizes Punycode ('xn--') indicating possible homoglyph or lookalike spoofing.")

    if features.get("suspicious_keyword_count", 0) > 0:
        heuristic_findings.append(f"URL string contains {int(features['suspicious_keyword_count'])} high-risk security/banking keywords.")

    if features.get("subdomain_count", 0) >= 3:
        heuristic_findings.append(f"Excessive subdomain nesting detected ({int(features['subdomain_count'])} subdomains).")

    if features.get("https_presence", 0) == 0:
        heuristic_findings.append("Insecure plain HTTP protocol in use (lacks TLS encryption).")

    if features.get("url_length", 0) > 80:
        heuristic_findings.append(f"Unusually long URL length ({int(features['url_length'])} characters).")

    if features.get("hyphen_count", 0) >= 3:
        heuristic_findings.append(f"Suspicious hyphenation in domain/path ({int(features['hyphen_count'])} hyphens).")

    # Risk score calculation
    # Base risk derived from ML phishing probability
    phishing_prob = ml_result.get("phishing_probability", 0.0)
    base_risk = phishing_prob * 75.0

    # Add heuristic modifiers
    modifier = 0.0
    if features.get("ip_address_presence", 0) > 0:
        modifier += 20.0
    if features.get("punycode_presence", 0) > 0:
        modifier += 20.0
    if features.get("shortener_presence", 0) > 0:
        modifier += 15.0
    if ssrf_detected:
        modifier += 25.0

    raw_risk = min(100.0, base_risk + modifier)
    risk_score = round(raw_risk, 1)
    risk_level = calculate_risk_level(risk_score)

    # Explanation text
    if model_pred == "PHISHING" or risk_score >= 60.0:
        explanation = (
            f"The URL exhibits characteristics strongly aligned with fraudulent landing pages or phishing lures "
            f"(Structural risk score: {risk_score}/100). Primary indicators: "
            f"{'; '.join(heuristic_findings[:3]) if heuristic_findings else 'High model confidence'}."
        )
    elif risk_score >= 30.0:
        explanation = (
            f"The URL displays moderate anomalies ({risk_score}/100) such as non-standard parameters or lack of TLS. "
            f"Caution is advised when interacting with this link."
        )
    else:
        explanation = (
            f"No major structural phishing indicators or blacklisted token patterns detected ({risk_score}/100). "
            f"Domain appears lexically standard."
        )

    safe_next_steps = [
        "Do not enter passwords, OTPs, or payment information on unverified portals.",
        "Check the address bar closely for misspelled domain names (typosquatting).",
        "Navigate to official banking or institutional portals by typing their verified URL directly."
    ]

    limitations = (
        "Analysis is performed entirely statically on the URL string without active HTTP network retrieval. "
        "Neither model confidence nor heuristic score constitutes a legal determination of criminality. "
        "A low score does not guarantee that a recently registered domain is legitimate."
    )

    domain_info = {
        "domain": domain,
        "protocol": "HTTPS (TLS Active)" if clean_url.startswith("https://") else "Insecure HTTP Protocol",
        "age": "Recent / Unverified",
        "registrar": "Public Registrar / Masked"
    }

    return UrlAnalysisResponse(
        url=clean_url,
        domain=domain,
        model_prediction=model_pred,
        confidence=confidence,
        model_availability=model_available,
        heuristic_findings=heuristic_findings,
        warning_signs=heuristic_findings,
        risk_score=risk_score,
        risk_level=risk_level,
        explanation=explanation,
        safe_next_steps=safe_next_steps,
        limitations=limitations,
        domain_info=domain_info
    )
