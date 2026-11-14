import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from backend.app.database.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    analysis_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_id = Column(String(64), ForeignKey("entities.entity_id"), nullable=True, index=True)
    model_prediction = Column(String(100), nullable=False)
    risk_score = Column(Float, nullable=False, default=0.0)
    explanation = Column(Text, nullable=True)  # JSON or text explanation of signals
    analysed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<Analysis {self.analysis_id} score={self.risk_score}>"
