import re
import math
from collections import Counter
from urllib.parse import urlparse
from typing import List, Dict, Any
import numpy as np

SUSPICIOUS_KEYWORDS = [
    "login", "verify", "secure", "update", "banking", "account",
    "kyc", "free", "bonus", "signin", "confirm", "wallet", "support",
    "password", "security", "authenticate", "claim", "prize",
    "otp", "refund", "gift", "netbanking", "billing", "payout", "unblock"
]

SHORTENER_DOMAINS = [
    "bit.ly", "tinyurl.com", "is.gd", "t.co", "cutt.ly", "rb.gy", "goo.gl", "ow.ly", "buff.ly", "adf.ly"
]

HIGH_ABUSE_TLDS = [
    ".xyz", ".top", ".online", ".bid", ".click", ".fit", ".loan", ".cfd",
    ".rest", ".buzz", ".club", ".work", ".icu", ".gq", ".tk", ".ml", ".ga", ".cf"
]

FEATURE_NAMES = [
    "url_length",
    "domain_length",
    "path_length",
    "dot_count",
    "hyphen_count",
    "digit_count",
    "ip_address_presence",
    "suspicious_keyword_count",
    "https_presence",
    "special_char_count",
    "subdomain_count",
    "shortener_presence",
    "punycode_presence",
    "at_symbol_presence",
    "suspicious_tld_presence",
    "shannon_entropy"
]


def calculate_shannon_entropy(text: str) -> float:
    """Calculates Shannon entropy to detect algorithmically generated or randomized strings."""
    if not text:
        return 0.0
    entropy = 0.0
    length = len(text)
    counts = Counter(text)
    for count in counts.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(float(entropy), 4)


from backend.app.security.validation import sanitize_and_redact_url

def extract_url_features(url: str) -> Dict[str, float]:
    """
    Extracts 16 explainable lexical and structural features from a URL string.
    Does NOT perform external network requests (prevents SSRF and request leakage).
    Handles IDN/Unicode, IPv4/IPv6, embedded credentials, and query parameter patterns.
    """
    raw_url = url.strip()
    if not raw_url:
        return {name: 0.0 for name in FEATURE_NAMES}

    canonical_url, _, meta = sanitize_and_redact_url(raw_url)
    parsed = urlparse(canonical_url)

    domain = meta.get("punycode_host") or (parsed.hostname or parsed.netloc or "").lower()
    path = parsed.path or ""

    # Features:
    url_len = float(len(raw_url))
    domain_len = float(len(domain))
    path_len = float(len(path))
    dot_count = float(raw_url.count("."))
    hyphen_count = float(raw_url.count("-"))
    digit_count = float(sum(c.isdigit() for c in raw_url))

    # IP address in host (IPv4 or IPv6)
    has_ip = 1.0 if meta.get("is_ip") else (1.0 if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain) else 0.0)

    # Suspicious keywords
    url_lower = raw_url.lower()
    keyword_count = float(sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in url_lower))

    # HTTPS presence (Note: HTTPS encrypts transit but does NOT prove authenticity)
    has_https = 1.0 if raw_url.lower().startswith("https://") else 0.0

    # Special characters
    special_chars = "@?=&%_~!"
    special_char_count = float(sum(raw_url.count(c) for c in special_chars))

    # Subdomain count
    subdomains = domain.split(".")
    subdomain_count = float(max(0, len(subdomains) - 2))

    # Shortener presence
    is_shortener = 1.0 if any(sh in domain for sh in SHORTENER_DOMAINS) else 0.0

    # Punycode / IDN presence
    is_punycode = 1.0 if (meta.get("is_idn") or "xn--" in domain) else 0.0

    # @ symbol or embedded credentials presence
    has_at_symbol = 1.0 if ("@" in raw_url or meta.get("has_credentials")) else 0.0

    # High-abuse TLD
    has_abuse_tld = 1.0 if any(domain.endswith(tld) for tld in HIGH_ABUSE_TLDS) else 0.0

    # Shannon entropy of hostname + path
    entropy = calculate_shannon_entropy(domain + path)

    return {
        "url_length": url_len,
        "domain_length": domain_len,
        "path_length": path_len,
        "dot_count": dot_count,
        "hyphen_count": hyphen_count,
        "digit_count": digit_count,
        "ip_address_presence": has_ip,
        "suspicious_keyword_count": keyword_count,
        "https_presence": has_https,
        "special_char_count": special_char_count,
        "subdomain_count": subdomain_count,
        "shortener_presence": is_shortener,
        "punycode_presence": is_punycode,
        "at_symbol_presence": has_at_symbol,
        "suspicious_tld_presence": has_abuse_tld,
        "shannon_entropy": entropy
    }


def features_dict_to_vector(features: Dict[str, float]) -> np.ndarray:
    """Converts a feature dict into a 1D numpy array in deterministic order."""
    return np.array([features.get(name, 0.0) for name in FEATURE_NAMES], dtype=np.float32)
