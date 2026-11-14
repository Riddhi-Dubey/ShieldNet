import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime
from backend.app.database.database import Base


class DatasetImport(Base):
    __tablename__ = "dataset_imports"

    import_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_name = Column(String(100), nullable=False)
    records_processed = Column(Integer, default=0)
    records_imported = Column(Integer, default=0)
    records_rejected = Column(Integer, default=0)
    records_duplicated = Column(Integer, default=0)
    import_status = Column(String(50), default="SUCCESS")  # SUCCESS, PARTIAL, FAILED
    imported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<DatasetImport {self.dataset_name} ({self.import_status})>"
