from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Verify2FA, Login2FA
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.limiter import limiter
from app.core.audit import log_audit
from app.api.deps import oauth2_scheme, get_current_user
from app.core.redis import redis_client
from app.core.config import settings
from jose import jwt
from datetime import datetime, timezone
import pyotp
import qrcode
import base64
import io

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register_user(request: Request, user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new user in the database."""
    
    # Check if the email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        await log_audit(db, request, "REGISTER", "FAILURE", details="Email already registered")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )

    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(email=user_data.email, password_hash=hashed_password)
    
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user) # Get the generated UUID and timestamp from DB
    
    await log_audit(db, request, "REGISTER", "SUCCESS", user_id=new_user.id)
    
    return new_user

@router.post("/login")
@limiter.limit("5/minute")
async def login_user(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Authenticates a user and returns a JWT token."""
    
    # 1. Căutăm userul în DB după email (FastAPI folosește câmpul 'username' din form pentru email)
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalars().first()
    
    # 2. Dacă userul nu există sau parola e greșită (Returnăm mereu aceeași eroare din motive de securitate)
    if not user or not verify_password(form_data.password, user.password_hash):
        if user:
            await log_audit(db, request, "LOGIN", "FAILURE", user_id=user.id, details="Incorrect password")
        else:
            await log_audit(db, request, "LOGIN", "FAILURE", details=f"Unknown email: {form_data.username}")
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Generăm token-ul JWT (punem ID-ul userului în el)
    access_token = create_access_token(data={"sub": str(user.id)})
    
    if user.totp_enabled:
        await log_audit(db, request, "LOGIN_PARTIAL", "SUCCESS", user_id=user.id, details="2FA required")
        temp_token = create_access_token(data={"sub": str(user.id), "type": "temp_2fa"})
        return {"access_token": temp_token, "token_type": "bearer", "2fa_required": True}
        
    # 4. Returnăm token-ul în formatul cerut de standardul OAuth2
    await log_audit(db, request, "LOGIN", "SUCCESS", user_id=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(
    request: Request,
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        exp = payload.get("exp")
        if exp:
            now = datetime.now(timezone.utc).timestamp()
            ttl = int(exp - now)
            if ttl > 0:
                await redis_client.set(f"blacklist:{token}", "true", ex=ttl)
    except Exception:
        pass # Let it fail silently if decode fails
        
    await log_audit(db, request, "LOGOUT", "SUCCESS", user_id=current_user.id)
    return {"detail": "Logged out successfully"}

@router.post("/2fa/enable")
async def enable_2fa(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")
        
    # Generate new secret
    secret = pyotp.random_base32()
    current_user.totp_secret = secret
    await db.commit()
    
    # Generate QR Code
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=current_user.email, issuer_name="SecureVault")
    
    img = qrcode.make(provisioning_uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    base64_img = base64.b64encode(buf.getvalue()).decode("utf-8")
    
    await log_audit(db, request, "2FA_ENABLE_START", "SUCCESS", user_id=current_user.id)
    return {"secret": secret, "qr_code": f"data:image/png;base64,{base64_img}"}

@router.post("/2fa/verify")
async def verify_2fa(
    request: Request,
    payload: Verify2FA,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is already fully enabled")
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA enable process not started")
        
    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(payload.code):
        await log_audit(db, request, "2FA_VERIFY", "FAILURE", user_id=current_user.id)
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
    current_user.totp_enabled = True
    await db.commit()
    
    await log_audit(db, request, "2FA_ENABLE_COMPLETE", "SUCCESS", user_id=current_user.id)
    return {"detail": "2FA successfully enabled"}

@router.post("/login/2fa")
@limiter.limit("5/minute")
async def login_2fa(
    request: Request,
    payload: Login2FA,
    db: AsyncSession = Depends(get_db)
):
    try:
        token_payload = jwt.decode(payload.temp_token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = token_payload.get("sub")
        token_type = token_payload.get("type")
        if token_type != "temp_2fa" or not user_id:
            raise HTTPException(status_code=401, detail="Invalid temporary token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired temporary token")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA not enabled for this user")
        
    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(payload.code):
        await log_audit(db, request, "LOGIN_2FA", "FAILURE", user_id=user.id)
        raise HTTPException(status_code=401, detail="Invalid 2FA code")
        
    access_token = create_access_token(data={"sub": str(user.id)})
    
    exp = token_payload.get("exp")
    if exp:
        now = datetime.now(timezone.utc).timestamp()
        ttl = int(exp - now)
        if ttl > 0:
            await redis_client.set(f"blacklist:{payload.temp_token}", "true", ex=ttl)
            
    await log_audit(db, request, "LOGIN_2FA", "SUCCESS", user_id=user.id)
    return {"access_token": access_token, "token_type": "bearer"}