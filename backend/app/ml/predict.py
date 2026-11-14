import os
import joblib
import numpy as np
from typing import Dict, Any, Tuple
from backend.app.ml.features import extract_url_features, features_dict_to_vector

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "phishing_model.joblib")
META_PATH = os.path.join(MODEL_DIR, "model_metadata.joblib")

_model = None
_metadata = None


def get_loaded_model():
    """Lazy loader for trained Scikit-learn model."""
    global _model, _metadata
    if _model is None:
        if os.path.exists(MODEL_PATH):
            try:
                _model = joblib.load(MODEL_PATH)
                if os.path.exists(META_PATH):
                    _metadata = joblib.load(META_PATH)
            except Exception as e:
                print(f"Warning: Failed to load model from {MODEL_PATH}: {e}")
                _model = None
    return _model, _metadata


def predict_url_phishing(url: str) -> Dict[str, Any]:
    """
    Predicts whether a URL is phishing using the trained ML model.
    Falls back gracefully if the model is unavailable.
    """
    features = extract_url_features(url)
    vector = features_dict_to_vector(features).reshape(1, -1)

    model, meta = get_loaded_model()

    if model is not None:
        try:
            pred_class = model.predict(vector)[0]
            probs = model.predict_proba(vector)[0]
            phishing_prob = float(probs[1]) if len(probs) > 1 else float(pred_class)

            prediction_label = "PHISHING" if (pred_class == 1 or phishing_prob >= 0.5) else "BENIGN"
            confidence = round(phishing_prob if prediction_label == "PHISHING" else (1.0 - phishing_prob), 3)

            return {
                "model_available": True,
                "prediction": prediction_label,
                "confidence": confidence,
                "phishing_probability": round(phishing_prob, 3),
                "features": features
            }
        except Exception as e:
            print(f"Error during ML prediction: {e}")

    # Fallback to pure heuristic prediction
    # High risk signals: IP address, >1 suspicious keyword, shortener, punycode, hyphens
    heuristic_score = 0.0
    if features.get("ip_address_presence", 0) > 0:
        heuristic_score += 40.0
    if features.get("suspicious_keyword_count", 0) >= 2:
        heuristic_score += 35.0
    elif features.get("suspicious_keyword_count", 0) == 1:
        heuristic_score += 15.0
    if features.get("shortener_presence", 0) > 0:
        heuristic_score += 20.0
    if features.get("punycode_presence", 0) > 0:
        heuristic_score += 30.0
    if features.get("subdomain_count", 0) >= 3:
        heuristic_score += 15.0
    if features.get("https_presence", 0) == 0:
        heuristic_score += 10.0

    is_phishing = heuristic_score >= 40.0
    return {
        "model_available": False,
        "prediction": "PHISHING" if is_phishing else "BENIGN",
        "confidence": round(min(1.0, heuristic_score / 100.0), 3),
        "phishing_probability": round(min(1.0, heuristic_score / 100.0), 3),
        "features": features
    }
