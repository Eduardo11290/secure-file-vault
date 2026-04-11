import os
import uuid
import secrets
from sqlalchemy.future import select
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Response, Request, Body, Header
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.core.audit import log_audit
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.file import File as DBFile
from app.schemas.file import FileResponse
from app.core.crypto import encrypt_data, decrypt_data
from app.core.email import send_share_email
from app.core.config import settings
from typing import List
from datetime import datetime, timedelta, timezone
from app.models.share import ShareLink

router = APIRouter()

VAULT_DIR = "vault/"
os.makedirs(VAULT_DIR, exist_ok=True)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    request: Request,
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
            encrypted_path=file_path,
            file_size=len(file_bytes)
        )
        
        db.add(new_file)
        await db.commit()
        await db.refresh(new_file)
        
        await log_audit(db, request, "UPLOAD", "SUCCESS", user_id=current_user.id, resource_id=str(new_file.id), details=new_file.filename)
        return new_file
        
    except Exception as e:
        await log_audit(db, request, "UPLOAD", "FAILURE", user_id=current_user.id, details=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File processing error: {str(e)}"
        )
    
@router.get("/download/{file_id}")
async def download_file(
    request: Request,
    file_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetches, decrypts, and returns a file owned by the authenticated user."""
    
    result = await db.execute(
        select(DBFile).where(DBFile.id == file_id, DBFile.user_id == current_user.id)
    )
    db_file = result.scalars().first()
    
    if not db_file:
        await log_audit(db, request, "DOWNLOAD", "FAILURE", user_id=current_user.id, resource_id=str(file_id), details="File not found or access denied")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="File not found or access denied"
        )
        
    if not os.path.exists(db_file.encrypted_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Physical file is missing from the vault"
        )
        
    with open(db_file.encrypted_path, "rb") as f:
        encrypted_bytes = f.read()
        
    try:
        decrypted_bytes = decrypt_data(encrypted_bytes)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Decryption failed. The file or key might be corrupted."
        )
        
    await log_audit(db, request, "DOWNLOAD", "SUCCESS", user_id=current_user.id, resource_id=str(db_file.id))
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
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    search: str | None = None
):
    """Retrieves a list of all files owned by the authenticated user."""
    
    query = select(DBFile).where(DBFile.user_id == current_user.id)
    
    if search:
        query = query.where(DBFile.filename.ilike(f"%{search}%"))
        
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    files = result.scalars().all()
    
    return files

@router.delete("/{file_id}")
async def delete_file(
    request: Request,
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
        await log_audit(db, request, "DELETE", "FAILURE", user_id=current_user.id, resource_id=str(file_id), details="File not found or access denied")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="File not found or access denied"
        )
        
    if os.path.exists(db_file.encrypted_path):
        try:
            os.remove(db_file.encrypted_path)
        except Exception as e:
            print(f"Warning: Could not delete physical file: {str(e)}")
            
    await db.delete(db_file)
    await db.commit()
    
    await log_audit(db, request, "DELETE", "SUCCESS", user_id=current_user.id, resource_id=str(file_id))
    return {"detail": "File deleted successfully"}

@router.post("/{file_id}/share")
async def create_share_link(
    request: Request,
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
        await log_audit(db, request, "SHARE", "FAILURE", user_id=current_user.id, resource_id=str(file_id), details="File not found")
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
    
    await log_audit(db, request, "SHARE", "SUCCESS", user_id=current_user.id, resource_id=str(file_id), details=f"Generated token ...{token[-4:]}")
    return {"share_token": token, "expires_at": expires}

@router.post("/{file_id}/share-email")
async def share_file_via_email(
    request: Request,
    file_id: uuid.UUID,
    recipient_email: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generates a share token and sends it via email to the recipient."""

    # 1. Verifică că fișierul aparține userului curent
    result = await db.execute(
        select(DBFile).where(DBFile.id == file_id, DBFile.user_id == current_user.id)
    )
    db_file = result.scalars().first()

    if not db_file:
        await log_audit(db, request, "SHARE_EMAIL", "FAILURE", user_id=current_user.id, resource_id=str(file_id), details="File not found")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    # 2. Generează token de share
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)

    share_link = ShareLink(
        file_id=db_file.id,
        token=token,
        expires_at=expires
    )
    db.add(share_link)
    await db.commit()

    # 3. Construiește URL-ul de download
    download_url = f"{settings.FRONTEND_URL}/shared/{token}"

    # 4. Trimite emailul
    try:
        send_share_email(
            recipient_email=recipient_email,
            sender_email=current_user.email,
            filename=db_file.filename,
            download_url=download_url,
        )
    except Exception as e:
        # Dacă emailul eșuează, ștergem token-ul generat
        await db.delete(share_link)
        await db.commit()
        await log_audit(db, request, "SHARE_EMAIL", "FAILURE", user_id=current_user.id, resource_id=str(file_id), details=f"Email failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send email: {str(e)}"
        )

    await log_audit(db, request, "SHARE_EMAIL", "SUCCESS", user_id=current_user.id, resource_id=str(file_id), details=f"Sent to {recipient_email}")
    return {"detail": f"Secure file sent to {recipient_email}"}

@router.get("/shared/{token}/info")
async def get_shared_info(token: str, db: AsyncSession = Depends(get_db)):
    """
    Verifică validitatea token-ului fără a-l consuma.
    Returnează detalii despre fișier pentru a fi afișate destinatarului.
    """
    result = await db.execute(
        select(ShareLink).where(ShareLink.token == token)
    )
    link = result.scalars().first()
    
    # Verificăm dacă există, dacă e expirat sau dacă a fost deja folosit
    if not link or link.is_used or link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired link")
    
    # Luăm datele fișierului
    file_result = await db.execute(select(DBFile).where(DBFile.id == link.file_id))
    db_file = file_result.scalars().first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File metadata not found")
        
    return {
        "filename": db_file.filename,
        "size": db_file.file_size,
        "requires_pin": link.pin_hash is not None,
        "expires_at": link.expires_at
    }

@router.get("/shared/{token}")
async def download_shared_file(
    request: Request, 
    token: str, 
    db: AsyncSession = Depends(get_db),
    x_share_pin: str | None = Header(None) # Prindem PIN-ul din Header-ul trimis de Frontend
):
    result = await db.execute(select(ShareLink).where(ShareLink.token == token))
    link = result.scalars().first()
    
    if not link or link.is_used or link.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid/Expired token")

    # Verificare PIN (dacă link-ul are PIN setat)
    if link.pin_hash:
        if not x_share_pin or not pwd_context.verify(x_share_pin, link.pin_hash):
            await log_audit(db, request, "DOWNLOAD_SHARED", "FAILURE", details="Incorrect PIN")
            raise HTTPException(status_code=401, detail="Incorrect PIN")

    file_result = await db.execute(select(DBFile).where(DBFile.id == link.file_id))
    db_file = file_result.scalars().first()

    # Citire și decriptare...
    with open(db_file.encrypted_path, "rb") as f:
        encrypted_bytes = f.read()
    decrypted_bytes = decrypt_data(encrypted_bytes)

    # MARCĂM CA FOLOSIT DOAR ACUM (Burn-after-reading)
    link.is_used = True
    await db.commit()

    return Response(
        content=decrypted_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{db_file.filename}"'}
    )
