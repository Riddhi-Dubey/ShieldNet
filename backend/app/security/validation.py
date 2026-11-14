import re
import hashlib
import ipaddress
from urllib.parse import urlparse
from typing import Tuple, Optional

# Regex definitions for type detection & normalization
PHONE_CLEAN_REGEX = re.compile(r'[^\d+]')
INDIAN_PHONE_REGEX = re.compile(r'^(?:\+?91|0)?([6-9]\d{9})$')
CRYPTO_ETH_REGEX = re.compile(r'^0x[a-fA-F0-9]{40}$')
CRYPTO_BTC_REGEX = re.compile(r'^(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|[13][a-zA-Z0-9]{25,34}|bc1[a-zA-Z0-9]{25,65})$')
BANK_ACC_CLEAN_REGEX = re.compile(r'[^a-zA-Z0-9]')
DOMAIN_REGEX = re.compile(r'^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$')


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
        val = raw_val
        if not val.startswith(("http://", "https://", "hxxp://", "hxxps://")):
            val = f"http://{val}"
        val = val.replace("hxxp://", "http://").replace("hxxps://", "https://")
        try:
            parsed = urlparse(val)
            netloc = parsed.netloc.lower()
            if ":" in netloc:
                netloc = netloc.split(":")[0]  # strip port
            path = parsed.path.rstrip("/")
            if ent_type == "DOMAIN":
                norm = netloc
            else:
                norm = f"{parsed.scheme.lower()}://{netloc}{path}"
                if parsed.query:
                    norm += f"?{parsed.query}"
            return ent_type, norm
        except Exception:
            return ent_type, raw_val.lower().strip()

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
