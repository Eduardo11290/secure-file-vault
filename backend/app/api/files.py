import os
import uuid
from sqlalchemy.future import select
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.file import File as DBFile
from app.schemas.file import FileResponse
from app.core.crypto import encrypt_data, decrypt_data
from typing import List

router = APIRouter()

VAULT_DIR = "vault/"
os.makedirs(VAULT_DIR, exist_ok=True)

@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Encrypts an incoming file, saves it to disk, and stores metadata in the DB."""
    try:
        file_bytes = await file.read()
        encrypted_bytes = encrypt_data(file_bytes)
        
        physical_filename = f"{uuid.uuid4()}.enc"
        file_path = os.path.join(VAULT_DIR, physical_filename)
        
        with open(file_path, "wb") as f:
            f.write(encrypted_bytes)
            
        new_file = DBFile(
            user_id=current_user.id,
            filename=file.filename,
            encrypted_path=file_path
        )
        
        db.add(new_file)
        await db.commit()
        await db.refresh(new_file)
        
        return new_file
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File processing error: {str(e)}"
        )
    
@router.get("/download/{file_id}")
async def download_file(
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetches, decrypts, and returns a file owned by the authenticated user."""
    
    # 1. Verify the file exists and belongs to the current user
    result = await db.execute(
        select(DBFile).where(DBFile.id == file_id, DBFile.user_id == current_user.id)
    )
    db_file = result.scalars().first()
    
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="File not found or access denied"
        )
        
    # 2. Check if the physical file still exists on the disk
    if not os.path.exists(db_file.encrypted_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Physical file is missing from the vault"
        )
        
    # 3. Read the encrypted bytes from the disk
    with open(db_file.encrypted_path, "rb") as f:
        encrypted_bytes = f.read()
        
    # 4. Decrypt the bytes in memory
    try:
        decrypted_bytes = decrypt_data(encrypted_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Decryption failed. The file or key might be corrupted."
        )
        
    # 5. Return the raw bytes as a downloadable file attachment
    return Response(
        content=decrypted_bytes,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{db_file.filename}"'
        }
    )

@router.get("/", response_model=List[FileResponse])
async def list_files(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves a list of all files owned by the authenticated user."""
    
    result = await db.execute(
        select(DBFile).where(DBFile.user_id == current_user.id)
    )
    files = result.scalars().all()
    
    return files