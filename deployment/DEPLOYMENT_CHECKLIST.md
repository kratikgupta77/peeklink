# PeekLink Deployment Checklist

## Pre-Deployment

- [ ] Server IP: `192.168.2.236` is accessible
- [ ] SSH access configured
- [ ] Root/sudo access available
- [ ] Domain name configured (optional, for SSL)

## Step 1: Initial Server Setup

- [ ] Update system packages
- [ ] Install required packages (Python, Node.js, Nginx, Redis)
- [ ] Configure firewall (UFW)
- [ ] Create project directory `/var/www/peeklink`

## Step 2: Application Setup

- [ ] Clone repository to server
- [ ] Create Python virtual environment
- [ ] Install Python dependencies (Django, FastAPI, Gunicorn)
- [ ] Install Node.js dependencies
- [ ] Build React dashboard
- [ ] Run Django migrations
- [ ] Collect static files
- [ ] Create superuser account

## Step 3: Configuration

- [ ] Copy `.env.production` to `backend_drf/.env`
- [ ] Update `.env` with:
  - [ ] SECRET_KEY (generate new one)
  - [ ] SITE_BASE_URL=http://192.168.2.236
  - [ ] ALLOWED_HOSTS=192.168.2.236
  - [ ] Email SMTP credentials
  - [ ] Database settings
- [ ] Update `vite.config.js` with production API base
- [ ] Update extension configuration files with VM IP

## Step 4: Service Configuration

- [ ] Copy `gunicorn.service` to `/etc/systemd/system/`
- [ ] Copy `fastapi.service` to `/etc/systemd/system/`
- [ ] Copy `react-dashboard.service` to `/etc/systemd/system/`
- [ ] Copy `nginx.conf` to `/etc/nginx/sites-available/peeklink`
- [ ] Create symlink in `/etc/nginx/sites-enabled/`
- [ ] Create required directories:
  - [ ] `/var/log/gunicorn`
  - [ ] `/var/log/peeklink`
  - [ ] `/var/run/gunicorn`
  - [ ] `/var/www/peeklink/static`
  - [ ] `/var/www/peeklink/media`

## Step 5: Permissions

- [ ] Set ownership: `chown -R www-data:www-data /var/www/peeklink`
- [ ] Set ownership for log directories
- [ ] Set ownership for static/media directories

## Step 6: Start Services

- [ ] Enable services: `systemctl enable gunicorn fastapi nginx redis`
- [ ] Start services: `systemctl start gunicorn fastapi nginx redis`
- [ ] Check status: `systemctl status gunicorn fastapi nginx redis`
- [ ] Test Nginx config: `nginx -t`

## Step 7: Rate Limiting & Security

- [ ] Verify Nginx rate limiting is active
- [ ] Test rate limits (optional: use `ab` or `wrk`)
- [ ] Configure Fail2Ban (optional but recommended)
- [ ] Setup SSL/HTTPS with Let's Encrypt (recommended)
- [ ] Update Django settings for HTTPS (if using SSL)

## Step 8: Testing

- [ ] Test dashboard: `http://192.168.2.236`
- [ ] Test API: `http://192.168.2.236/api/`
- [ ] Test admin: `http://192.168.2.236/admin/`
- [ ] Test preview: `http://192.168.2.236/p/{id}`
- [ ] Test redirect: `http://192.168.2.236/r/{id}`
- [ ] Test verdict service: `http://192.168.2.236/score`
- [ ] Test rate limiting (make multiple rapid requests)
- [ ] Test authentication flow
- [ ] Test link creation
- [ ] Test extension connection

## Step 9: Monitoring

- [ ] Setup log monitoring
- [ ] Check service logs: `journalctl -u gunicorn -f`
- [ ] Check Nginx logs: `tail -f /var/log/nginx/peeklink_access.log`
- [ ] Monitor system resources: `htop` or `top`
- [ ] Setup backup strategy

## Step 10: Post-Deployment

- [ ] Update extension configuration files with VM IP
- [ ] Update Electron app configuration with VM IP
- [ ] Document access URLs for users
- [ ] Create backup of database
- [ ] Document recovery procedures

## Configuration Changes Needed

### Backend (Django)

Update `backend_drf/peeklink/settings.py` or `.env`:
```python
ALLOWED_HOSTS = ["192.168.2.236", "localhost", "127.0.0.1"]
SITE_BASE_URL = "http://192.168.2.236"
DEBUG = False
```

### Frontend (React Dashboard)

Update `dashboard/vite.config.js`:
```javascript
proxy: {
  "/api": { target: "http://192.168.2.236:8000", changeOrigin: true },
  "/p": { target: "http://192.168.2.236:8000", changeOrigin: true },
  "/r": { target: "http://192.168.2.236:8000", changeOrigin: true },
  "/score": { target: "http://192.168.2.236:9000", changeOrigin: true },
}
```

Or set environment variable:
```bash
export VITE_API_BASE=http://192.168.2.236
```

### Extension

Update `extension_mv3/options.html` default values:
- API Base: `http://192.168.2.236:8000`
- Dashboard Base: `http://192.168.2.236:5173` (or just `http://192.168.2.236`)

### Electron App

Update `electron-app/react-ui/src/components/ShortenForm.jsx`:
```javascript
const [apiBase, setApiBase] = useState(() => {
  return localStorage.getItem("apiBase") || "http://192.168.2.236:8000";
});
```

## Rate Limiting Summary

| Endpoint | Rate Limit | Burst | Notes |
|----------|-----------|-------|-------|
| `/api/` | 10 req/s | 20 | General API endpoints |
| `/api/auth/` | 5 req/s | 5 | Stricter for auth |
| `/score` | 20 req/s | 30 | Verdict service |
| `/p/`, `/r/` | 30 req/s | 50 | Public link endpoints |
| `/` (Dashboard) | 30 req/s | 100 | Frontend |
| Connections | 20/IP | - | Max concurrent connections |

## Quick Commands Reference

```bash
# Service management
sudo systemctl status gunicorn fastapi nginx
sudo systemctl restart gunicorn fastapi nginx
sudo systemctl stop gunicorn fastapi nginx

# View logs
sudo journalctl -u gunicorn -f
sudo tail -f /var/log/nginx/peeklink_access.log
sudo tail -f /var/log/nginx/peeklink_error.log

# Test Nginx
sudo nginx -t
sudo systemctl reload nginx

# Django management
cd /var/www/peeklink/backend_drf
source ../venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser

# Update code
cd /var/www/peeklink
sudo -u www-data git pull
# Then restart services
```

