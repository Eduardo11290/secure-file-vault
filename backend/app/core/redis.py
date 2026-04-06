import redis.asyncio as redis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Decode responses so we get strings naturally backing our blacklist routines
redis_client = redis.from_url(REDIS_URL, decode_responses=True)
