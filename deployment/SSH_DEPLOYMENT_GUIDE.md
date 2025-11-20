# PeekLink SSH Server Deployment Guide

Complete step-by-step guide to deploy PeekLink on a remote SSH server with Nginx, Gunicorn, and systemd services.

## Prerequisites

- **Remote Server**: Ubuntu 20.04+ or Debian 11+ with SSH access
- **Local Machine**: Terminal with SSH client
- **Domain Name** (optional): For SSL/HTTPS setup
- **Root/Sudo Access**: Required for system configuration

---

## Step 1: Connect to Your Server

```bash
# Connect via SSH (replace with your server IP and username)
ssh username@your-server-ip

# Example:
# ssh root@192.168.2.236
# or
# ssh ubuntu@192.168.2.236
```

---

## Step 2: Initial Server Setup

### 2.1 Update System Packages

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2.2 Install Essential Tools

```bash
sudo apt-get install -y \
    git \
    curl \
    wget \
    build-essential \
    python3-dev \
    python3-pip \
    python3-venv \
    nginx \
    redis-server \
    nodejs \
    npm \
    sqlite3 \
    supervisor \
    ufw \
    certbot \
    python3-certbot-nginx
```

### 2.3 Verify Installations

```bash
python3 --version  # Should be 3.8+
node --version     # Should be 16+
nginx -v           # Should show version
redis-cli --version
```

---

## Step 3: Clone the Repository

### 3.1 Create Project Directory

```bash
sudo mkdir -p /var/www
cd /var/www
```

### 3.2 Clone Repository

```bash
# If using Git
sudo git clone https://github.com/kratikgupta77/peeklink.git

# OR if uploading via SCP/SFTP, extract to /var/www/peeklink
```

### 3.3 Set Permissions

```bash
sudo chown -R $USER:$USER /var/www/peeklink
cd /var/www/peeklink
```

---

## Step 4: Setup Python Environment

### 4.1 Create Virtual Environment

```bash
cd /var/www/peeklink
python3 -m venv venv
source venv/bin/activate
```

### 4.2 Install Backend Dependencies

```bash
cd backend_drf
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
```

### 4.3 Install FastAPI Dependencies

```bash
cd ../verdicts
pip install -r requirements.txt
deactivate
```

---

## Step 5: Configure Environment Variables

### 5.1 Create Backend .env File

```bash
cd /var/www/peeklink/backend_drf
nano .env
```

### 5.2 Add Required Variables

```bash
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here-generate-with-openssl-rand-hex-32
DEBUG=False
DJANGO_USE_SQLITE=1
SITE_BASE_URL=http://your-server-ip
# OR if using domain:
# SITE_BASE_URL=https://yourdomain.com

# Email Configuration (SMTP)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=1
EMAIL_USE_SSL=0

# Database (if using PostgreSQL)
# POSTGRES_DB=peeklink
# POSTGRES_USER=peeklink
# POSTGRES_PASSWORD=your-db-password
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
```

**Generate Secret Key:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

## Step 6: Setup Django Database

### 6.1 Run Migrations

```bash
cd /var/www/peeklink/backend_drf
source ../venv/bin/activate
python manage.py migrate
```

### 6.2 Collect Static Files

```bash
python manage.py collectstatic --noinput
```

### 6.3 Create Superuser (Admin)

```bash
python manage.py createsuperuser
# Follow prompts to create admin account
deactivate
```

---

## Step 7: Configure Redis

### 7.1 Start Redis Service

```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server
sudo systemctl status redis-server
```

### 7.2 Test Redis Connection

```bash
redis-cli ping
# Should return: PONG
```

---

## Step 8: Build React Dashboard

### 8.1 Install Node Dependencies

```bash
cd /var/www/peeklink/dashboard
npm install
```

### 8.2 Build for Production

```bash
# Option 1: Build static files (recommended for production)
npm run build

# Option 2: Use Vite preview server (for development/testing)
# We'll configure this in systemd service
```

### 8.3 Configure Environment

Create `.env.production` if needed:
```bash
cd /var/www/peeklink/dashboard
nano .env.production
```

Add:
```
VITE_API_BASE=http://your-server-ip
# OR
# VITE_API_BASE=https://yourdomain.com
```

---

## Step 9: Configure Gunicorn Service

### 9.1 Update Service File

```bash
cd /var/www/peeklink/deployment
sudo nano gunicorn.service
```

**Update paths if different:**
- `WorkingDirectory=/var/www/peeklink/backend_drf`
- `Environment="PATH=/var/www/peeklink/venv/bin"`
- `ExecStart=/var/www/peeklink/venv/bin/gunicorn`

### 9.2 Copy Service File

```bash
sudo cp gunicorn.service /etc/systemd/system/
```

### 9.3 Update Gunicorn Config

```bash
sudo nano /var/www/peeklink/deployment/gunicorn_config.py
```

**Verify paths:**
- `accesslog = "/var/log/gunicorn/peeklink_access.log"`
- `errorlog = "/var/log/gunicorn/peeklink_error.log"`
- `pidfile = "/var/run/gunicorn/peeklink.pid"`

### 9.4 Create Required Directories

```bash
sudo mkdir -p /var/log/gunicorn
sudo mkdir -p /var/run/gunicorn
sudo chown -R www-data:www-data /var/log/gunicorn
sudo chown -R www-data:www-data /var/run/gunicorn
```

### 9.5 Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl start gunicorn
sudo systemctl status gunicorn
```

**Check logs if errors:**
```bash
sudo journalctl -u gunicorn -f
```

---

## Step 10: Configure FastAPI Service

### 10.1 Update Service File

```bash
cd /var/www/peeklink/deployment
sudo nano fastapi.service
```

**Verify paths:**
- `WorkingDirectory=/var/www/peeklink/verdicts`
- `Environment="PATH=/var/www/peeklink/venv/bin"`

### 10.2 Copy Service File

```bash
sudo cp fastapi.service /etc/systemd/system/
```

### 10.3 Create Log Directory

```bash
sudo mkdir -p /var/log/peeklink
sudo chown -R www-data:www-data /var/log/peeklink
```

### 10.4 Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable fastapi
sudo systemctl start fastapi
sudo systemctl status fastapi
```

**Check logs if errors:**
```bash
sudo journalctl -u fastapi -f
```

---

## Step 11: Configure React Dashboard Service (Optional)

### Option A: Serve Built Static Files with Nginx (Recommended)

Skip this step - we'll configure Nginx to serve static files directly.

### Option B: Run Vite Preview Server

```bash
cd /var/www/peeklink/deployment
sudo nano react-dashboard.service
```

**Update paths:**
- `WorkingDirectory=/var/www/peeklink/dashboard`
- `ExecStart=/usr/bin/npm run preview -- --host 127.0.0.1 --port 5173`

```bash
sudo cp react-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable react-dashboard
sudo systemctl start react-dashboard
sudo systemctl status react-dashboard
```

---

## Step 12: Configure Nginx

### 12.1 Update Nginx Configuration

```bash
cd /var/www/peeklink/deployment
sudo nano nginx.conf
```

**Update server_name:**
```nginx
server_name your-server-ip;  # e.g., 192.168.2.236
# OR if using domain:
# server_name yourdomain.com www.yourdomain.com;
```

### 12.2 Copy Nginx Config

```bash
sudo cp nginx.conf /etc/nginx/sites-available/peeklink
```

### 12.3 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/peeklink /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site
```

### 12.4 Create Static Files Directory (if serving with Nginx)

```bash
sudo mkdir -p /var/www/peeklink/static
sudo mkdir -p /var/www/peeklink/media
sudo chown -R www-data:www-data /var/www/peeklink
```

### 12.5 Test Nginx Configuration

```bash
sudo nginx -t
```

**If successful, you should see:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 12.6 Start Nginx

```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

---

## Step 13: Configure Firewall

### 13.1 Allow Required Ports

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
```

### 13.2 Enable Firewall

```bash
sudo ufw enable
sudo ufw status
```

---

## Step 14: Test the Deployment

### 14.1 Check All Services

```bash
sudo systemctl status gunicorn
sudo systemctl status fastapi
sudo systemctl status nginx
sudo systemctl status redis-server
```

### 14.2 Test Endpoints

```bash
# Test Django API
curl http://localhost:8000/api/links

# Test FastAPI
curl -X POST http://localhost:9000/score \
  -H "Content-Type: application/json" \
  -d '{"items":[{"url":"https://example.com"}]}'

# Test Nginx
curl http://localhost/api/links
```

### 14.3 Access from Browser

Open in your browser:
- **Dashboard**: `http://your-server-ip`
- **API**: `http://your-server-ip/api/`
- **Admin**: `http://your-server-ip/admin/`

---

## Step 15: SSL/HTTPS Setup (Optional but Recommended)

### 15.1 Install SSL Certificate

```bash
# Replace with your domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 15.2 Update Django Settings

```bash
cd /var/www/peeklink/backend_drf
nano .env
```

Add:
```bash
SITE_BASE_URL=https://yourdomain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### 15.3 Restart Services

```bash
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

---

## Step 16: Setup Fail2Ban (DDoS Protection)

### 16.1 Install Fail2Ban

```bash
sudo apt-get install -y fail2ban
```

### 16.2 Configure Filters

```bash
cd /var/www/peeklink/deployment
sudo cp fail2ban-filter-peeklink-auth.conf /etc/fail2ban/filter.d/
sudo cp fail2ban-filter-peeklink-nginx-limit-req.conf /etc/fail2ban/filter.d/
sudo cp fail2ban.conf /etc/fail2ban/jail.d/peeklink.conf
```

### 16.3 Start Fail2Ban

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban
```

---

## Step 17: Monitoring and Maintenance

### 17.1 View Logs

```bash
# Gunicorn logs
sudo journalctl -u gunicorn -f

# FastAPI logs
sudo journalctl -u fastapi -f

# Nginx access logs
sudo tail -f /var/log/nginx/peeklink_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/peeklink_error.log
```

### 17.2 Check Service Status

```bash
sudo systemctl status gunicorn
sudo systemctl status fastapi
sudo systemctl status nginx
sudo systemctl status redis-server
```

### 17.3 Restart Services

```bash
sudo systemctl restart gunicorn
sudo systemctl restart fastapi
sudo systemctl restart nginx
```

---

## Step 18: Update Application

### 18.1 Pull Latest Code

```bash
cd /var/www/peeklink
git pull
# OR upload new files via SCP/SFTP
```

### 18.2 Update Dependencies

```bash
source venv/bin/activate

# Backend
cd backend_drf
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# FastAPI
cd ../verdicts
pip install -r requirements.txt

deactivate
```

### 18.3 Rebuild Frontend (if needed)

```bash
cd /var/www/peeklink/dashboard
npm install
npm run build
```

### 18.4 Restart Services

```bash
sudo systemctl restart gunicorn
sudo systemctl restart fastapi
sudo systemctl restart nginx
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check service status
sudo systemctl status gunicorn
sudo systemctl status fastapi

# Check logs
sudo journalctl -u gunicorn -n 50
sudo journalctl -u fastapi -n 50
```

### Permission Errors

```bash
sudo chown -R www-data:www-data /var/www/peeklink
sudo chown -R www-data:www-data /var/log/gunicorn
sudo chown -R www-data:www-data /var/run/gunicorn
```

### Nginx Errors

```bash
# Test configuration
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/peeklink_error.log
```

### Port Already in Use

```bash
# Check what's using port 8000
sudo lsof -i :8000

# Kill process if needed
sudo kill -9 <PID>
```

### Database Errors

```bash
cd /var/www/peeklink/backend_drf
source ../venv/bin/activate
python manage.py migrate
python manage.py check
```

---

## Quick Reference Commands

```bash
# Start all services
sudo systemctl start gunicorn fastapi nginx redis-server

# Stop all services
sudo systemctl stop gunicorn fastapi nginx

# Restart all services
sudo systemctl restart gunicorn fastapi nginx

# Check all services
sudo systemctl status gunicorn fastapi nginx redis-server

# View logs
sudo journalctl -u gunicorn -f
sudo journalctl -u fastapi -f
sudo tail -f /var/log/nginx/peeklink_access.log
```

---

## Access URLs

After successful deployment:

- **Dashboard**: `http://your-server-ip` or `https://yourdomain.com`
- **API**: `http://your-server-ip/api/`
- **Admin Panel**: `http://your-server-ip/admin/`
- **Preview Link**: `http://your-server-ip/p/{link_id}`
- **Redirect Link**: `http://your-server-ip/r/{link_id}`
- **Verdict Service**: `http://your-server-ip/score`

---

## Security Checklist

- [ ] Changed `DJANGO_SECRET_KEY` in `.env`
- [ ] Set `DEBUG=False` in production
- [ ] Configured `ALLOWED_HOSTS` in settings
- [ ] Setup SSL/HTTPS (if using domain)
- [ ] Configured firewall (UFW)
- [ ] Enabled Fail2Ban
- [ ] Secured SMTP credentials
- [ ] Regular system updates
- [ ] Database backups configured
- [ ] Monitoring logs for suspicious activity

---

## Next Steps

1. **Test all functionality** - Create links, preview, check analytics
2. **Setup automated backups** - Database and file backups
3. **Monitor performance** - Set up monitoring tools
4. **Scale if needed** - Add more workers, load balancers
5. **Document custom configurations** - Keep notes of any changes

---

## Support

If you encounter issues:
1. Check service logs: `sudo journalctl -u <service-name> -f`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/peeklink_error.log`
3. Verify file permissions: `ls -la /var/www/peeklink`
4. Test endpoints manually: `curl http://localhost:8000/api/links`

