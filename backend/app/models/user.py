import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from backend.app.database.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="user")  # admin, investigator, user, guest
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
