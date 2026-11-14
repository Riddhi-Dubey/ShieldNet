import math
from typing import Dict, Any, List


def calculate_risk_level(score: float) -> str:
    """Categorizes 0-100 score into prototype risk tiers."""
    if score >= 80.0:
        return "CRITICAL"
    elif score >= 60.0:
        return "HIGH"
    elif score >= 30.0:
        return "MEDIUM"
    else:
        return "LOW"


def evaluate_entity_risk(
    is_verified_malicious: bool = False,
    is_dataset_fraud: bool = False,
    report_count: int = 0,
    connected_high_risk_count: int = 0,
    phishing_ml_score: float = 0.0,
    has_repeated_patterns: bool = False,
    evidence_status: str = "UNVERIFIED"
) -> Dict[str, Any]:
    """
    Configurable, explainable risk scoring engine (0-100).
    Combines weighted evidence with dampening to avoid double-counting.
    High connectivity alone does not trigger high risk.
    """
    signals: List[Dict[str, Any]] = []
    raw_accumulated = 0.0

    # 1. Verified malicious source match
    if is_verified_malicious or evidence_status == "VERIFIED":
        weight = 55.0
        signals.append({
            "signal": "VERIFIED_MALICIOUS_RECORD",
            "evidence_source": "Threat Intelligence Blacklist / Verified Flag",
            "weight": weight,
            "contribution": weight,
            "description": "Entity is confirmed malicious in a verified source registry."
        })
        raw_accumulated += weight

    # 2. Dataset-confirmed fraud
    if is_dataset_fraud:
        weight = 40.0
        signals.append({
            "signal": "DATASET_FRAUD_RECORD",
            "evidence_source": "Supervised Dataset Indicator (e.g. isFraud=1)",
            "weight": weight,
            "contribution": weight,
            "description": "Entity was directly flagged in verified transaction dataset records."
        })
        raw_accumulated += weight

    # 3. Independent reports (diminishing returns to prevent report spam manipulation)
    if report_count > 0:
        # Diminishing log-scaled contribution up to max 35 points
        report_contribution = min(35.0, 15.0 + 8.0 * math.log2(report_count))
        signals.append({
            "signal": "INDEPENDENT_CITIZEN_REPORTS",
            "evidence_source": "User Submission Registry",
            "weight": 35.0,
            "contribution": round(report_contribution, 2),
            "description": f"{report_count} independent user report(s) submitted against this identifier."
        })
        raw_accumulated += report_contribution

    # 4. Multi-hop connections to high-risk entities (damped, connectivity != guilt)
    if connected_high_risk_count > 0:
        # Dampening: max 20 points, requires direct links to high-risk nodes
        conn_contrib = min(20.0, 6.0 * math.sqrt(connected_high_risk_count))
        signals.append({
            "signal": "SUSPICIOUS_NETWORK_PROXIMITY",
            "evidence_source": "Graph Adjacency Analysis",
            "weight": 20.0,
            "contribution": round(conn_contrib, 2),
            "description": f"Entity is adjacent to {connected_high_risk_count} confirmed high/critical risk nodes (investigative lead only)."
        })
        raw_accumulated += conn_contrib

    # 5. Phishing Machine Learning or heuristic score
    if phishing_ml_score > 0.0:
        ml_contrib = min(30.0, (phishing_ml_score / 100.0) * 30.0)
        signals.append({
            "signal": "PHISHING_MODEL_EVALUATION",
            "evidence_source": "Scikit-Learn Classifier / Lexical Engine",
            "weight": 30.0,
            "contribution": round(ml_contrib, 2),
            "description": f"Lexical/structural feature analysis scored {phishing_ml_score:.1f}/100."
        })
        raw_accumulated += ml_contrib

    # 6. Repeated transaction patterns
    if has_repeated_patterns:
        pat_weight = 15.0
        signals.append({
            "signal": "REPEATED_SUSPICIOUS_FLOWS",
            "evidence_source": "Transaction Pathway Profiling",
            "weight": pat_weight,
            "contribution": pat_weight,
            "description": "Rapid succession or structured forwarding patterns detected."
        })
        raw_accumulated += pat_weight

    # Diminishing saturation curve for final score: 100 * (1 - exp(-raw / 60))
    # Or cap at 100 with smooth dampening
    if raw_accumulated <= 0.0:
        final_score = 0.0
    else:
        # Smoothly map to 0-100
        final_score = min(100.0, round(raw_accumulated, 2))

    risk_level = calculate_risk_level(final_score)

    return {
        "final_score": final_score,
        "risk_level": risk_level,
        "signals": signals,
        "limitations": (
            "Risk scores are algorithmic heuristics and prototype decision support indicators. "
            "They do NOT represent calibrated criminal probabilities or legal proof of guilt. "
            "Corroborating forensic verification is always required."
        )
    }
