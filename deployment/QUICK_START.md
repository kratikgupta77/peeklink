# PeekLink Quick Start - SSH Server Deployment

## 🚀 Quick Deployment Checklist

### Pre-Deployment
- [ ] SSH access to server
- [ ] Server IP address or domain name
- [ ] Root/sudo access
- [ ] SMTP credentials (for email OTP)

---

## 📋 Step-by-Step Commands

### 1. Connect to Server
```bash
ssh username@your-server-ip
```

### 2. Install Dependencies
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y python3 python3-pip python3-venv nginx redis-server nodejs npm git sqlite3
```

### 3. Clone/Upload Project
```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/kratikgupta77/peeklink.git
sudo chown -R $USER:$USER /var/www/peeklink
cd /var/www/peeklink
```

### 4. Setup Python Environment
```bash
python3 -m venv venv
source venv/bin/activate
cd backend_drf && pip install -r requirements.txt && pip install gunicorn
cd ../verdicts && pip install -r requirements.txt
deactivate
```

### 5. Configure Environment Variables
```bash
cd /var/www/peeklink/backend_drf
nano .env
```

**Required variables:**
```bash
DJANGO_SECRET_KEY=<generate-with-openssl-rand-hex-32>
DEBUG=False
SITE_BASE_URL=http://your-server-ip
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=1
EMAIL_USE_SSL=0
```

### 6. Setup Database
```bash
cd /var/www/peeklink/backend_drf
source ../venv/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
deactivate
```

### 7. Build Frontend
```bash
cd /var/www/peeklink/dashboard
npm install
npm run build
```

### 8. Start Redis
```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 9. Setup Systemd Services
```bash
cd /var/www/peeklink/deployment

# Create required directories
sudo mkdir -p /var/log/gunicorn /var/run/gunicorn /var/log/peeklink
sudo chown -R www-data:www-data /var/log/gunicorn /var/run/gunicorn /var/log/peeklink

# Copy service files
sudo cp gunicorn.service /etc/systemd/system/
sudo cp fastapi.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable gunicorn fastapi
sudo systemctl start gunicorn fastapi
```

### 10. Configure Nginx
```bash
cd /var/www/peeklink/deployment
sudo cp nginx.conf /etc/nginx/sites-available/peeklink

# Edit server_name in nginx.conf
sudo nano /etc/nginx/sites-available/peeklink

# Enable site
sudo ln -s /etc/nginx/sites-available/peeklink /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

### 11. Configure Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 12. Verify Services
```bash
sudo systemctl status gunicorn
sudo systemctl status fastapi
sudo systemctl status nginx
sudo systemctl status redis-server
```

---

## 🔧 Quick Fixes

### Services Not Starting
```bash
sudo journalctl -u gunicorn -n 50
sudo journalctl -u fastapi -n 50
```

### Permission Issues
```bash
sudo chown -R www-data:www-data /var/www/peeklink
```

### Nginx Errors
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/peeklink_error.log
```

### Restart All Services
```bash
sudo systemctl restart gunicorn fastapi nginx redis-server
```

---

## 📍 Access URLs

- Dashboard: `http://your-server-ip`
- API: `http://your-server-ip/api/`
- Admin: `http://your-server-ip/admin/`

---

## 📚 Full Documentation

See `SSH_DEPLOYMENT_GUIDE.md` for detailed instructions.

