#!/usr/bin/env python3
"""
PhishTank sync job.

- Downloads a PhishTank feed (CSV or JSON; set PHISHTANK_FEED to point to the file).
- Stores discovered phishing URLs into a Redis SET keyed by timestamp: phishtank:YYYYMMDDHH
- Maintains a pointer phishtank:latest -> current set key.
- Also maintains a simple Redis HASH for quick metadata counts:
    phishtank:meta -> {"last_sync":"...", "count": N}
- Keeps older sets for a configurable retention period (default 48 hours).
- Use cron or systemd timer to run hourly, or run as a background worker.
"""
import os
import csv
import io
import json
import time
import logging
import datetime
from urllib.request import urlopen, Request
import redis

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

PT_FEED = os.environ.get(
    "PHISHTANK_FEED",
    "https://data.phishtank.com/data/online-valid.csv"
)
REDIS_URL = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0")
RETENTION_HOURS = int(os.environ.get("PHISHTANK_RETENTION_HOURS", "48"))
HTTP_TIMEOUT = float(os.environ.get("PHISHTANK_HTTP_TIMEOUT", "30"))

r = redis.from_url(REDIS_URL)


def _download(url):
    headers = {"User-Agent": "PeekLink-PhishSync/1.0 (+https://example.com)"}
    req = Request(url, headers=headers)
    with urlopen(req, timeout=HTTP_TIMEOUT) as resp:
        content = resp.read()
    # Try to auto-detect JSON or CSV by first non-whitespace char
    s = content.lstrip()
    if not s:
        return None, None
    if s[:1] in (b"{", b"["):
        return "json", content.decode("utf-8", errors="ignore")
    return "csv", content.decode("utf-8", errors="ignore")


def _parse_csv(text):
    # PhishTank CSV typically has a header; try to find url column name
    reader = csv.DictReader(io.StringIO(text))
    urls = []
    for row in reader:
        # common column names are 'url' or 'phish_url'
        u = row.get("url") or row.get("phish_url") or row.get("phishurl") or row.get("urlinet")
        if not u:
            # take the first column fallback
            try:
                u = next(iter(row.values()))
            except StopIteration:
                u = None
        if u:
            urls.append(u.strip())
    return urls


def _parse_json(text):
    data = json.loads(text)
    urls = []
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                u = item.get("url") or item.get("phish_url") or item.get("url")
                if u:
                    urls.append(u.strip())
    elif isinstance(data, dict):
        # maybe keys -> list
        for v in data.values():
            if isinstance(v, list):
                for item in v:
                    if isinstance(item, dict):
                        u = item.get("url")
                        if u:
                            urls.append(u.strip())
    return urls


def rotate_cleanup(now_tag):
    # Keep only recent N sets (RETENTION_HOURS). Remove older keys.
    prefix = "phishtank:"
    keep = set()
    for h in range(0, RETENTION_HOURS):
        t = (datetime.datetime.utcnow() - datetime.timedelta(hours=h)).strftime("%Y%m%d%H")
        keep.add(f"{prefix}{t}")
    # list keys and delete those not in keep (but keep meta / latest)
    all_keys = r.keys(f"{prefix}*")
    for key in all_keys:
        k = key.decode() if isinstance(key, bytes) else key
        if k not in keep and not k.endswith(":meta") and k != "phishtank:latest":
            logging.info("Removing old phishtank key: %s", k)
            r.delete(k)


def run():
    logging.info("Starting PhishTank sync from %s", PT_FEED)
    try:
        fmt, text = _download(PT_FEED)
        if not text:
            logging.error("No content downloaded from feed")
            return
        if fmt == "json":
            urls = _parse_json(text)
        else:
            urls = _parse_csv(text)
    except Exception as e:
        logging.exception("Failed to download/parse feed: %s", e)
        # On failure, keep previous set intact; update meta with error time
        r.hset("phishtank:meta", mapping={"last_sync": datetime.datetime.utcnow().isoformat(), "error": str(e)})
        return

    now_tag = datetime.datetime.utcnow().strftime("%Y%m%d%H")
    setkey = f"phishtank:{now_tag}"

    # store urls in Redis set; use pipeline for performance
    pipe = r.pipeline()
    if urls:
        # Use SADD (set) to avoid duplicates
        for u in urls:
            pipe.sadd(setkey, u)
        # Optionally set TTL on the per-hour set (keep for retention + buffer)
        pipe.expire(setkey, int((RETENTION_HOURS + 2) * 3600))
        pipe.execute()
    else:
        # If empty, create an empty key with small TTL to mark sync
        r.sadd(setkey, "__empty__")
        r.expire(setkey, int((RETENTION_HOURS + 2) * 3600))

    r.set("phishtank:latest", setkey)
    # update meta
    r.hset("phishtank:meta", mapping={
        "last_sync": datetime.datetime.utcnow().isoformat(),
        "count": r.scard(setkey)
    })
    # cleanup old keys
    rotate_cleanup(now_tag)

    logging.info("PhishTank sync complete. stored %d urls in %s", r.scard(setkey), setkey)


if __name__ == "__main__":
    run()
