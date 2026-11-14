from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.models.user import User
from backend.app.schemas.auth import UserLogin, Token, UserOut, UserCreate
from backend.app.security.authentication import (
    verify_password,
    create_access_token,
    get_current_user,
    hash_password,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login_endpoint(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticates a user and issues a signed JWT bearer token.
    Default seed users:
    - admin / Admin@12345 (role: admin)
    - analyst / Analyst@12345 (role: investigator)
    - demouser / User@12345 (role: user)
    """
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(
        data={"sub": user.user_id, "username": user.username, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.user_id,
        username=user.username,
        role=user.role
    )


@router.post("/register", response_model=UserOut)
def register_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Registers a new standard user."""
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    # Prevent privilege escalation: standard self-registration defaults to "user" (citizen).
    # Investigator or Admin elevation requires a verified invite code or administrator provisioning.
    assigned_role = "user"
    if payload.role in ["investigator", "admin"]:
        admin_invite = os.getenv("ADMIN_INVITE_CODE", "shieldnet-cyber-intel-2026")
        if payload.invite_code and payload.invite_code == admin_invite:
            assigned_role = payload.role
        else:
            assigned_role = "user"

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        role=assigned_role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieves authenticated user profile and active role."""
    return current_user
