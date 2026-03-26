import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings

def get_password_hash(password: str) -> str:
    """Hashes a plain text password using bcrypt."""
    # bcrypt necesită format 'bytes', deci encodăm string-ul
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    
    # Returnăm ca string pentru a-l putea salva în PostgreSQL
    return hashed_bytes.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored hash."""
    password_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    
    return bcrypt.checkpw(password_bytes, hash_bytes)

ALGORITHM = "HS256"

def create_access_token(data: dict) -> str:
    """Generates a JWT token valid for a specific timeframe."""
    to_encode = data.copy()
    
    # Calculăm când expiră tokenul
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Generăm tokenul folosind cheia secretă din .env
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt