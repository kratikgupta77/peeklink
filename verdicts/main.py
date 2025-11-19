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
    if is_in_phishtank(url):
        return "blocked", 0.99, ["phishtank_listed"]

    if url != u or not URL_SAFE_RE.match(url):
        return "blocked", 0.99, ["invalid_url_syntax"]

    f = simple_features(url)
    host = f.get("host", "")
    path = f.get("path", "")
    score = 0.0
    score += 0.002 * f["len"]
    score += 0.02 * f["specials"]
    if f["has_ip"]:
        score += 0.5

    # Logistic-style squashing
    score = 1 / (1 + math.exp(- (score - 2.5)))  # 0..1
    reasons = []
    if f["len"] > 60: reasons.append("long_url")
    if f["specials"] > 6: reasons.append("many_special_chars")
    if f["has_ip"]: reasons.append("ip_in_url")

    # TEMP: custom demo blocking rule
    lowered = url.lower()
    if "blockme" in lowered or "phish-test" in lowered:
        return "blocked", 0.99, reasons + ["manual_block_marker"]

    # Normal logic
    label = "warning" if score > 0.6 else "safe"
    return label, float(score), reasons

@app.post("/score")
def score(inp: ScoreIn):
    out = []
    for it in inp.items:
        label, p, reasons = simple_rule(it.url)
        out.append({"url": it.url, "label": label, "p": p, "reasons": reasons})
    return {"results": out}
