import pytest
from fastapi.testclient import TestClient


def test_consent_lifecycle_and_enforcement(client: TestClient):
    # 1. Create valid consent record
    consent_payload = {
        "purpose": "SCAM_REPORTING",
        "destination": "SCAMTRACE_INTELLIGENCE",
        "data_scope": "SANITIZED_INDICATORS",
        "session_id": "test_session_abc",
        "consent_version": "1.0"
    }
    c_res = client.post("/api/consent", json=consent_payload)
    assert c_res.status_code == 200
    consent_data = c_res.json()
    consent_id = consent_data["consent_id"]
    assert consent_data["status"] == "ACTIVE"

    # 2. Preview endpoint
    prev_res = client.post("/api/reports/preview", json={
        "raw_identifier": "+91 99999 88888",
        "entity_type": "PHONE",
        "scam_type": "OTP_THEFT",
        "description": "Caller asked for my OTP 554433 to unblock account."
    })
    assert prev_res.status_code == 200
    prev_data = prev_res.json()
    assert "554433" not in prev_data["sanitized_description"]
    assert prev_data["proposed_destination"] == "SCAMTRACE_INTELLIGENCE"

    # 3. Submit report using the verified consent_id
    rep_payload = {
        "consent_id": consent_id,
        "raw_identifier": "+91 99999 88888",
        "entity_type": "PHONE",
        "scam_type": "OTP_THEFT",
        "description": "Caller asked for my OTP 554433 to unblock account.",
        "session_id": "test_session_abc"
    }
    sub_res = client.post("/api/reports", json=rep_payload)
    assert sub_res.status_code == 200
    rep_data = sub_res.json()
    assert rep_data["normalized_identifier"] == "+919999988888"
    assert "554433" not in rep_data["sanitized_description"]

    # 4. Revoke consent
    rev_res = client.post("/api/consent/revoke", json={"consent_id": consent_id})
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "REVOKED"

    # 5. Direct API bypass attempt with revoked consent MUST BE REJECTED!
    bypass_res = client.post("/api/reports", json=rep_payload)
    assert bypass_res.status_code == 403
    assert "revoked" in bypass_res.json()["detail"].lower()


def test_consent_missing_or_mismatched(client: TestClient):
    # Missing consent ID
    bad_res1 = client.post("/api/reports", json={
        "consent_id": "non_existent_uuid_12345",
        "raw_identifier": "http://malicious.invalid/test",
        "scam_type": "PHISHING",
        "description": "Phishing test"
    })
    assert bad_res1.status_code == 403
    assert "not found" in bad_res1.json()["detail"].lower()

    # Create consent with mismatched purpose (e.g. MARKETING instead of SCAM_REPORTING)
    mismatch_res = client.post("/api/consent", json={
        "purpose": "MARKETING_NEWSLETTER",
        "destination": "SCAMTRACE_INTELLIGENCE",
        "data_scope": "SANITIZED_INDICATORS"
    })
    bad_consent_id = mismatch_res.json()["consent_id"]

    bad_res2 = client.post("/api/reports", json={
        "consent_id": bad_consent_id,
        "raw_identifier": "http://malicious.invalid/test",
        "scam_type": "PHISHING",
        "description": "Phishing test description"
    })
    assert bad_res2.status_code == 403
    assert "purpose mismatch" in bad_res2.json()["detail"].lower()
