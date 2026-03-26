from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class FileResponse(BaseModel):
    id: UUID
    filename: str
    created_at: datetime
    
    class Config:
        from_attributes = True