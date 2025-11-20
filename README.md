
# PeekLink — Secure Link Shortener & Analytics

PeekLink is a full-stack toolchain for creators who need branded short links, pre-click safety previews, and detailed analytics under one login. It includes a Django REST API, a FastAPI verdict microservice, a Vite/React dashboard, and supporting infra.

## Features
- **JWT Auth + Email OTP** – Users sign up with email, receive SMTP OTP verification, and log in via JWT-protected endpoints.
- **Link Management** – Create, list, update, and delete short links with password gates, expirations, and analytics opt-in controls.
- **Security Verdicts** – FastAPI `verdicts/` service scores every URL (heuristics + block rules) and blocks dangerous destinations before redirect.
- **Creator Dashboard** – React app with dedicated pages for Shorten & Preview, Clicks by Day, Verdict Breakdown, Top Referrers, and My Links.
- **Analytics Pipeline** – Click events stored with verdict labels, success flags, referrers, and time series aggregation for charts.
- **Chrome Extension (MV3)** – Full-featured React-based browser extension with authentication, link shortening, preview, and seamless dashboard integration.
- **Admin Panel** – Django admin enabled at `/admin/` for user and link management.

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

7. **Build Chrome Extension** (optional)
   ```bash
   cd ../extension_mv3
   npm install
   npm run build
   ```
   Then load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension_mv3` directory

Optionally, start everything at once with `./run_local.sh` (requires Bash-compatible shell and Node/Python tooling installed).

## Usage Flow

### Web Dashboard
1. Visit `http://127.0.0.1:5173/signup`, create an account, and verify the emailed OTP.
2. Sign in to access the dashboard tabs:
   - **Shorten & Preview** – Create links, copy the branded `/p/<id>` URL, and open the preview sandbox.
   - **Clicks / Verdicts / Referrers** – Visualize analytics pulled from `/api/analytics/*`.
   - **My Links** – Inspect short IDs, click counts, passwords, expiry status, and analytics.
3. Use `/p/<id>` for public previews and `/r/<id>` for redirects; blocked links show policy reasons.

### Chrome Extension
The PeekLink extension provides a convenient way to shorten links directly from your browser:

**Setup:**
1. Build the extension: `cd extension_mv3 && npm install && npm run build`
2. Load it in Chrome via `chrome://extensions/` (Developer mode → Load unpacked → select `extension_mv3` folder)
3. Configure API and Dashboard URLs in the extension options page (right-click extension icon → Options)

**Features:**
- **Authentication Required** – Login page appears when extension is first opened; tokens are stored in `chrome.storage.sync` for persistence across sessions
- **Shorten Tab** – Create short links with:
  - Destination URL input
  - Domain name selector
  - Expiration options (None, Time-based, Click-based)
  - Password protection
  - Success message with copy button
- **Preview Tab** – Check URL safety before shortening:
  - Enter any URL to preview
  - Get real-time security verdict (Safe/Warning/Blocked)
  - View details: Final Destination, Redirects, Response Time, Status Code
- **Bottom Navigation**:
  - **Analytics** (Shorten tab only) – Opens dashboard with automatic login via token
  - **Settings** – Opens extension options page
  - **Logout** – Clears authentication and returns to login

**Workflow:**
1. Click the extension icon → Login page appears if not authenticated
2. Enter credentials → Token stored, main interface loads
3. Use **Shorten** tab to create links with expiry/password options
4. Use **Preview** tab to check URL safety before shortening
5. Click **Analytics** to open dashboard (automatically logged in)
6. All created links sync with your dashboard account

## Extension Architecture

The Chrome extension is built with React and Vite, matching the dashboard's UI/UX:

- **React Components** – `ShortenForm`, `PreviewTab`, `LoginPage` mirror dashboard functionality
- **Authentication** – Uses `chrome.storage.sync` for token persistence; tokens sync across devices when Chrome sync is enabled
- **API Integration** – Communicates with Django backend (`/api/links`, `/api/auth/token`) and FastAPI verdict service (`/score`)
- **Seamless Dashboard Access** – Clicking "Analytics" passes the token via URL parameter, automatically logging you into the dashboard
- **Context Menu** – Right-click any link on a webpage to shorten it (service worker handles this)

## Deployment

### Production Deployment on VM Server

Complete deployment guide for hosting on a VM server (e.g., `192.168.2.236`) with Nginx, Gunicorn, and rate limiting:

📖 **See [deployment/DEPLOYMENT.md](./deployment/DEPLOYMENT.md) for complete instructions.**

**Quick Deploy:**
```bash
# On your VM server
cd /var/www/peeklink
sudo chmod +x deployment/deploy.sh
sudo ./deployment/deploy.sh
```

**Key Features:**
- ✅ Gunicorn WSGI server for Django
- ✅ Nginx reverse proxy with rate limiting
- ✅ Systemd services for all components
- ✅ DDoS protection via rate limiting
- ✅ Optional Fail2Ban integration
- ✅ SSL/HTTPS support (Let's Encrypt)

**Rate Limiting:**
- API endpoints: 10 req/s (burst: 20)
- Auth endpoints: 5 req/s (burst: 5)
- Verdict service: 20 req/s (burst: 30)
- Connection limit: 20 per IP

### Configuration Notes
- Configure real SMTP credentials via environment vars (`EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS/SSL`).
- Set `SITE_BASE_URL` to your server IP/domain so APIs return fully qualified short URLs.
- Update `ALLOWED_HOSTS` in Django settings for your domain/IP.
- Run `python manage.py collectstatic` before deploying Django behind Nginx.
- The `infra/` folder includes Docker Compose + Caddy examples for multi-service hosting.
- For extension distribution, build with `npm run build` and package the `extension_mv3` folder (including `dist/`, `manifest.json`, `icons/`, etc.) for Chrome Web Store submission.

Made by Kratik + Manas 