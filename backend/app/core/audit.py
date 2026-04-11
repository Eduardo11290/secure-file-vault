from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request
import uuid
from typing import Optional

from app.models.audit import AuditLog

async def log_audit(
    db: AsyncSession,
    request: Request,
    action: str,
    status: str,
    user_id: Optional[uuid.UUID] = None,
    resource_id: Optional[str] = None,
    details: Optional[str] = None,
):
    ip_address = request.client.host if request.client else "unknown"
    
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_id=resource_id,
        ip_address=ip_address,
        status=status,
        details=details,
    )
    db.add(audit_log)
    await db.commit()