# PeekLink Deployment Guide

Complete guide for deploying PeekLink on VM server (192.168.2.236) with Nginx, Gunicorn, and rate limiting.

## Prerequisites

- Ubuntu 20.04+ or Debian 11+ server
- Root or sudo access
- Domain name (optional, for SSL)
- SSH access to the server

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install basic tools
sudo apt-get install -y git curl wget
```

### 2. Clone Repository

```bash
# Clone your repository
cd /var/www
sudo git clone https://github.com/yourusername/peeklink.git
sudo chown -R www-data:www-data /var/www/peeklink
```

### 3. Run Deployment Script

```bash
cd /var/www/peeklink
sudo chmod +x deployment/deploy.sh
sudo ./deployment/deploy.sh
```

## Manual Setup (Alternative)

If you prefer manual setup:

### Step 1: Install Dependencies

```bash
sudo apt-get install -y \
    python3 python3-pip python3-venv \
    nginx redis-server \
    nodejs npm \
    git sqlite3
```

### Step 2: Setup Python Environment

```bash
cd /var/www/peeklink
python3 -m venv venv
source venv/bin/activate

# Install backend dependencies
cd backend_drf
pip install -r requirements.txt
pip install gunicorn

# Install FastAPI dependencies
cd ../verdicts
pip install -r requirements.txt

deactivate
```

### Step 3: Configure Django

```bash
cd /var/www/peeklink/backend_drf

# Copy production environment file
cp ../deployment/.env.production .env

# Edit .env with your settings
nano .env

# Run migrations
source ../venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
deactivate
```

### Step 4: Configure FastAPI

```bash
cd /var/www/peeklink/verdicts

# Ensure Redis is running
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Step 5: Build React Dashboard

```bash
cd /var/www/peeklink/dashboard
npm install
npm run build

# For production, you can serve built files with Nginx
# Or run Vite preview server
```

### Step 6: Setup Gunicorn

```bash
# Copy service file
sudo cp deployment/gunicorn.service /etc/systemd/system/

# Edit if needed
sudo nano /etc/systemd/system/gunicorn.service

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl start gunicorn
sudo systemctl status gunicorn
```

### Step 7: Setup FastAPI Service

```bash
# Copy service file
sudo cp deployment/fastapi.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable fastapi
sudo systemctl start fastapi
sudo systemctl status fastapi
```

### Step 8: Configure Nginx

```bash
# Copy Nginx config
sudo cp deployment/nginx.conf /etc/nginx/sites-available/peeklink

# Create symlink
sudo ln -s /etc/nginx/sites-available/peeklink /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 9: Create Required Directories

```bash
sudo mkdir -p /var/log/gunicorn
sudo mkdir -p /var/log/peeklink
sudo mkdir -p /var/run/gunicorn
sudo mkdir -p /var/www/peeklink/static
sudo mkdir -p /var/www/peeklink/media

sudo chown -R www-data:www-data /var/log/gunicorn
sudo chown -R www-data:www-data /var/log/peeklink
sudo chown -R www-data:www-data /var/run/gunicorn
sudo chown -R www-data:www-data /var/www/peeklink
```

## Rate Limiting Configuration

Nginx rate limiting is configured in `nginx.conf`:

- **API endpoints**: 10 requests/second (burst: 20)
- **Auth endpoints**: 5 requests/second (burst: 5)
- **Verdict service**: 20 requests/second (burst: 30)
- **General**: 30 requests/second (burst: 100)
- **Connection limit**: 20 connections per IP

### Adjusting Rate Limits

Edit `/etc/nginx/sites-available/peeklink`:

```nginx
# Increase API rate limit
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;

# In location block
limit_req zone=api_limit burst=40 nodelay;
```

Then reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS Setup (Optional but Recommended)

### Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
```

### Update Settings for HTTPS

After SSL setup, update Django settings:

```bash
nano /var/www/peeklink/backend_drf/.env
```

Set:
```
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

## Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

## Monitoring and Logs

### View Service Logs

```bash
# Gunicorn logs
sudo journalctl -u gunicorn -f

# FastAPI logs
sudo journalctl -u fastapi -f

# Nginx logs
sudo tail -f /var/log/nginx/peeklink_access.log
sudo tail -f /var/log/nginx/peeklink_error.log
```

### Check Service Status

```bash
sudo systemctl status gunicorn
sudo systemctl status fastapi
sudo systemctl status nginx
sudo systemctl status redis-server
```

## Updating the Application

```bash
cd /var/www/peeklink

# Pull latest code
sudo -u www-data git pull

# Update Python dependencies
source venv/bin/activate
cd backend_drf
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
deactivate

# Update Node dependencies
cd ../dashboard
npm install
npm run build

# Restart services
sudo systemctl restart gunicorn
sudo systemctl restart fastapi
sudo systemctl restart nginx
```

## Troubleshooting

### Services Not Starting

```bash
# Check service status
sudo systemctl status gunicorn
sudo systemctl status fastapi

# Check logs
sudo journalctl -u gunicorn -n 50
sudo journalctl -u fastapi -n 50
```

### Nginx Errors

```bash
# Test configuration
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/peeklink_error.log
```

### Permission Issues

```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/peeklink
sudo chown -R www-data:www-data /var/log/gunicorn
```

### Rate Limiting Too Strict

Edit `/etc/nginx/sites-available/peeklink` and increase limits, then:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Security Checklist

- [ ] Change Django SECRET_KEY in `.env`
- [ ] Set DEBUG=False in production
- [ ] Configure proper ALLOWED_HOSTS
- [ ] Setup SSL/HTTPS
- [ ] Configure firewall (UFW)
- [ ] Regular system updates
- [ ] Strong database passwords (if using PostgreSQL)
- [ ] Secure SMTP credentials
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity

## Backup Strategy

```bash
# Backup database
sqlite3 /var/www/peeklink/backend_drf/db.sqlite3 .dump > backup_$(date +%Y%m%d).sql

# Backup entire project
tar -czf peeklink_backup_$(date +%Y%m%d).tar.gz /var/www/peeklink
```

## Performance Tuning

### Gunicorn Workers

Edit `gunicorn_config.py`:
```python
workers = multiprocessing.cpu_count() * 2 + 1
```

### Nginx Caching

Add to nginx.conf:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=peeklink_cache:10m max_size=100m;
```

## Access URLs

After deployment:
- **Dashboard**: http://192.168.2.236
- **API**: http://192.168.2.236/api/
- **Admin**: http://192.168.2.236/admin/
- **Preview**: http://192.168.2.236/p/{id}
- **Redirect**: http://192.168.2.236/r/{id}

