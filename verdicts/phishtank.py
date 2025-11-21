# verdicts/phishtank.py
import os
import redis
from urllib.parse import urlparse

REDIS_URL = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0")
r = redis.from_url(REDIS_URL)

def normalize_url(u: str) -> str:
    # return canonical url forms; we check both full url and host domain
    try:
        p = urlparse(u if "://" in u else "http://" + u)
        host = p.netloc.lower()
        # also return scheme://host/path (no query) and host only
        path = p.path or "/"
        full = f"{p.scheme}://{host}{path}"
        return full
    except Exception:
        return u.lower()

def _canon(u: str):
    p = urlparse(u if "://" in u else "http://" + u)
    host = p.netloc.lower()
    path = p.path or "/"
    full = f"{p.scheme}://{host}{path}"
    return full, host

def is_in_phishtank(u: str) -> bool:
    try:
        # Get the actual set name from the pointer
        set_name_ptr = r.get("phishtank:latest")
        if not set_name_ptr:
            return False
        
        # Decode if bytes
        set_name = set_name_ptr.decode() if isinstance(set_name_ptr, bytes) else set_name_ptr
        
        # Check if the set exists and has data
        count = r.scard(set_name)
        if count == 0:
            return False
        
        full, host = _canon(u)
        # exact URL or host-only match
        if r.sismember(set_name, full): 
            return True
        if r.sismember(set_name, host): 
            return True
        return False
    except Exception as e:
        # If Redis connection fails or any error, return False
        import logging
        logging.warning(f"PhishTank check failed: {e}")
        return False
