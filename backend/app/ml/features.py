import re
from urllib.parse import urlparse
from typing import List, Dict, Any
import numpy as np

SUSPICIOUS_KEYWORDS = [
    "login", "verify", "secure", "update", "banking", "account",
    "kyc", "free", "bonus", "signin", "confirm", "wallet", "support",
    "password", "security", "authenticate", "claim", "prize"
]

SHORTENER_DOMAINS = [
    "bit.ly", "tinyurl.com", "is.gd", "t.co", "cutt.ly", "rb.gy", "goo.gl", "ow.ly"
]

FEATURE_NAMES = [
    "url_length",
    "domain_length",
    "dot_count",
    "hyphen_count",
    "digit_count",
    "ip_address_presence",
    "suspicious_keyword_count",
    "https_presence",
    "special_char_count",
    "subdomain_count",
    "shortener_presence",
    "punycode_presence"
]


def extract_url_features(url: str) -> Dict[str, float]:
    """
    Extracts 12 explainable lexical and structural features from a URL string.
    Does NOT perform external network requests.
    """
    raw_url = url.strip()
    norm_url = raw_url
    if not (norm_url.startswith("http://") or norm_url.startswith("https://") or norm_url.startswith("ftp://")):
        norm_url = "http://" + norm_url

    parsed = urlparse(norm_url)
    domain = (parsed.hostname or parsed.netloc or "").lower()

    # Features:
    url_len = float(len(raw_url))
    domain_len = float(len(domain))
    dot_count = float(raw_url.count("."))
    hyphen_count = float(raw_url.count("-"))
    digit_count = float(sum(c.isdigit() for c in raw_url))

    # IP address in host
    ip_pattern = re.compile(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$')
    has_ip = 1.0 if ip_pattern.match(domain) else 0.0

    # Suspicious keywords
    url_lower = raw_url.lower()
    keyword_count = float(sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in url_lower))

    # HTTPS presence
    has_https = 1.0 if raw_url.lower().startswith("https://") else 0.0

    # Special characters
    special_chars = "@?=&%_~!"
    special_char_count = float(sum(raw_url.count(c) for c in special_chars))

    # Subdomain count
    subdomains = domain.split(".")
    subdomain_count = float(max(0, len(subdomains) - 2))

    # Shortener presence
    is_shortener = 1.0 if any(sh in domain for sh in SHORTENER_DOMAINS) else 0.0

    # Punycode
    is_punycode = 1.0 if "xn--" in domain else 0.0

    return {
        "url_length": url_len,
        "domain_length": domain_len,
        "dot_count": dot_count,
        "hyphen_count": hyphen_count,
        "digit_count": digit_count,
        "ip_address_presence": has_ip,
        "suspicious_keyword_count": keyword_count,
        "https_presence": has_https,
        "special_char_count": special_char_count,
        "subdomain_count": subdomain_count,
        "shortener_presence": is_shortener,
        "punycode_presence": is_punycode
    }


def features_dict_to_vector(features: Dict[str, float]) -> np.ndarray:
    """Converts a feature dict into a 1D numpy array in deterministic order."""
    return np.array([features[name] for name in FEATURE_NAMES], dtype=np.float32)
