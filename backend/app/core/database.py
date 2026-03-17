from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Create async database engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True, # Prints SQL queries to the terminal (useful for debugging)
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base class for all database models
Base = declarative_base()

# Dependency injection for database sessions
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session