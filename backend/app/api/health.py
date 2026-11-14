from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database.database import get_db
from backend.app.ml.predict import get_loaded_model

router = APIRouter(tags=["Health"])


@router.get("/health")
def get_health_status(db: Session = Depends(get_db)):
    """
    Health check endpoint returning system status, database connectivity,
    ML model status, and operational timestamps.
    """
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    model, meta = get_loaded_model()
    ml_status = {
        "model_loaded": model is not None,
        "model_type": type(model).__name__ if model else "None",
        "features_count": len(meta.get("feature_names", [])) if meta else 0
    }

    return {
        "status": "HEALTHY" if db_ok else "DEGRADED",
        "service": "ScamShield + Intelligent Scam Network Mapper",
        "version": "1.0.0",
        "database": {
            "status": "UP" if db_ok else "DOWN",
            "type": "SQLite"
        },
        "machine_learning": ml_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
