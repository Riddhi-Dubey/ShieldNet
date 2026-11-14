import pytest
from fastapi.testclient import TestClient


def test_integration_health(client: TestClient):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert data["database"]["status"] == "UP"


def test_integration_dashboard_stats(client: TestClient):
    res = client.get("/api/dashboard/stats")
    assert res.status_code == 200
    data = res.json()
    assert "totalEntities" in data
    assert "suspiciousEntities" in data
    assert "totalRelationships" in data
    assert "connectedClusters" in data
    assert isinstance(data["riskDistribution"], list)
    assert len(data["riskDistribution"]) == 4
    assert "level" in data["riskDistribution"][0]
    assert "count" in data["riskDistribution"][0]
    assert isinstance(data["entityDistribution"], list)
    assert len(data["entityDistribution"]) > 0
    assert isinstance(data["recentInvestigations"], list)
    assert isinstance(data["recentActivity"], list)


def test_integration_search_entity_frontend_shape(client: TestClient):
    # Frontend sends { query, type }
    res = client.post("/api/search", json={"query": "+91 98765 00001", "type": "auto"})
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert isinstance(data["results"], list)
    assert len(data["results"]) >= 1
    item = data["results"][0]
    assert "id" in item
    assert "identifier" in item
    assert "type" in item
    assert "riskLevel" in item
    assert "riskScore" in item
    assert "reportCount" in item
    assert "connectedEntitiesCount" in item


def test_integration_search_unknown_entity(client: TestClient):
    res = client.post("/api/search", json={"query": "+91 91111 22222", "type": "phone"})
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is False
    assert data["results"] == []
    assert data["risk_score"] is None
    assert "not be assumed to be safe" in data["message"].lower()


def test_integration_entity_details_and_connections_by_identifier(client: TestClient):
    # Fetch by phone number directly
    res = client.get("/api/entities/+91 98765 00001")
    assert res.status_code == 200
    entity = res.json()
    assert entity["identifier"] == "+91 98765 00001"
    assert "id" in entity
    assert "type" in entity
    assert "riskScore" in entity
    assert "riskLevel" in entity

    # Connections
    conn_res = client.get("/api/entities/+91 98765 00001/connections")
    assert conn_res.status_code == 200
    conn_data = conn_res.json()
    assert "connections" in conn_data
    assert isinstance(conn_data["connections"], list)
    if conn_data["connections"]:
        c = conn_data["connections"][0]
        assert "target" in c
        assert "relation" in c
        assert "type" in c


def test_integration_message_checker_frontend_shape(client: TestClient):
    text = "URGENT: Your SBI account is blocked. Send OTP 948271 immediately or legal action will be initiated."
    res = client.post("/api/analyse/message", json={"message": text})
    assert res.status_code == 200
    data = res.json()
    assert "risk_score" in data
    assert data["risk_score"] >= 40.0
    assert "warning_signals" in data
    assert len(data["warning_signals"]) > 0
    sig = data["warning_signals"][0]
    assert "signal" in sig
    assert "severity" in sig
    assert "explanation" in sig
    assert "verdict" in data
    assert "summary" in data
    assert "948271" not in data["redacted_message_preview"]


def test_integration_url_checker_frontend_shape(client: TestClient):
    res = client.post("/api/analyse/url", json={"url": "http://secure-sbi-login-verify.com/login.php"})
    assert res.status_code == 200
    data = res.json()
    assert "warning_signs" in data
    assert "domain_info" in data
    assert data["domain_info"]["domain"] == "secure-sbi-login-verify.com"
    assert "risk_score" in data
    assert data["risk_score"] >= 40.0


def test_integration_chatbot_frontend_shape(client: TestClient):
    # Frontend sends { message, history }
    res = client.post("/api/chat", json={
        "message": "Someone sent me a QR code to receive a refund. Should I enter my UPI PIN?",
        "history": []
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "response" in data
    assert "PIN" in data["reply"]
    assert len(data["recommended_actions"]) > 0


def test_integration_quiz_frontend_flow(client: TestClient):
    # 1. Fetch questions
    q_res = client.get("/api/quiz/questions?topic=general")
    assert q_res.status_code == 200
    questions = q_res.json()
    assert len(questions) > 0
    first_q = questions[0]
    assert "id" in first_q
    assert "question" in first_q
    assert "options" in first_q

    # 2. Submit answers dictionary { [qId]: optionIndex }
    answers_dict = {first_q["id"]: 0}
    sub_res = client.post("/api/quiz/submit", json={
        "topic": "general",
        "answers": answers_dict
    })
    assert sub_res.status_code == 200
    result = sub_res.json()
    assert "score" in result
    assert "total" in result
    assert "details" in result
    assert first_q["id"] in result["details"]
    assert "correct" in result["details"][first_q["id"]]
    assert "explanation" in result["details"][first_q["id"]]


def test_integration_report_preview_and_consent_submission(client: TestClient):
    # 1. Report preview
    form_data = {
        "category": "Phishing / SMS Scams",
        "date": "2026-11-14",
        "description": "Received suspicious SMS with OTP 654321 asking me to click phishing link http://free-recharge.xyz",
        "phoneNumber": "+91 91234 56789",
        "url": "http://free-recharge.xyz",
        "upiId": "",
        "email": ""
    }
    preview_res = client.post("/api/reports/preview", json=form_data)
    assert preview_res.status_code == 200
    preview = preview_res.json()
    assert preview["proposed_identifier"] == "+919123456789"
    assert "654321" not in preview["sanitized_description"]
    assert len(preview["redacted_items_summary"]) > 0

    # 2. Submission WITH explicit consent
    submit_with_consent = {
        **form_data,
        "consent_given": True,
        "share_with_scamtrace": True
    }
    rep_res = client.post("/api/reports", json=submit_with_consent)
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["entity_id"] != "NOT_TRANSFERRED_NO_CONSENT"
    assert rep_data["verification_status"] in ["REPORTED", "UNVERIFIED"]

    # 3. Submission WITHOUT consent (declined)
    submit_without_consent = {
        **form_data,
        "consent_given": False,
        "share_with_scamtrace": False
    }
    declined_res = client.post("/api/reports", json=submit_without_consent)
    assert declined_res.status_code == 200
    declined_data = declined_res.json()
    assert declined_data["entity_id"] == "NOT_TRANSFERRED_NO_CONSENT"
    assert "NOT transferred" in declined_data["message"]


def test_integration_analytics_and_datasets(client: TestClient):
    # Datasets status
    ds_res = client.get("/api/datasets/status")
    assert ds_res.status_code == 200
    ds_list = ds_res.json()
    assert isinstance(ds_list, list)
    assert len(ds_list) > 0
    ds0 = ds_list[0]
    assert "name" in ds0
    assert "recordCount" in ds0
    assert "classification" in ds0

    # Analytics summary
    an_res = client.get("/api/analytics/summary")
    assert an_res.status_code == 200
    an_data = an_res.json()
    assert "categories" in an_data
    assert "entityDistribution" in an_data
    assert "topEntities" in an_data
    assert "transactionTrends" in an_data


def test_integration_dossier_export(client: TestClient):
    res_csv = client.get("/api/entities/+91 98765 00001/export?format=csv")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "THREAT INTELLIGENCE DOSSIER" in res_csv.text

    res_md = client.get("/api/entities/+91 98765 00001/export?format=markdown")
    assert res_md.status_code == 200
    assert "text/markdown" in res_md.headers["content-type"]
    assert "# ScamTrace Threat Intelligence Dossier" in res_md.text
