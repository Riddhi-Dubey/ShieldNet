import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from backend.app.database.database import Base


class Case(Base):
    __tablename__ = "cases"

    case_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(30), nullable=False, default="OPEN")      # OPEN, UNDER_INVESTIGATION, ESCALATED, RESOLVED, CLOSED
    assigned_to = Column(String(100), nullable=True, default="Unassigned")
    created_by = Column(String(64), nullable=True)                  # user_id or username
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    entities = relationship("CaseEntity", back_populates="case", cascade="all, delete-orphan")
    notes = relationship("CaseNote", back_populates="case", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Case {self.case_id}: {self.title} ({self.status})>"


class CaseEntity(Base):
    __tablename__ = "case_entities"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(64), ForeignKey("cases.case_id"), nullable=False, index=True)
    entity_id = Column(String(64), ForeignKey("entities.entity_id"), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("Case", back_populates="entities")
    entity = relationship("Entity")

    def __repr__(self):
        return f"<CaseEntity case={self.case_id} entity={self.entity_id}>"


class CaseNote(Base):
    __tablename__ = "case_notes"

    note_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(64), ForeignKey("cases.case_id"), nullable=False, index=True)
    author = Column(String(100), nullable=False, default="Investigator")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    case = relationship("Case", back_populates="notes")

    def __repr__(self):
        return f"<CaseNote {self.note_id} on {self.case_id} by {self.author}>"
