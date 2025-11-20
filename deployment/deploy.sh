#!/bin/bash
# PeekLink Deployment Script
# Run this script on your VM server (192.168.2.236)

set -e

VM_IP="192.168.2.236"
PROJECT_DIR="/var/www/peeklink"
VENV_DIR="$PROJECT_DIR/venv"
USER="www-data"

echo "🚀 Starting PeekLink deployment on $VM_IP..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    redis-server \
    nodejs \
    npm \
    git \
    supervisor \
    certbot \
    python3-certbot-nginx \
    sqlite3

# Create project directory
echo "📁 Creating project directory..."
mkdir -p $PROJECT_DIR
mkdir -p /var/log/gunicorn
mkdir -p /var/log/peeklink
mkdir -p /var/run/gunicorn
mkdir -p /var/www/peeklink/static
mkdir -p /var/www/peeklink/media

# Set permissions
chown -R $USER:$USER $PROJECT_DIR
chown -R $USER:$USER /var/log/gunicorn
chown -R $USER:$USER /var/log/peeklink
chown -R $USER:$USER /var/run/gunicorn
chown -R $USER:$USER /var/www/peeklink/static
chown -R $USER:$USER /var/www/peeklink/media

# Create Python virtual environment
echo "🐍 Creating Python virtual environment..."
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv $VENV_DIR
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
source $VENV_DIR/bin/activate
pip install --upgrade pip
pip install gunicorn
cd $PROJECT_DIR/backend_drf
pip install -r requirements.txt
cd $PROJECT_DIR/verdicts
pip install -r requirements.txt
deactivate

# Install Node.js dependencies and build dashboard
echo "📦 Installing Node.js dependencies..."
cd $PROJECT_DIR/dashboard
npm install
npm run build

# Run Django migrations
echo "🗄️ Running Django migrations..."
source $VENV_DIR/bin/activate
cd $PROJECT_DIR/backend_drf
python manage.py migrate
python manage.py collectstatic --noinput
deactivate

# Copy configuration files
echo "⚙️ Setting up configuration files..."
cp $PROJECT_DIR/deployment/nginx.conf /etc/nginx/sites-available/peeklink
ln -sf /etc/nginx/sites-available/peeklink /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Copy systemd service files
cp $PROJECT_DIR/deployment/gunicorn.service /etc/systemd/system/
cp $PROJECT_DIR/deployment/fastapi.service /etc/systemd/system/
cp $PROJECT_DIR/deployment/react-dashboard.service /etc/systemd/system/

# Reload systemd
systemctl daemon-reload

# Start services
echo "🔄 Starting services..."
systemctl enable gunicorn
systemctl enable fastapi
systemctl enable nginx
systemctl enable redis-server

systemctl restart gunicorn
systemctl restart fastapi
systemctl restart nginx
systemctl restart redis-server

# Test Nginx configuration
nginx -t

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create a superuser: cd $PROJECT_DIR/backend_drf && source $VENV_DIR/bin/activate && python manage.py createsuperuser"
echo "2. Configure environment variables in $PROJECT_DIR/backend_drf/.env"
echo "3. Check service status: systemctl status gunicorn fastapi nginx"
echo "4. View logs: journalctl -u gunicorn -f"
echo ""
echo "🌐 Your services should now be accessible at:"
echo "   - Dashboard: http://$VM_IP"
echo "   - API: http://$VM_IP/api/"
echo "   - Admin: http://$VM_IP/admin/"

