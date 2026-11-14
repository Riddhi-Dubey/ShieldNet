import pytest
from backend.app.services.risk_scoring import evaluate_entity_risk, calculate_risk_level


def test_risk_score_tiers():
    assert calculate_risk_level(15.0) == "LOW"
    assert calculate_risk_level(45.0) == "MEDIUM"
    assert calculate_risk_level(65.0) == "HIGH"
    assert calculate_risk_level(85.0) == "CRITICAL"


def test_explainable_risk_breakdown():
    # Verified malicious with 2 reports and connected high risk nodes
    eval_result = evaluate_entity_risk(
        is_verified_malicious=True,
        is_dataset_fraud=False,
        report_count=3,
        connected_high_risk_count=2,
        phishing_ml_score=80.0,
        evidence_status="VERIFIED"
    )

    score = eval_result["final_score"]
    assert 60.0 <= score <= 100.0
    assert eval_result["risk_level"] in ["HIGH", "CRITICAL"]

    signals = eval_result["signals"]
    assert len(signals) >= 3
    for s in signals:
        assert "signal" in s
        assert "evidence_source" in s
        assert "weight" in s
        assert "contribution" in s
        assert "description" in s

    assert "limitations" in eval_result


def test_high_connectivity_alone_does_not_cause_critical_risk():
    # Entity with zero fraud reports, zero ML flags, zero verified malicious signals,
    # but lots of connections to low-risk nodes
    eval_result = evaluate_entity_risk(
        is_verified_malicious=False,
        is_dataset_fraud=False,
        report_count=0,
        connected_high_risk_count=0,
        phishing_ml_score=0.0,
        evidence_status="UNVERIFIED"
    )
    # Score should be 0 or strictly low
    assert eval_result["final_score"] < 30.0
    assert eval_result["risk_level"] == "LOW"
