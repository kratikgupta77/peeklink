#!/bin/bash
# Script to fix configuration for VM deployment (192.168.2.236)
# This addresses issues with short links and sandbox redirects

VM_IP="192.168.2.236"
PROJECT_DIR="/var/www/peeklink"

echo "🔧 Fixing VM configuration for IP: $VM_IP"
echo ""

# 1. Update Django .env file if it exists
if [ -f "$PROJECT_DIR/backend_drf/.env" ]; then
    echo "📝 Updating .env file..."
    sed -i "s|SITE_BASE_URL=.*|SITE_BASE_URL=http://$VM_IP|g" "$PROJECT_DIR/backend_drf/.env"
    sed -i "s|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=$VM_IP,localhost,127.0.0.1|g" "$PROJECT_DIR/backend_drf/.env" 2>/dev/null || true
    echo "✅ Updated .env file"
else
    echo "⚠️  No .env file found at $PROJECT_DIR/backend_drf/.env"
    echo "   Creating .env file..."
    mkdir -p "$PROJECT_DIR/backend_drf"
    echo "SITE_BASE_URL=http://$VM_IP" >> "$PROJECT_DIR/backend_drf/.env"
    echo "✅ Created .env file"
fi

# 2. Update Gunicorn service
if [ -f "/etc/systemd/system/gunicorn.service" ]; then
    echo "📝 Updating Gunicorn service..."
    sudo sed -i "s|Environment=\"SITE_BASE_URL=.*\"|Environment=\"SITE_BASE_URL=http://$VM_IP\"|g" \
        "/etc/systemd/system/gunicorn.service"
    echo "✅ Updated Gunicorn service"
    sudo systemctl daemon-reload
    echo "✅ Reloaded systemd daemon"
else
    echo "⚠️  Gunicorn service file not found"
fi

# 3. Rebuild dashboard with correct VITE_API_BASE
if [ -d "$PROJECT_DIR/dashboard" ]; then
    echo "📝 Rebuilding dashboard with VITE_API_BASE=http://$VM_IP..."
    cd "$PROJECT_DIR/dashboard"
    VITE_API_BASE="http://$VM_IP" npm run build
    echo "✅ Dashboard rebuilt"
else
    echo "⚠️  Dashboard directory not found"
fi

# 4. Restart services
echo ""
echo "🔄 Restarting services..."
if systemctl is-active --quiet gunicorn; then
    sudo systemctl restart gunicorn
    echo "✅ Gunicorn restarted"
else
    echo "⚠️  Gunicorn is not running"
fi

if systemctl is-active --quiet nginx; then
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "⚠️  Nginx is not running"
fi

echo ""
echo "✅ Configuration fix complete!"
echo ""
echo "📋 Verification steps:"
echo "1. Check Gunicorn environment: sudo systemctl show gunicorn | grep SITE_BASE_URL"
echo "2. Check Gunicorn logs: sudo journalctl -u gunicorn -n 50"
echo "3. Test API: curl http://$VM_IP/api/health"
echo "4. Create a test link and verify the short_url uses http://$VM_IP"

