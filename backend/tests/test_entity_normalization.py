import pytest
from backend.app.security.validation import (
    normalize_identifier,
    detect_entity_type,
    generate_stable_entity_id
)


def test_phone_normalization():
    # Various phone formats
    t1, norm1 = normalize_identifier("PHONE", "+91 98765-43210")
    assert norm1 == "+919876543210"

    t2, norm2 = normalize_identifier("PHONE", "09876543210")
    assert norm2 == "+919876543210"

    t3, norm3 = normalize_identifier("PHONE", "9876543210")
    assert norm3 == "+919876543210"


def test_url_normalization():
    t1, norm1 = normalize_identifier("URL", "hxxp://secure-sbi.invalid:8080/login/")
    assert norm1 == "http://secure-sbi.invalid/login"

    t2, norm2 = normalize_identifier("DOMAIN", "SECURE-BANK.INVALID")
    assert norm2 == "secure-bank.invalid"


def test_bank_account_normalization():
    t1, norm1 = normalize_identifier("BANK_ACCOUNT", "sim-bank 9001 001")
    assert norm1 == "SIMBANK9001001"


def test_crypto_wallet_normalization():
    eth = "0x71C6BF5E5C7066914B3014A4CF794270B21A0001"
    t1, norm1 = normalize_identifier("CRYPTO_WALLET", eth)
    assert norm1 == eth.lower()


def test_automatic_type_detection():
    assert detect_entity_type("+91 9876543210") == "PHONE"
    assert detect_entity_type("9876543210") == "PHONE"
    assert detect_entity_type("https://phishing-site.invalid/test") == "URL"
    assert detect_entity_type("bank-login.invalid") == "DOMAIN"
    assert detect_entity_type("0x71c6bf5e5c7066914b3014a4cf794270b21a0001") == "CRYPTO_WALLET"
    assert detect_entity_type("1A1zP1eP5QGefi2DMPTfTL5SLmv7Div0001") == "CRYPTO_WALLET"
    assert detect_entity_type("SIMBANK9001001") == "BANK_ACCOUNT"


def test_stable_entity_id_generation():
    # SHA-256 ID must be deterministic and identical for same normalized entity
    id1 = generate_stable_entity_id("PHONE", "+919876543210")
    id2 = generate_stable_entity_id("PHONE", "+919876543210")
    id3 = generate_stable_entity_id("PHONE", "+919876543211")
    assert id1 == id2
    assert id1 != id3
    assert len(id1) == 24
