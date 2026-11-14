import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from backend.app.database.database import Base


class Relationship(Base):
    __tablename__ = "relationships"

    relationship_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_entity_id = Column(String(64), ForeignKey("entities.entity_id"), nullable=False, index=True)
    target_entity_id = Column(String(64), ForeignKey("entities.entity_id"), nullable=False, index=True)
    relationship_type = Column(String(50), nullable=False)  # TRANSACTED_WITH, COMMUNICATED_WITH, HOSTED_ON, REDIRECTS_TO, OWNS, ASSOCIATED_WITH
    confidence = Column(Float, nullable=False, default=1.0)  # 0.0 to 1.0
    evidence_source = Column(String(100), nullable=False, default="USER_REPORT")
    relationship_metadata = Column(Text, nullable=True)     # JSON string with extra details (e.g. amount, step, call duration)
    evidence_status = Column(String(50), nullable=False, default="UNVERIFIED")  # DATASET_DERIVED, VERIFIED, REPORTED, INFERRED, SYNTHETIC, UNVERIFIED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Relationship {self.source_entity_id} -[{self.relationship_type}]-> {self.target_entity_id}>"
