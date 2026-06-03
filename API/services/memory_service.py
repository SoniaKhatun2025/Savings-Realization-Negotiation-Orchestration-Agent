import os
import json
import logging
import datetime
from database.connection import get_db_connection
from database.queries import SAVE_CHAT_MESSAGE, GET_CHAT_HISTORY

logger = logging.getLogger(__name__)

# Redis config
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")
REDIS_TTL = int(os.getenv("REDIS_TTL", 86400))

_redis_client = None

def get_redis_client():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
        
    try:
        # pyrefly: ignore [missing-import]
        import redis
        client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            password=REDIS_PASSWORD if REDIS_PASSWORD else None,
            socket_timeout=3,  # Fast timeout for fallback
            decode_responses=True
        )
        # Test connection
        client.ping()
        logger.info(f"Successfully connected to Redis memory store at {REDIS_HOST}:{REDIS_PORT}")
        _redis_client = client
        return _redis_client
    except Exception as e:
        logger.warning(f"Redis memory store connection failed: {e}. Falling back to direct database memory storage.")
        return None

# Custom JSON encoder to handle datetime serialization
class MemoryJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        return super().default(obj)

def save_message(user_id: int, message: str, sender: str):
    """
    Saves a chat message to MySQL (permanent transaction log) and invalidates Redis cache.
    """
    # 1. Save to MySQL
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(SAVE_CHAT_MESSAGE, (user_id, message, sender))
    conn.close()
    
    # 2. Invalidate Redis Cache
    redis_client = get_redis_client()
    if redis_client is not None:
        try:
            cache_key = f"chat_history:{user_id}"
            redis_client.delete(cache_key)
            logger.info(f"Invalidated Redis chat cache for user {user_id}.")
        except Exception as e:
            logger.error(f"Failed to update Redis memory cache: {e}")

def get_chat_history(user_id: int):
    """
    Retrieves the chat history for a specific user.
    Uses Redis as cache (short-term episodic memory) and MySQL as permanent store.
    """
    redis_client = get_redis_client()
    cache_key = f"chat_history:{user_id}"
    
    # 1. Try reading from Redis
    if redis_client is not None:
        try:
            cached_data = redis_client.get(cache_key)
            if cached_data:
                logger.info(f"Retrieved chat history from Redis memory cache for user {user_id}.")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Failed to read from Redis memory cache: {e}")
            
    # 2. Fallback to MySQL
    logger.info(f"Fetching chat history from MySQL for user {user_id}.")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(GET_CHAT_HISTORY, (user_id,))
    results = cursor.fetchall()
    conn.close()
    
    # 3. Write back to Redis cache
    if redis_client is not None and results:
        try:
            serialized = json.dumps(results, cls=MemoryJSONEncoder)
            redis_client.setex(cache_key, REDIS_TTL, serialized)
            logger.info(f"Cached chat history to Redis memory store for user {user_id}.")
        except Exception as e:
            logger.warning(f"Failed to write to Redis memory cache: {e}")
            
    return results

def clear_chat_history(user_id: int):
    """
    Clears the chat history for a specific user from MySQL and Redis.
    """
    # 1. Clear MySQL
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_history WHERE user_id = %s", (user_id,))
    conn.close()
    
    # 2. Invalidate Redis Cache
    redis_client = get_redis_client()
    if redis_client is not None:
        try:
            cache_key = f"chat_history:{user_id}"
            redis_client.delete(cache_key)
            logger.info(f"Cleared Redis chat cache for user {user_id}.")
        except Exception as e:
            logger.error(f"Failed to clear Redis memory cache: {e}")
