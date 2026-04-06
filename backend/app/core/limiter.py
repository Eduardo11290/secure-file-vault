from slowapi import Limiter
from slowapi.util import get_remote_address
import os

# Connect to Redis using the hostname 'redis' (or localhost if running outside docker directly)
# Fallback to localhost if REDIS_URL not set
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

limiter = Limiter(key_func=get_remote_address, storage_uri=REDIS_URL)
