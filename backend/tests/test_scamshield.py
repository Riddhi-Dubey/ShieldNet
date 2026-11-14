import pytest
from fastapi.testclient import TestClient
from backend.app.services.message_analysis import analyze_scam_message
from backend.app.services.url_analysis import analyze_scam_url
from backend.app.security.validation import is_ssrf_risk


def test_message_analysis_signals():
    # Message containing urgency, advance payment, and OTP solicitation
    text = (
        "URGENT NOTICE: Your SBI Bank account will be blocked within 24 hours. "
        "Pay registration fee of Rs 500 immediately and share the OTP 482910 to verify."
    )
    res = analyze_scam_message(text)
    assert res.risk_score >= 60.0
    assert res.risk_level in ["HIGH", "CRITICAL"]

    signal_names = [s.signal_name for s in res.detected_signals]
    assert "URGENCY" in signal_names
    assert "ADVANCE_PAYMENT" in signal_names
    assert "OTP_REQUEST" in signal_names

    assert len(res.safe_next_steps) > 0
    assert "limitations" in res.model_dump()
    assert "482910" not in res.redacted_message_preview
    assert res.ml_probability is not None
    assert res.ml_probability >= 50.0
    assert res.ml_prediction == "SCAM_OR_FRAUD"


def test_message_analysis_benign():
    text = "Hi Rahul, are we still meeting for lunch tomorrow at 1 PM?"
    res = analyze_scam_message(text)
    assert res.risk_score < 30.0
    assert res.risk_level == "LOW"
    assert len(res.detected_signals) == 0
    assert res.ml_probability is not None
    assert res.ml_prediction == "BENIGN"


def test_url_analysis_phishing_indicators():
    # URL with raw IP, suspicious keywords, and lack of TLS
    url = "http://192.168.1.100/sbi-netbanking-verify-login.php?account=update"
    res = analyze_scam_url(url)
    assert res.risk_score >= 60.0
    assert res.risk_level in ["HIGH", "CRITICAL"]
    assert len(res.heuristic_findings) > 0
    assert any("IP address" in f for f in res.heuristic_findings)
    assert any("keywords" in f for f in res.heuristic_findings)


def test_url_analysis_benign():
    url = "https://www.google.com/search?q=cybersecurity"
    res = analyze_scam_url(url)
    assert res.risk_score < 40.0
    assert res.model_prediction in ["BENIGN", "SUSPICIOUS"]


def test_ssrf_detection():
    # SSRF loopback and private network targets must be flagged
    assert is_ssrf_risk("http://127.0.0.1:8080/admin") is True
    assert is_ssrf_risk("http://localhost/secrets") is True
    assert is_ssrf_risk("http://10.0.0.1/metadata") is True
    assert is_ssrf_risk("http://192.168.1.1/router") is True
    assert is_ssrf_risk("http://169.254.169.254/latest/meta-data") is True
    # Public domain
    assert is_ssrf_risk("https://www.google.com") is False


def test_chat_faq_api(client: TestClient):
    # Test UPI Fraud query
    res = client.post("/api/chat", json={"query": "Someone sent me a QR code to receive OLX payment"})
    assert res.status_code == 200
    data = res.json()
    assert "QR Code Fraud" in data["query_topic"] or "UPI" in data["query_topic"]
    assert "PIN" in data["response"] and ("receive" in data["response"].lower() or "debit" in data["response"].lower())
    assert len(data["recommended_actions"]) > 0

    # Test reporting cybercrime query
    res2 = client.post("/api/chat", json={"query": "How do I report cyber crime or call helpline?"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert "1930" in str(data2)


def test_quiz_flow(client: TestClient):
    # 1. Fetch questions
    res = client.get("/api/quiz/questions")
    assert res.status_code == 200
    questions = res.json()
    assert len(questions) >= 5
    for q in questions:
        # Correct answers MUST NOT be present in the question response
        assert "correct_option_index" not in q
        assert "correct_answer" not in q
        assert len(q["options"]) >= 2

    # 2. Submit answers server-side
    submission = {
        "answers": [
            {"question_id": "q1", "selected_option_index": 1},  # Correct
            {"question_id": "q2", "selected_option_index": 1},  # Correct
            {"question_id": "q3", "selected_option_index": 0}   # Incorrect
        ]
    }
    sub_res = client.post("/api/quiz/submit", json=submission)
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["total_questions"] == 3
    assert sub_data["correct_count"] == 2
    assert sub_data["score_percentage"] == round(2 / 3 * 100, 1)
    assert len(sub_data["evaluations"]) == 3
