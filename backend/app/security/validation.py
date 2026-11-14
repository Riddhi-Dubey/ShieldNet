import re
import hashlib
import ipaddress
import urllib.parse
from urllib.parse import urlparse, urlsplit, parse_qsl, urlunsplit, urlencode
from typing import Tuple, Optional, Dict, Any

# Sensitive URL query parameter keys that must be redacted for privacy
SENSITIVE_PARAM_NAMES = {
    "token", "auth", "key", "api_key", "apikey", "secret", "password",
    "passwd", "pwd", "pass", "session", "sess", "sessionid", "jwt",
    "access_token", "refresh_token", "id_token", "email", "mail",
    "phone", "mobile", "otp", "code", "pin", "cvv", "card",
    "account", "acct", "pan", "aadhar", "aadhaar", "credential", "sign", "signature"
}

# Regex definitions for type detection & normalization
PHONE_CLEAN_REGEX = re.compile(r'[^\d+]')
INDIAN_PHONE_REGEX = re.compile(r'^(?:\+?91|0)?([6-9]\d{9})$')
CRYPTO_ETH_REGEX = re.compile(r'^0x[a-fA-F0-9]{40}$')
CRYPTO_BTC_REGEX = re.compile(r'^(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|[13][a-zA-Z0-9]{25,34}|bc1[a-zA-Z0-9]{25,65})$')
BANK_ACC_CLEAN_REGEX = re.compile(r'[^a-zA-Z0-9]')
DOMAIN_REGEX = re.compile(r'^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$')


def sanitize_and_redact_url(raw_url: str) -> Tuple[str, str, Dict[str, Any]]:
    """
    Robust URL parser, validator, and sensitive data redactor.
    - Handles missing schemes, trailing dots, embedded credentials, IDN/Unicode, IPv4/IPv6, and ports.
    - Redacts sensitive query parameters (passwords, tokens, emails, OTPs) and embedded credentials.
    - Returns (normalized_clean_url, redacted_display_url, metadata).
    """
    clean_val = raw_url.strip()
    if not clean_val:
        return "", "", {"is_valid": False, "error": "Empty URL"}

    # Handle defanged or missing schemes
    norm_val = clean_val.replace("hxxp://", "http://").replace("hxxps://", "https://")
    has_scheme = "://" in norm_val
    if not has_scheme:
        norm_val = f"http://{norm_val}"

    try:
        parsed = urlsplit(norm_val)
    except Exception as e:
        return norm_val, norm_val, {"is_valid": False, "error": f"Malformed URL: {e}"}

    scheme = parsed.scheme.lower() if parsed.scheme else "http"
    netloc = parsed.netloc or ""
    path = parsed.path or ""
    query = parsed.query or ""
    fragment = parsed.fragment or ""

    # 1. Embedded credentials extraction and redaction
    has_credentials = False
    clean_userinfo = ""
    redacted_userinfo = ""

    if "@" in netloc:
        userinfo_part, host_port = netloc.rsplit("@", 1)
        has_credentials = True
        redacted_userinfo = "[REDACTED_USER]:[REDACTED_SECRET]@"
        clean_userinfo = ""  # Strip from canonical representation for privacy
        netloc = host_port

    # 2. Host and Port processing
    port = None
    hostname = netloc
    if ":" in netloc and not (netloc.startswith("[") and netloc.endswith("]")):
        # IPv4 or domain with port
        parts = netloc.split(":")
        hostname = parts[0]
        try:
            port = int(parts[1])
        except (ValueError, IndexError):
            port = None
    elif netloc.startswith("[") and "]" in netloc:
        # IPv6
        close_bracket = netloc.find("]")
        hostname = netloc[1:close_bracket]
        port_part = netloc[close_bracket + 1:]
        if port_part.startswith(":"):
            try:
                port = int(port_part[1:])
            except ValueError:
                port = None

    # Strip trailing dot from hostname (e.g. example.com.)
    hostname = hostname.rstrip(".").lower()

    # 3. Unicode / IDN detection and Punycode conversion
    is_idn = False
    punycode_host = hostname
    if any(ord(c) > 127 for c in hostname):
        is_idn = True
        try:
            punycode_host = hostname.encode("idna").decode("ascii")
        except Exception:
            punycode_host = hostname

    # 4. IP address detection
    is_ip = False
    is_ipv6 = False
    try:
        ip_obj = ipaddress.ip_address(hostname)
        is_ip = True
        is_ipv6 = ip_obj.version == 6
    except ValueError:
        is_ip = False

    # 5. Reconstruct canonical netloc
    if is_ipv6:
        canonical_netloc = f"[{hostname}]"
    else:
        canonical_netloc = punycode_host

    if port:
        canonical_netloc = f"{canonical_netloc}:{port}"

    # 6. Sensitive query parameter redaction
    has_sensitive_query = False
    clean_query_pairs = []
    redacted_query_pairs = []

    if query:
        parsed_q = parse_qsl(query, keep_blank_values=True)
        for k, v in parsed_q:
            k_lower = k.lower()
            if k_lower in SENSITIVE_PARAM_NAMES or any(sub in k_lower for sub in ["token", "secret", "password", "auth"]):
                has_sensitive_query = True
                clean_query_pairs.append((k, "[REDACTED]"))
                redacted_query_pairs.append((k, "[REDACTED]"))
            elif len(v) > 40 and not ("/" in v):
                # Likely an opaque auth token or API hash
                has_sensitive_query = True
                clean_query_pairs.append((k, "[REDACTED]"))
                redacted_query_pairs.append((k, "[REDACTED]"))
            else:
                clean_query_pairs.append((k, v))
                redacted_query_pairs.append((k, v))

    clean_query_str = urlencode(clean_query_pairs, safe="[]") if clean_query_pairs else ""
    redacted_query_str = urlencode(redacted_query_pairs, safe="[]") if redacted_query_pairs else ""

    # Canonical normalized URL (sanitized, punycode, no embedded creds)
    canonical_url = urlunsplit((scheme, canonical_netloc, path, clean_query_str, fragment))

    # Redacted display URL (safe for logging, shows where creds/secrets were scrubbed)
    display_netloc = f"{redacted_userinfo}{canonical_netloc}" if has_credentials else canonical_netloc
    redacted_display_url = urlunsplit((scheme, display_netloc, path, redacted_query_str, fragment))

    metadata = {
        "is_valid": True,
        "scheme": scheme,
        "hostname": hostname,
        "punycode_host": punycode_host,
        "is_idn": is_idn,
        "is_ip": is_ip,
        "is_ipv6": is_ipv6,
        "port": port,
        "has_credentials": has_credentials,
        "has_sensitive_query": has_sensitive_query,
        "is_ssrf_risk": is_ssrf_risk(hostname),
        "trailing_dot_removed": raw_url.rstrip("/").endswith(".")
    }

    return canonical_url, redacted_display_url, metadata


def redact_sensitive_url(url: str) -> str:
    """Convenience helper: returns a safe, redacted version of a URL for logging/display."""
    _, redacted, _ = sanitize_and_redact_url(url)
    return redacted


def is_ssrf_risk(url_or_host: str) -> bool:
    """
    Checks if a URL, domain, or IP targets private/loopback/link-local network spaces.
    Never allows fetching of arbitrary submitted URLs.
    """
    try:
        parsed = urlparse(url_or_host if "://" in url_or_host else f"http://{url_or_host}")
        host = parsed.hostname or url_or_host

        # Strip brackets from IPv6
        host = host.strip("[]")

        # Check localhost / internal domains
        if host.lower() in ["localhost", "127.0.0.1", "::1", "0.0.0.0"]:
            return True
        if host.lower().endswith(".local") or host.lower().endswith(".internal") or host.lower().endswith(".corp"):
            return True

        # Check IP address range
        try:
            ip = ipaddress.ip_address(host)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
                return True
        except ValueError:
            # Not an IP address, domain name
            pass

        return False
    except Exception:
        return True


def detect_entity_type(identifier: str) -> str:
    """
    Automatically detects the entity type based on pattern recognition:
    PHONE, CRYPTO_WALLET, URL, or BANK_ACCOUNT.
    """
    clean_val = identifier.strip()

    # Check Crypto Wallet
    if CRYPTO_ETH_REGEX.match(clean_val) or CRYPTO_BTC_REGEX.match(clean_val):
        return "CRYPTO_WALLET"

    # Check URL
    if clean_val.lower().startswith(("http://", "https://", "hxxp://", "hxxps://", "ftp://")):
        return "URL"
    if "/" in clean_val and ("." in clean_val.split("/")[0]):
        return "URL"

    # Check Phone
    digits_only = re.sub(r'[^\d]', '', clean_val)
    if (len(digits_only) == 10 and digits_only[0] in "6789") or \
       (len(digits_only) == 12 and digits_only.startswith("91") and digits_only[2] in "6789"):
        return "PHONE"

    # Check Domain
    if DOMAIN_REGEX.match(clean_val):
        return "DOMAIN"

    # Check Bank Account (typically 9-18 alphanumeric characters, often starting with prefix or digits)
    if 9 <= len(clean_val) <= 20 and clean_val.isalnum():
        return "BANK_ACCOUNT"

    return "UNKNOWN"


def normalize_identifier(entity_type: str, raw_value: str) -> Tuple[str, str]:
    """
    Normalizes an identifier into a canonical form according to its entity type.
    Returns: (normalized_entity_type, normalized_value)
    """
    raw_val = raw_value.strip()

    # If entity_type is AUTO or UNKNOWN, detect it
    if not entity_type or entity_type.upper() in ["AUTO", "DETECT", "UNKNOWN"]:
        entity_type = detect_entity_type(raw_val)

    ent_type = entity_type.upper()

    if ent_type == "PHONE":
        digits = re.sub(r'[^\d]', '', raw_val)
        if len(digits) == 12 and digits.startswith("91"):
            norm = f"+91{digits[2:]}"
        elif len(digits) == 11 and digits.startswith("0"):
            norm = f"+91{digits[1:]}"
        elif len(digits) == 10:
            norm = f"+91{digits}"
        else:
            norm = raw_val.replace(" ", "").replace("-", "")
        return "PHONE", norm

    elif ent_type in ["URL", "DOMAIN"]:
        canonical, _, meta = sanitize_and_redact_url(raw_val)
        host = meta.get("punycode_host") or meta.get("hostname") or raw_val.lower().strip()
        if ent_type == "DOMAIN":
            norm = host
        else:
            # Canonical URL identifier for graph resolution: strip non-standard ports and trailing slash
            scheme = meta.get("scheme", "http")
            parsed = urlsplit(canonical)
            path = parsed.path.rstrip("/")
            norm = f"{scheme}://{host}{path}"
            if parsed.query:
                norm += f"?{parsed.query}"
        return ent_type, norm

    elif ent_type == "BANK_ACCOUNT":
        norm = BANK_ACC_CLEAN_REGEX.sub('', raw_val).upper()
        return "BANK_ACCOUNT", norm

    elif ent_type == "CRYPTO_WALLET":
        norm = raw_val.strip()
        if norm.startswith("0x"):
            norm = norm.lower()  # Ethereum addresses lowercased
        return "CRYPTO_WALLET", norm

    return ent_type, raw_val.strip()


def generate_stable_entity_id(entity_type: str, normalized_value: str) -> str:
    """
    Generates a deterministic, stable SHA-256 identifier for an entity.
    Format: sha256("TYPE:normalized_value")[:24]
    """
    key = f"{entity_type.upper()}:{normalized_value.strip()}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:24]
