
# PeekLink — Secure Link Shortener & Analytics

PeekLink is a full-stack toolchain for creators who need branded short links, pre-click safety previews, and detailed analytics under one login. It includes a Django REST API, a FastAPI verdict microservice, a Vite/React dashboard, and supporting infra.

## Features
- **JWT Auth + Email OTP** – Users sign up with email, receive SMTP OTP verification, and log in via JWT-protected endpoints.
- **Link Management** – Create, list, update, and delete short links with password gates, expirations, and analytics opt-in controls.
- **Security Verdicts** – FastAPI `verdicts/` service scores every URL (heuristics + block rules) and blocks dangerous destinations before redirect.
- **Creator Dashboard** – React app with dedicated pages for Shorten & Preview, Clicks by Day, Verdict Breakdown, Top Referrers, and My Links.
- **Analytics Pipeline** – Click events stored with verdict labels, success flags, referrers, and time series aggregation for charts.
- **Admin & Extensions** – Django admin enabled at `/admin/`; Chrome MV3 extension scaffold provided.

## Repository Layout
- `backend_drf/` – Django API (`/api/links`, `/api/analytics/*`, `/api/auth/*`, `/p/<id>`, `/r/<id>`)
- `verdicts/` – FastAPI scoring service (`/score`)
- `dashboard/` – React + Vite frontend
- `extension_mv3/` – Browser extension template
- `infra/` – Docker Compose + Caddy for multi-service dev/prod
- `tools/` – Utility scripts (e.g., `phishtank_sync.py`)

## Environment Setup
1. **Clone & enter repo**
   ```bash
   git clone https://github.com/kratikgupta77/peeklink.git
   cd peeklink
   ```

2. **Backend env vars** (copy and adjust)
   ```bash
   cp backend_drf/example.env backend_drf/.env
   # edit .env with SMTP creds, SITE_BASE_URL, etc.
   ```

3. **Python dependencies**
   ```bash
   cd backend_drf
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser  # optional admin
   ```

4. **Verdicts service**
   ```bash
   cd ../verdicts
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --host 127.0.0.1 --port 9000 --reload
   ```

5. **Frontend dashboard**
   ```bash
   cd ../dashboard
   npm install
   npm run dev -- --host 127.0.0.1 --port 5173
   ```

6. **Run Django API**
   ```bash
   cd ../backend_drf
   source venv/bin/activate
   export SITE_BASE_URL="http://127.0.0.1:8000"  # or your branded domain
   python manage.py runserver 127.0.0.1:8000
   ```

Optionally, start everything at once with `./run_local.sh` (requires Bash-compatible shell and Node/Python tooling installed).

## Usage Flow
1. Visit `http://127.0.0.1:5173/signup`, create an account, and verify the emailed OTP.
2. Sign in to access the dashboard tabs:
   - **Shorten & Preview** – Create links, copy the branded `/r/<id>` URL, and open the `/p/<id>` sandbox.
   - **Clicks / Verdicts / Referrers** – Visualize analytics pulled from `/api/analytics/*`.
   - **My Links** – Inspect short IDs, click counts, passwords, and analytics status.
3. Use `/p/<id>` for public previews and `/r/<id>` for redirects; blocked links show policy reasons.

## Deployment Notes
- Configure real SMTP credentials via environment vars (`EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS/SSL`).
- Set `SITE_BASE_URL` to your branded domain so APIs return fully qualified short URLs.
- Run `python manage.py collectstatic` before deploying Django behind a real web server.
- The `infra/` folder includes Docker Compose + Caddy examples for multi-service hosting.

Made my Kratik + Manas 