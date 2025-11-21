from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
import math
import urllib.parse
import re
from phishtank import is_in_phishtank

app = FastAPI(title="PeekLink Verdicts")
URL_SAFE_RE = re.compile(
    r"^https?:\/\/[A-Za-z0-9\-._~:\/?#\[\]@!$&()*+,;=%]+$"
)

class Item(BaseModel):
    url: str

class ScoreIn(BaseModel):
    items: List[Item]

def simple_features(u: str) -> Dict[str, float]:
    parsed = urllib.parse.urlparse(u)
    host = parsed.netloc.lower()
    return {
        "len": len(u),
        "digits": sum(ch.isdigit() for ch in u),
        "specials": sum(ch in "-_.%&=+?/" for ch in u),
        "entropy": len(set(u)) / (len(u) or 1),
        "has_ip": any(part.isdigit() and len(part)<=3 for part in u.split(".")) and "http" in u,
        "host": host,
        "path": parsed.path.lower(),
    }

def simple_rule(u: str):
    url = u.strip()

    # immediate block if PhishTank lists the URL/host
    try:
        if is_in_phishtank(url):
            return "blocked", 0.99, ["phishtank_listed"]
    except Exception:
        # If PhishTank check fails, continue with other checks
        pass

    if url != u or not URL_SAFE_RE.match(url):
        return "blocked", 0.99, ["invalid_url_syntax"]

    f = simple_features(url)
    host = f.get("host", "")
    path = f.get("path", "")
    score = 0.0
    reasons = []
    
    # URL length scoring (longer URLs are more suspicious)
    if f["len"] > 100:
        score += 0.3
        reasons.append("very_long_url")
    elif f["len"] > 60:
        score += 0.15
        reasons.append("long_url")
    
    # Special characters (more = more suspicious)
    if f["specials"] > 10:
        score += 0.3
        reasons.append("many_special_chars")
    elif f["specials"] > 6:
        score += 0.15
        reasons.append("many_special_chars")
    
    # IP addresses in URL (very suspicious)
    if f["has_ip"]:
        score += 0.4
        reasons.append("ip_in_url")
    
    # Suspicious patterns
    lowered = url.lower()
    suspicious_patterns = [
        ("bit.ly", 0.1), ("tinyurl", 0.1), ("t.co", 0.1),  # URL shorteners
        ("free", 0.05), ("click", 0.05), ("verify", 0.05),  # Common phishing words
        ("account", 0.05), ("secure", 0.05), ("update", 0.05),
        ("suspicious", 0.1), ("urgent", 0.1), ("warning", 0.1),
    ]
    for pattern, weight in suspicious_patterns:
        if pattern in lowered:
            score += weight
            if pattern not in [r for r in reasons]:
                reasons.append(f"suspicious_keyword_{pattern}")

    # Suspicious TLDs
    suspicious_tlds = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top"]
    if any(tld in host for tld in suspicious_tlds):
        score += 0.2
        reasons.append("suspicious_tld")
    
    # High digit ratio (suspicious)
    if f["digits"] > 10:
        score += 0.15
        reasons.append("many_digits")
    
    # TEMP: custom demo blocking rule
    if "blockme" in lowered or "phish-test" in lowered or "malicious" in lowered:
        return "blocked", 0.99, reasons + ["manual_block_marker"]

    # Normalize score to 0-1 range
    score = min(1.0, score)
    
    # More aggressive scoring - direct threshold-based approach for better detection
    if score >= 0.7:
        label = "blocked"
        normalized_score = 0.9 + min(0.1, (score - 0.7) * 0.33)  # 0.9 to 1.0
    elif score >= 0.4:
        label = "warning"
        normalized_score = 0.5 + (score - 0.4) * 1.33  # 0.5 to 0.9
    else:
        label = "safe"
        normalized_score = score * 1.25  # 0.0 to 0.5
    
    return label, float(normalized_score), reasons

@app.post("/score")
def score(inp: ScoreIn):
    out = []
    for it in inp.items:
        label, p, reasons = simple_rule(it.url)
        out.append({"url": it.url, "label": label, "p": p, "reasons": reasons})
    return {"results": out}
