from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from backend.app.database.database import Base


class Entity(Base):
    __tablename__ = "entities"

    entity_id = Column(String(64), primary_key=True)  # Stable SHA-256 or unique ID
    entity_type = Column(String(50), nullable=False, index=True)  # PHONE, URL, DOMAIN, BANK_ACCOUNT, CRYPTO_WALLET
    identifier = Column(String(255), nullable=False)              # Original representation
    normalized_value = Column(String(255), nullable=False, index=True)  # Normalized representation
    risk_score = Column(Float, nullable=False, default=0.0)       # 0.0 to 100.0
    risk_level = Column(String(20), nullable=False, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    source_dataset = Column(String(100), nullable=False, default="USER_REPORT")
    evidence_status = Column(String(50), nullable=False, default="UNVERIFIED")  # DATASET_DERIVED, VERIFIED, REPORTED, INFERRED, SYNTHETIC, UNVERIFIED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Entity {self.entity_type}:{self.normalized_value} ({self.risk_level})>"
