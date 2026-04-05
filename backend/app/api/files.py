import os
import uuid
import secrets
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
from datetime import datetime, timedelta, timezone
from app.models.share import ShareLink

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

@router.delete("/{file_id}")
async def delete_file(
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Deletes a file record from the database and removes the physical encrypted file."""
    
    result = await db.execute(
        select(DBFile).where(DBFile.id == file_id, DBFile.user_id == current_user.id)
    )
    db_file = result.scalars().first()
    
    if not db_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="File not found or access denied"
        )
        
    # Attempt to remove the physical file from the vault directory
    if os.path.exists(db_file.encrypted_path):
        try:
            os.remove(db_file.encrypted_path)
        except Exception as e:
            # Log error but proceed with DB deletion to maintain state consistency
            print(f"Warning: Could not delete physical file: {str(e)}")
            
    await db.delete(db_file)
    await db.commit()
    
    return {"detail": "File deleted successfully"}

@router.post("/{file_id}/share")
async def create_share_link(
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generates a secure, single-use token valid for 24 hours."""
    result = await db.execute(
        select(DBFile).where(DBFile.id == file_id, DBFile.user_id == current_user.id)
    )
    db_file = result.scalars().first()
    
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
        
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)
    
    share_link = ShareLink(
        file_id=db_file.id,
        token=token,
        expires_at=expires
    )
    
    db.add(share_link)
    await db.commit()
    
    return {"share_token": token, "expires_at": expires}

@router.get("/shared/{token}")
async def download_shared_file(token: str, db: AsyncSession = Depends(get_db)):
    """Retrieves and decrypts a file using a valid share token. No auth required."""
    result = await db.execute(
        select(ShareLink).where(ShareLink.token == token)
    )
    link = result.scalars().first()
    
    # Check if token exists, is not used, and is not expired
    if not link or link.is_used or link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid, expired, or used token")
        
    file_result = await db.execute(select(DBFile).where(DBFile.id == link.file_id))
    db_file = file_result.scalars().first()
    
    if not db_file or not os.path.exists(db_file.encrypted_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Physical file missing")
        
    with open(db_file.encrypted_path, "rb") as f:
        encrypted_bytes = f.read()
        
    decrypted_bytes = decrypt_data(encrypted_bytes)
    
    # Burn the token so it can never be used again
    link.is_used = True
    await db.commit()
    
    return Response(
        content=decrypted_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{db_file.filename}"'}
    )