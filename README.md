
# PeekLink — Starter Scaffold

This zip contains:
- `backend_drf/` — Django DRF with `/api/links`, `/api/links/:id/preview`
- `verdicts/` — FastAPI service with `/score`
- `tools/phishtank_sync.py` — hourly sync skeleton to Redis
- `extension_mv3/` — Chrome/Edge MV3 extension (popup + context menu)
- `dashboard/` — React (Vite) app with dummy charts and transparency text
- `infra/` — Docker Compose + Caddyfile for `api/app/s/model` subdomains
- `installer/` — NSIS installer script template

## Quick start (dev)
- Bring up infra: `cd infra && docker compose up --build`
- API: `http://api.example.com/api/links` (inside compose, use hosts overrides for local)
- Verdicts: `http://model.example.com/score`
- Dashboard: `http://app.example.com`

## Notes
- Replace `example.com` with your domain in `Caddyfile`, extension `popup.js`, and options page.
- Harden security and add real preview gate + password/expiry checks before production.
