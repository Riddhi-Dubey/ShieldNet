import uuid
from sqlalchemy import Column, String, ForeignKey
from backend.app.database.database import Base


class Evidence(Base):
    __tablename__ = "evidence"

    evidence_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    relationship_id = Column(String(64), ForeignKey("relationships.relationship_id"), nullable=True, index=True)
    source_report_id = Column(String(64), ForeignKey("reports.report_id"), nullable=True, index=True)
    source_dataset = Column(String(100), nullable=False)
    original_field = Column(String(100), nullable=True)
    extraction_method = Column(String(100), nullable=False, default="AUTOMATED_PARSER")
    evidence_status = Column(String(50), nullable=False, default="DATASET_DERIVED")

    def __repr__(self):
        return f"<Evidence {self.evidence_id} ({self.evidence_status})>"
