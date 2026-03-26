from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel):
    """Schema for incoming registration requests."""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Schema for outgoing user data (excludes password)."""
    id: UUID
    email: EmailStr
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # Allows Pydantic to read SQLAlchemy models