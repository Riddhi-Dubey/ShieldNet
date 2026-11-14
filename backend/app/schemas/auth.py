from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    role: str


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None


class UserLogin(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    role: str = Field("user", description="user, investigator, admin, guest")
    invite_code: Optional[str] = Field(None, description="Optional administrative invite code for role promotion")


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: str
    username: str
    role: str
    created_at: datetime
