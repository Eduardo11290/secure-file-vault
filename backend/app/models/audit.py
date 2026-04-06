import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String, index=True)  # LOGIN, UPLOAD, DOWNLOAD, DELETE, SHARE
    resource_id = Column(String, nullable=True)  # Can be a file_id, share_token, etc.
    ip_address = Column(String)
    status = Column(String)  # SUCCESS / FAILURE
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    details = Column(Text, nullable=True)
