# PeekLink Deployment Files

This directory contains all configuration files needed to deploy PeekLink on a VM server.

## Files Overview

- **`nginx.conf`** - Nginx reverse proxy configuration with rate limiting
- **`gunicorn_config.py`** - Gunicorn WSGI server configuration
- **`gunicorn.service`** - Systemd service for Django backend
- **`fastapi.service`** - Systemd service for FastAPI verdicts
- **`react-dashboard.service`** - Systemd service for React dashboard
- **`deploy.sh`** - Automated deployment script
- **`.env.production`** - Production environment variables template
- **`DEPLOYMENT.md`** - Complete deployment guide
- **`fail2ban.conf`** - Additional DDoS protection with Fail2Ban

## Quick Start

1. **Copy files to server:**
   ```bash
   scp -r deployment/ user@192.168.2.236:/var/www/peeklink/
   ```

2. **Run deployment script:**
   ```bash
   ssh user@192.168.2.236
   cd /var/www/peeklink
   sudo chmod +x deployment/deploy.sh
   sudo ./deployment/deploy.sh
   ```

3. **Configure environment:**
   ```bash
   cd /var/www/peeklink/backend_drf
   sudo cp ../deployment/.env.production .env
   sudo nano .env  # Edit with your values
   ```

4. **Create admin user:**
   ```bash
   source ../venv/bin/activate
   python manage.py createsuperuser
   deactivate
   ```

## Rate Limiting

Nginx rate limiting is configured to prevent DDoS:

- **API**: 10 req/s (burst 20)
- **Auth**: 5 req/s (burst 5)  
- **Verdicts**: 20 req/s (burst 30)
- **General**: 30 req/s (burst 100)
- **Connections**: 20 per IP

## Services

All services run as systemd units:

- `gunicorn` - Django backend (port 8000)
- `fastapi` - Verdicts service (port 9000)
- `nginx` - Reverse proxy (port 80/443)
- `redis-server` - Redis cache

## Monitoring

```bash
# Check all services
sudo systemctl status gunicorn fastapi nginx redis-server

# View logs
sudo journalctl -u gunicorn -f
sudo tail -f /var/log/nginx/peeklink_access.log
```

## Security

- Rate limiting via Nginx
- Fail2Ban for additional protection (optional)
- Firewall configuration (UFW)
- SSL/HTTPS support (Let's Encrypt)

See `DEPLOYMENT.md` for complete instructions.

