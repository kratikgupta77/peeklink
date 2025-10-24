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
    latest = r.get("phishtank:latest")
    if not latest:
        return False
    latest = latest.decode() if isinstance(latest, bytes) else latest
    full, host = _canon(u)
    # exact URL or host-only match
    if r.sismember(latest, full): return True
    if r.sismember(latest, host): return True
    return False
