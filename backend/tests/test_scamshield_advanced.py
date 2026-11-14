import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.services.message_analysis import analyze_scam_message
from backend.app.services.url_analysis import analyze_scam_url
from backend.app.security.validation import sanitize_and_redact_url, is_ssrf_risk
from backend.app.services.report_generator import generate_plain_text_report
from backend.app.models.analysis import Analysis


def test_advanced_message_categories():
    # 1. Bank KYC phishing with link
    msg_kyc = "URGENT: Your SBI account is suspended due to pending KYC. Click http://sbi-kyc-verify-portal.in to avoid deactivation."
    res_kyc = analyze_scam_message(msg_kyc)
    assert res_kyc.risk_score >= 65.0
    assert res_kyc.risk_level in ["HIGH", "CRITICAL"]
    assert any(s.signal_name == "KYC_HARVESTING" for s in res_kyc.detected_signals)
    assert "report_text" in res_kyc.model_dump()
    assert "sbi-kyc-verify-portal" not in res_kyc.report_text or "Redacted" in res_kyc.report_text

    # 2. OTP solicitation (Model scam probability drives risk assessment)
    msg_otp = "Dear customer, payment of Rs 15,000 pending. Share your one-time password OTP 829104 to cancel immediately."
    res_otp = analyze_scam_message(msg_otp)
    assert res_otp.risk_score is not None
    assert res_otp.risk_score >= 40.0
    assert res_otp.risk_level in ["MEDIUM", "HIGH"]
    assert any(s.signal_name == "OTP_REQUEST" for s in res_otp.detected_signals)
    assert "829104" not in res_otp.redacted_message_preview

    # 3. Fake lottery / prize scam
    msg_prize = "Congratulations! You have won Rs 25,00,000 in KBC Lottery! Pay registration fee Rs 1,500 to claim prize."
    res_prize = analyze_scam_message(msg_prize)
    assert res_prize.risk_score >= 60.0
    assert any(s.signal_name in ["PRIZE_OR_LOTTERY", "ADVANCE_PAYMENT"] for s in res_prize.detected_signals)

    # 4. Part-time Job scam
    msg_job = "Earn Rs 5,000 daily from home! Like YouTube videos and review hotels. No experience needed. Join telegram t.me/work_daily"
    res_job = analyze_scam_message(msg_job)
    assert res_job.risk_score >= 40.0
    assert any(s.signal_name in ["FAKE_EMPLOYMENT", "SUSPICIOUS_CONTACT"] for s in res_job.detected_signals)

    # 5. Benign delivery alert
    msg_deliv = "Your Swiggy order #49281 has been picked up by Rahul and will arrive in 15 mins. Enjoy your food!"
    res_deliv = analyze_scam_message(msg_deliv)
    assert res_deliv.risk_score < 30.0
    assert res_deliv.risk_level == "LOW"
    assert len(res_deliv.detected_signals) == 0

    # 6. Benign bank transaction notice
    msg_bank = "INR 850.00 debited from A/C XX3821 on 15-Nov at Grofers UPI. Avail Bal: INR 22,410. Call 1800112211 if not you."
    res_bank = analyze_scam_message(msg_bank)
    assert res_bank.risk_score < 30.0
    assert res_bank.risk_level == "LOW"


def test_url_edge_cases_and_redaction():
    # 1. Embedded credentials in URL
    raw_cred_url = "http://admin:supersecretpassword@sbi-verify.security-check.invalid/login"
    canon, redacted, meta = sanitize_and_redact_url(raw_cred_url)
    assert meta["has_credentials"] is True
    assert "supersecretpassword" not in redacted
    assert "[REDACTED_SECRET]" in redacted

    res_cred = analyze_scam_url(raw_cred_url)
    assert res_cred.risk_score >= 50.0
    assert any("credentials" in f.lower() for f in res_cred.heuristic_findings)

    # 2. Unicode / IDN Homoglyph spoofing (Cyrillic a / p / e)
    raw_idn = "http://аррӏе.com/login"
    canon_idn, _, meta_idn = sanitize_and_redact_url(raw_idn)
    assert meta_idn["is_idn"] is True
    assert "xn--" in meta_idn["punycode_host"]
    res_idn = analyze_scam_url(raw_idn)
    assert any("idn" in f.lower() or "punycode" in f.lower() for f in res_idn.heuristic_findings)

    # 3. Sensitive query parameters
    raw_query = "https://example.com/checkout?token=eyJhbGciOiJIUzI1NiJ9.secretpayload&user=alice"
    canon_q, redacted_q, meta_q = sanitize_and_redact_url(raw_query)
    assert meta_q["has_sensitive_query"] is True
    assert "secretpayload" not in redacted_q
    assert "[REDACTED]" in redacted_q

    # 4. HTTPS does not imply benign legitimacy
    https_phish = "https://sbi-card-verification.netbanking-update.xyz/login.php"
    res_https = analyze_scam_url(https_phish)
    assert res_https.risk_score >= 50.0
    assert "does NOT guarantee that the recipient or domain is legitimate" in res_https.https_security_observation

    # 5. IPv4, IPv6 and non-standard ports
    url_ip_port = "http://192.168.1.50:8080/admin/login"
    res_ip = analyze_scam_url(url_ip_port)
    assert any("port" in f.lower() for f in res_ip.heuristic_findings)
    assert any("ip address" in f.lower() for f in res_ip.heuristic_findings)


def test_input_limits_and_empty_validation(client: TestClient):
    # 1. Empty message
    res_empty_msg = client.post("/api/analyse/message", json={"message": "   "})
    assert res_empty_msg.status_code == 400
    assert "cannot be empty" in res_empty_msg.json()["detail"].lower()

    # 2. Oversized message (> 3000 chars)
    giant_message = "Urgent scam message " * 300
    res_giant_msg = client.post("/api/analyse/message", json={"message": giant_message})
    assert res_giant_msg.status_code in [400, 422]

    # 3. Short URL (< 3 chars)
    res_short_url = client.post("/api/analyse/url", json={"url": "a"})
    assert res_short_url.status_code in [400, 422]

    # 4. Oversized URL (> 2048 chars)
    giant_url = "http://example.com/path?" + ("param=value&" * 300)
    res_giant_url = client.post("/api/analyse/url", json={"url": giant_url})
    assert res_giant_url.status_code in [400, 422]


def test_repeated_analysis_stability():
    text = "Dear customer, your electricity bill is unpaid. Power will cut at 9 PM. Call 9876543210."
    res1 = analyze_scam_message(text)
    res2 = analyze_scam_message(text)
    assert res1.risk_score == res2.risk_score
    assert res1.risk_level == res2.risk_level
    assert res1.verdict == res2.verdict
    assert len(res1.detected_signals) == len(res2.detected_signals)

    url = "https://free-crypto-giveaway.xyz/claim"
    url_res1 = analyze_scam_url(url)
    url_res2 = analyze_scam_url(url)
    assert url_res1.risk_score == url_res2.risk_score
    assert url_res1.risk_level == url_res2.risk_level


def test_privacy_zero_storage_on_scan(client: TestClient, db_session: Session):
    initial_count = db_session.query(Analysis).count()

    # Run multiple message scans
    client.post("/api/analyse/message", json={
        "message": "URGENT TEST: Call 9876543210 immediately to unblock your SBI account."
    })
    client.post("/api/analyse/message", json={
        "message": "Hello, meeting at 3 PM today."
    })

    # Ensure ZERO rows were inserted into the database analyses table
    final_count = db_session.query(Analysis).count()
    assert final_count == initial_count, "Transient message scans must not write records to the database"


def test_plain_text_report_generation():
    text = "URGENT: Your SBI account is suspended due to pending KYC. Click http://sbi-kyc-verify-portal.in"
    res = analyze_scam_message(text)

    assert res.report_text is not None
    assert "SHIELDNET CYBERSECURITY INTELLIGENCE" in res.report_text
    assert "LEGAL & ACCURACY NOTICE" in res.report_text
    assert "ZERO-STORAGE PRIVACY VERIFICATION" in res.report_text
    # Excludes full raw message by default
    assert "EXCLUDED BY DEFAULT PER ZERO-STORAGE PRIVACY POLICY" in res.report_text


def test_cors_headers(client: TestClient):
    # 1. Allowed origin (localhost)
    res_allowed = client.options(
        "/api/analyse/message",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        }
    )
    assert res_allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert res_allowed.headers.get("access-control-allow-credentials") == "true"

    # 2. Rejected unauthorized origin
    res_rejected = client.options(
        "/api/analyse/message",
        headers={
            "Origin": "https://malicious-attacker.evil",
            "Access-Control-Request-Method": "POST",
        }
    )
    assert res_rejected.headers.get("access-control-allow-origin") != "https://malicious-attacker.evil"


def test_message_probability_bands_and_unable_to_assess():
    from backend.app.services.risk_thresholds import (
        calculate_message_risk_from_probability,
        MESSAGE_PROBABILITY_THRESHOLDS
    )
    # Check 65.3% -> MEDIUM RISK
    res_65 = calculate_message_risk_from_probability(65.3)
    assert res_65["risk_level"] == "MEDIUM"
    assert res_65["display_label"] == "Medium Risk"
    assert res_65["is_assessed"] is True

    # Check boundaries
    # Low: < 30.0%
    assert calculate_message_risk_from_probability(0.0)["risk_level"] == "LOW"
    assert calculate_message_risk_from_probability(29.9)["risk_level"] == "LOW"

    # Medium: 30.0% to < 70.0%
    assert calculate_message_risk_from_probability(30.0)["risk_level"] == "MEDIUM"
    assert calculate_message_risk_from_probability(50.0)["risk_level"] == "MEDIUM"
    assert calculate_message_risk_from_probability(69.9)["risk_level"] == "MEDIUM"

    # High: 70.0% to 100%
    assert calculate_message_risk_from_probability(70.0)["risk_level"] == "HIGH"
    assert calculate_message_risk_from_probability(100.0)["risk_level"] == "HIGH"

    # Missing or invalid -> Unable to assess (never invent a score)
    res_none = calculate_message_risk_from_probability(None)
    assert res_none["risk_level"] == "UNABLE_TO_ASSESS"
    assert res_none["display_label"] == "Unable to Assess"
    assert res_none["is_assessed"] is False

    res_invalid = calculate_message_risk_from_probability(-5.0)
    assert res_invalid["risk_level"] == "UNABLE_TO_ASSESS"
    assert res_invalid["is_assessed"] is False


def test_elevated_probability_with_no_heuristic_triggers():
    from backend.app.services.report_generator import generate_plain_text_report

    # Simulate an assessment with 65.3% scam probability (MEDIUM RISK) and zero heuristic triggers
    data_65 = {
        "risk_score": 65.3,
        "risk_level": "MEDIUM",
        "heuristic_score": 0.0,
        "verdict": "MEDIUM RISK ASSESSMENT — 65.3% SCAM PROBABILITY",
        "detected_signals": [],
        "warning_signals": [],
        "model_contributing_features": [],
        "explanation": (
            "The model evaluated a 65.3% scam probability (Medium Risk). "
            "The model estimates elevated scam risk from the message’s overall text patterns, but no individual warning trigger was identified. "
            "Separately, no explicit heuristic warning triggers were matched (Heuristic Indicator Score: 0/100). "
            "Note: A 0/100 heuristic score does not cancel or disprove the model's statistical assessment; "
            "the heuristic scan checks for predefined trigger phrases, whereas the model evaluates broader linguistic patterns."
        ),
        "summary": "Medium Risk: Evaluated at 65.3% scam probability by calibrated model.",
        "safe_next_steps": [
            "Exercise caution: The model identified elevated scam risk resembling known fraudulent lures.",
            "Do not click unverified links, forward codes, or transfer funds without independent verification.",
            "Verify the claim independently: Contact the supposed organization directly using an official number from their official website."
        ],
        "ml_probability": 65.3,
        "ml_prediction": "SCAM_OR_FRAUD",
        "model_version": "v1.1.0",
        "model_type": "TF-IDF + Calibrated Logistic Regression",
    }

    report = generate_plain_text_report("message", data_65)

    # 1. Matches model probability and risk band
    assert "MEDIUM RISK (65.3% scam probability)" in report
    assert "Verdict Summary  : MEDIUM RISK ASSESSMENT — 65.3% SCAM PROBABILITY" in report

    # 2. Heuristic score is separate metric (0.0/100.0)
    assert "Heuristic Score  : 0.0 / 100.0" in report
    assert "Matched Triggers : None (No individual rule-based warning triggers identified)." in report

    # 3. Explains overall text patterns without inventing reasons
    assert "The model estimates elevated scam risk from the message's" in report or "overall text patterns" in report

    # 4. Clarifies that 0/100 heuristic score does not cancel model prediction
    assert "does not cancel or disprove" in report

    # 5. Next steps match Medium Risk band
    assert "Exercise caution" in report


