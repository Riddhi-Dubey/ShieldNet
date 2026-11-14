import uuid
from sqlalchemy import Column, String, Text
from backend.app.database.database import Base


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    question_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic = Column(String(100), nullable=False)  # Phishing, UPI Fraud, OTP Security, Fake Employment, QR Code Fraud
    question = Column(Text, nullable=False)
    options = Column(Text, nullable=False)       # JSON string list of options
    correct_answer = Column(String(50), nullable=False)  # e.g., "0", "1", or text matching correct option
    explanation = Column(Text, nullable=False)
    source = Column(String(100), default="CERT-In / RBI Cyber Guidelines")

    def __repr__(self):
        return f"<QuizQuestion {self.question_id} ({self.topic})>"
