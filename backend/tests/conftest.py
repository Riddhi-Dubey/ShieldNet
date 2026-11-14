import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure backend package can be imported
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.app.database.database import Base, get_db
from backend.app.main import app
from backend.app.database.init_db import init_db

TEST_DATABASE_URL = "sqlite:///./test_scamshield.db"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Initializes test database schema and seeds."""
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    # Override get_db dependency
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    # Seed test database with users and synthetic records
    db = TestingSessionLocal()
    from backend.app.models.user import User
    from backend.app.security.authentication import hash_password
    from backend.app.database.synthetic_seed import seed_synthetic_data

    # Seed admin and analyst
    if not db.query(User).filter(User.username == "admin").first():
        db.add(User(username="admin", password_hash=hash_password("Admin@12345"), role="admin"))
    if not db.query(User).filter(User.username == "analyst").first():
        db.add(User(username="analyst", password_hash=hash_password("Analyst@12345"), role="investigator"))
    if not db.query(User).filter(User.username == "demouser").first():
        db.add(User(username="demouser", password_hash=hash_password("User@12345"), role="user"))
    db.commit()

    seed_synthetic_data(db)
    db.close()

    yield

    # Teardown
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_scamshield.db"):
        try:
            os.remove("./test_scamshield.db")
        except Exception:
            pass


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
