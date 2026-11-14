import pytest
from fastapi.testclient import TestClient


def test_search_phone_entity(client: TestClient):
    res = client.post("/api/search", json={
        "identifier": "+91 98765 00001",
        "entity_type": "PHONE",
        "max_hops": 2
    })
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert data["detected_type"] == "PHONE"
    assert data["risk_score"] >= 60.0
    assert len(data["connected_entities"]) > 0
    assert data["graph"] is not None
    assert len(data["graph"]["nodes"]) > 1
    assert "Investigative Notice" in data["investigative_warning"]


def test_search_url_entity(client: TestClient):
    res = client.post("/api/search", json={
        "identifier": "http://sbi-secure-update-kyc.portal-services.invalid/login",
        "entity_type": "URL",
        "max_hops": 2
    })
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert data["detected_type"] == "URL"
    assert data["entity"]["source_dataset"] == "SYNTHETIC_DEMO"


def test_search_bank_account_entity(client: TestClient):
    res = client.post("/api/search", json={
        "identifier": "SIMBANK9001001",
        "entity_type": "BANK_ACCOUNT"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert data["detected_type"] == "BANK_ACCOUNT"
    assert data["risk_level"] in ["HIGH", "CRITICAL"]


def test_search_crypto_wallet_entity(client: TestClient):
    res = client.post("/api/search", json={
        "identifier": "0x71c6bf5e5c7066914b3014a4cf794270b21a0001",
        "entity_type": "CRYPTO_WALLET"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert data["detected_type"] == "CRYPTO_WALLET"


def test_search_unknown_entity_not_classified_as_safe(client: TestClient):
    # Searching an unknown identifier
    res = client.post("/api/search", json={
        "identifier": "+91 91111 22222",
        "entity_type": "PHONE"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is False
    assert data["entity"] is None
    # Crucial requirement: Must NOT classify unknown entity as safe!
    assert "not be assumed to be safe" in data["message"].lower()
    assert data["risk_score"] is None
    assert data["risk_level"] is None
