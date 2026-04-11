import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class ShareLink(Base):
    __tablename__ = "share_links"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    
    # New fields to support the UI
    recipient_email = Column(String, nullable=True)
    pin_hash = Column(String, nullable=True)
    download_limit = Column(Integer, nullable=True) # None means unlimited
    downloads_count = Column(Integer, default=0)
    
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)