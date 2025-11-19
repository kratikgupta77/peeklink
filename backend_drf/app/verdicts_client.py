import os, requests
MODEL_URL = os.environ.get("VERDICTS_URL", "http://127.0.0.1:9000/score")
def score_url(u: str, timeout=0.15):
    try:
        r = requests.post(MODEL_URL, json={"items":[{"url": u}]}, timeout=timeout)
        r.raise_for_status()
        return r.json()["results"][0]  # {url,label,p,reasons}
    except Exception:
        return {"url": u, "label": "safe", "p": 0.0, "reasons": ["model_unavailable"]}
