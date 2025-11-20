#!/bin/bash
# Script to update all configuration files with VM IP (192.168.2.236)
# Run this after deployment to update all IP references

VM_IP="192.168.2.236"
PROJECT_DIR="/var/www/peeklink"

echo "🔄 Updating all configuration files with VM IP: $VM_IP"

# Update Django settings
if [ -f "$PROJECT_DIR/backend_drf/peeklink/settings.py" ]; then
    sed -i "s|SITE_BASE_URL = os.environ.get(\"SITE_BASE_URL\", \"http://127.0.0.1:8000\")|SITE_BASE_URL = os.environ.get(\"SITE_BASE_URL\", \"http://$VM_IP\")|g" \
        "$PROJECT_DIR/backend_drf/peeklink/settings.py"
    echo "✅ Updated Django settings.py"
fi

# Update .env file
if [ -f "$PROJECT_DIR/backend_drf/.env" ]; then
    sed -i "s|SITE_BASE_URL=.*|SITE_BASE_URL=http://$VM_IP|g" \
        "$PROJECT_DIR/backend_drf/.env"
    sed -i "s|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=$VM_IP,localhost,127.0.0.1|g" \
        "$PROJECT_DIR/backend_drf/.env"
    echo "✅ Updated .env file"
fi

# Update Nginx config
if [ -f "/etc/nginx/sites-available/peeklink" ]; then
    sed -i "s|server_name .*;|server_name $VM_IP;|g" \
        "/etc/nginx/sites-available/peeklink"
    echo "✅ Updated Nginx configuration"
    sudo nginx -t && sudo systemctl reload nginx
fi

# Update Gunicorn service
if [ -f "/etc/systemd/system/gunicorn.service" ]; then
    sed -i "s|Environment=\"SITE_BASE_URL=.*\"|Environment=\"SITE_BASE_URL=http://$VM_IP\"|g" \
        "/etc/systemd/system/gunicorn.service"
    echo "✅ Updated Gunicorn service"
    sudo systemctl daemon-reload
    sudo systemctl restart gunicorn
fi

# Update Vite config (if using dev server)
if [ -f "$PROJECT_DIR/dashboard/vite.config.js" ]; then
    sed -i "s|target: \"http://127.0.0.1:8000\"|target: \"http://$VM_IP:8000\"|g" \
        "$PROJECT_DIR/dashboard/vite.config.js"
    sed -i "s|target: \"http://127.0.0.1:9000\"|target: \"http://$VM_IP:9000\"|g" \
        "$PROJECT_DIR/dashboard/vite.config.js"
    echo "✅ Updated Vite configuration"
fi

echo ""
echo "✅ All configuration files updated with VM IP: $VM_IP"
echo "🔄 Restart services if needed:"
echo "   sudo systemctl restart gunicorn fastapi nginx"

