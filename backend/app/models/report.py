import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from backend.app.database.database import Base


class Report(Base):
    __tablename__ = "reports"

    report_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_id = Column(String(64), ForeignKey("entities.entity_id"), nullable=False, index=True)
    scam_type = Column(String(50), nullable=False)  # UPI_FRAUD, OTP_THEFT, PHISHING, FAKE_JOB, INVESTMENT_SCAM, IMPERSONATION, CRYPTO_FRAUD, OTHER
    description = Column(Text, nullable=True)       # Redacted sanitised description
    source = Column(String(50), nullable=False, default="USER_REPORT")  # USER_REPORT, INVESTIGATOR, AUTOMATED
    verification_status = Column(String(50), nullable=False, default="UNVERIFIED")  # UNVERIFIED, UNDER_REVIEW, VERIFIED, REJECTED
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Report {self.report_id} on {self.entity_id} ({self.scam_type})>"
