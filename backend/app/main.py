from fastapi import FastAPI
import logging
from contextlib import asynccontextmanager

from app.core.database import engine, Base
from app.models.user import User
from app.models.file import File
from app.api import auth, users

# Set up structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("vault_api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run at startup: Create database tables if they don't exist
    logger.info("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully.")
    
    yield
    # Run at shutdown: Clean up resources
    await engine.dispose()
    logger.info("Database connection closed.")

app = FastAPI(
    title="Secure Document Vault API",
    description="API for AES-256 encrypted file sharing and MFA authentication",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])

@app.get("/health", tags=["System"])
async def health_check():
    """Endpoint used to verify server status."""
    logger.info("Health check endpoint accessed.")
    return {
        "status": "healthy", 
        "service": "Secure Vault API",
        "message": "All systems operational."
    }