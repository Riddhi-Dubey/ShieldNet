import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from backend.app.database.database import Base


class Consent(Base):
    __tablename__ = "consents"

    consent_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(64), nullable=True, index=True)
    session_id = Column(String(128), nullable=True, index=True)
    purpose = Column(String(100), nullable=False)        # e.g., "SCAM_REPORTING", "THREAT_ANALYSIS", "COMMUNITY_SHARING"
    destination = Column(String(100), nullable=False)    # e.g., "SCAMTRACE_INTELLIGENCE", "INTERNAL_AUDIT"
    data_scope = Column(String(100), nullable=False)     # e.g., "SANITIZED_INDICATORS", "ENTITY_ONLY", "FULL_ANONYMIZED"
    consent_version = Column(String(20), default="1.0")
    status = Column(String(20), nullable=False, default="ACTIVE")  # ACTIVE, REVOKED, EXPIRED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    revoked_at = Column(DateTime, nullable=True)

    def is_valid_for(self, purpose: str, destination: str, scope: str) -> bool:
        """Verify if consent is active, not revoked, and matches purpose, destination, and scope."""
        if self.status != "ACTIVE" or self.revoked_at is not None:
            return False
        if self.purpose != purpose:
            return False
        if self.destination != destination:
            return False
        if self.data_scope != scope:
            return False
        return True

    def revoke(self):
        self.status = "REVOKED"
        self.revoked_at = datetime.now(timezone.utc)
