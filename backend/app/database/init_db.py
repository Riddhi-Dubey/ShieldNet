import json
from sqlalchemy.orm import Session
from backend.app.database.database import engine, Base, SessionLocal
from backend.app.models.user import User
from backend.app.models.quiz import QuizQuestion
from backend.app.security.authentication import hash_password
from backend.app.database.synthetic_seed import seed_synthetic_data
from backend.app.services.quiz import VERIFIED_QUIZ_BANK


def init_db():
    """Initializes tables, seeds baseline users, quiz bank, and synthetic network data."""
    print("Creating database schema...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # 1. Seed Default Users
        seed_users = [
            {"username": "admin", "password": "Admin@12345", "role": "admin"},
            {"username": "analyst", "password": "Analyst@12345", "role": "investigator"},
            {"username": "demouser", "password": "User@12345", "role": "user"}
        ]

        for u in seed_users:
            existing = db.query(User).filter(User.username == u["username"]).first()
            if not existing:
                user = User(
                    username=u["username"],
                    password_hash=hash_password(u["password"]),
                    role=u["role"]
                )
                db.add(user)
                print(f"Created initial user: {u['username']} ({u['role']})")

        # 2. Seed Quiz Questions
        if db.query(QuizQuestion).count() == 0:
            for q in VERIFIED_QUIZ_BANK:
                quiz_q = QuizQuestion(
                    question_id=q["question_id"],
                    topic=q["topic"],
                    question=q["question"],
                    options=json.dumps(q["options"]),
                    correct_answer=str(q["correct_option_index"]),
                    explanation=q["explanation"],
                    source=q["source"]
                )
                db.add(quiz_q)
            print(f"Seeded {len(VERIFIED_QUIZ_BANK)} quiz questions.")

        db.commit()

        # 3. Seed Synthetic Demonstration Intelligence
        seed_synthetic_data(db)

        print("Database initialization complete.")
    except Exception as e:
        print(f"Error during database initialization: {e}")
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
