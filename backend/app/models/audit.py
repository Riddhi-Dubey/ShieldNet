import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from backend.app.database.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(64), nullable=True, index=True)
    action = Column(String(100), nullable=False)    # e.g., "SEARCH_ENTITY", "SUBMIT_REPORT", "REVOKE_CONSENT"
    resource = Column(String(255), nullable=False)  # e.g., "entity:PHONE:9876543210" (sensitive tokens redacted)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<AuditLog {self.action} on {self.resource}>"
