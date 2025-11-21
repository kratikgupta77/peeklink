#!/bin/bash
# Fix 502 Bad Gateway for Dashboard Service
# This script fixes permissions and restarts the dashboard service

set -e

echo "🔧 Fixing Dashboard 502 Bad Gateway Issue..."
echo ""

# 1. Update service file
echo "📝 Updating service file..."
sudo cp /var/www/peeklink/deployment/react-dashboard.service /etc/systemd/system/react-dashboard.service

# 2. Fix permissions - www-data needs read access to dist and node_modules
echo "🔐 Fixing permissions..."
sudo chown -R www-data:www-data /var/www/peeklink/dashboard/dist
sudo chown -R www-data:www-data /var/www/peeklink/dashboard/node_modules
sudo chmod -R 755 /var/www/peeklink/dashboard/dist
sudo chmod -R 755 /var/www/peeklink/dashboard/node_modules
sudo chmod 755 /var/www/peeklink/dashboard

# 3. Reload systemd
echo "🔄 Reloading systemd daemon..."
sudo systemctl daemon-reload

# 4. Restart service
echo "🚀 Restarting react-dashboard service..."
sudo systemctl restart react-dashboard

# 5. Wait a moment for service to start
sleep 3

# 6. Check status
echo ""
echo "📊 Service Status:"
sudo systemctl status react-dashboard --no-pager -l | head -25

# 7. Check if port is listening
echo ""
echo "🔍 Checking if port 5173 is listening..."
if netstat -tlnp 2>/dev/null | grep -q ':5173' || ss -tlnp 2>/dev/null | grep -q ':5173'; then
    echo "✅ Port 5173 is listening!"
else
    echo "❌ Port 5173 is NOT listening"
    echo ""
    echo "📋 Recent service logs:"
    sudo journalctl -u react-dashboard -n 30 --no-pager | tail -20
fi

# 8. Test dashboard
echo ""
echo "🧪 Testing dashboard endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Dashboard is responding (HTTP $HTTP_CODE)"
else
    echo "❌ Dashboard returned HTTP $HTTP_CODE"
fi

# 9. Test through nginx
echo ""
echo "🧪 Testing through nginx (HTTPS)..."
HTTPS_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" https://192.168.2.236/ 2>/dev/null || echo "000")
if [ "$HTTPS_CODE" = "200" ]; then
    echo "✅ Dashboard accessible via HTTPS (HTTP $HTTPS_CODE)"
elif [ "$HTTPS_CODE" = "502" ]; then
    echo "❌ Still getting 502 Bad Gateway"
    echo "   This means nginx can't connect to the dashboard service"
    echo "   Check service logs: sudo journalctl -u react-dashboard -n 50"
else
    echo "⚠️  Dashboard returned HTTP $HTTPS_CODE"
fi

echo ""
echo "✅ Fix script completed!"
echo ""
echo "💡 If still getting 502, check logs with:"
echo "   sudo journalctl -u react-dashboard -n 50"

