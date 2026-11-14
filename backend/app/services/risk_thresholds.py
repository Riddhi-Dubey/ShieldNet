"""
Risk Thresholds Configuration
Centralized single source of truth for scam probability bands and risk levels.
"""

from typing import Optional, Dict, Any, Tuple

# Initial probability bands:
# - Low risk: below 30%
# - Medium risk: 30% to below 70%
# - High risk: 70% to 100%
MESSAGE_PROBABILITY_THRESHOLDS = {
    "LOW_MAX": 30.0,       # Strictly below 30% -> LOW
    "MEDIUM_MAX": 70.0,    # 30% to below 70% -> MEDIUM
    # 70% and above -> HIGH
}


def calculate_message_risk_from_probability(ml_prob: Optional[float]) -> Dict[str, Any]:
    """
    Derives the risk level, display label, and verdict directly from the
    TF-IDF + Calibrated Logistic Regression model's scam probability.
    
    Returns a dict with:
      - risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNABLE_TO_ASSESS'
      - display_label: 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Unable to Assess'
      - is_assessed: True | False
      - scam_probability: float | None
    """
    if ml_prob is None or not isinstance(ml_prob, (int, float)) or ml_prob < 0.0 or ml_prob > 100.0:
        return {
            "risk_level": "UNABLE_TO_ASSESS",
            "display_label": "Unable to Assess",
            "is_assessed": False,
            "scam_probability": None,
        }

    prob = round(float(ml_prob), 1)
    if prob < MESSAGE_PROBABILITY_THRESHOLDS["LOW_MAX"]:
        return {
            "risk_level": "LOW",
            "display_label": "Low Risk",
            "is_assessed": True,
            "scam_probability": prob,
        }
    elif prob < MESSAGE_PROBABILITY_THRESHOLDS["MEDIUM_MAX"]:
        return {
            "risk_level": "MEDIUM",
            "display_label": "Medium Risk",
            "is_assessed": True,
            "scam_probability": prob,
        }
    else:
        return {
            "risk_level": "HIGH",
            "display_label": "High Risk",
            "is_assessed": True,
            "scam_probability": prob,
        }
