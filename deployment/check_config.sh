#!/bin/bash
# Script to check current configuration and identify issues

VM_IP="192.168.2.236"
PROJECT_DIR="/var/www/peeklink"

echo "🔍 Checking PeekLink configuration..."
echo ""

# Check .env file
if [ -f "$PROJECT_DIR/backend_drf/.env" ]; then
    echo "📄 .env file found:"
    grep -E "SITE_BASE_URL|ALLOWED_HOSTS" "$PROJECT_DIR/backend_drf/.env" || echo "  (no SITE_BASE_URL or ALLOWED_HOSTS found)"
    echo ""
else
    echo "⚠️  No .env file found at $PROJECT_DIR/backend_drf/.env"
    echo ""
fi

# Check Gunicorn service
if [ -f "/etc/systemd/system/gunicorn.service" ]; then
    echo "📄 Gunicorn service environment:"
    sudo systemctl show gunicorn | grep -E "SITE_BASE_URL|Environment" || echo "  (no SITE_BASE_URL found)"
    echo ""
else
    echo "⚠️  Gunicorn service file not found"
    echo ""
fi

# Check if Gunicorn is running and what it's using
if systemctl is-active --quiet gunicorn; then
    echo "✅ Gunicorn is running"
    echo ""
    echo "🔍 Testing API to see what SITE_BASE_URL is being used:"
    echo "   (This will show the short_url returned by the API)"
    echo ""
    echo "   Run this manually to test:"
    echo "   curl -X POST http://$VM_IP/api/links \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
    echo "     -d '{\"target\":\"https://example.com\"}'"
    echo ""
else
    echo "⚠️  Gunicorn is not running"
    echo ""
fi

# Check for group40.com references
echo "🔍 Searching for 'group40.com' references:"
if grep -r "group40.com" "$PROJECT_DIR/backend_drf/" 2>/dev/null; then
    echo "  ⚠️  Found group40.com references!"
else
    echo "  ✅ No group40.com found in backend_drf/"
fi

if grep -r "group40.com" "/etc/systemd/system/gunicorn.service" 2>/dev/null; then
    echo "  ⚠️  Found group40.com in Gunicorn service!"
else
    echo "  ✅ No group40.com in Gunicorn service"
fi

echo ""
echo "📋 Summary:"
echo "  Expected SITE_BASE_URL: http://$VM_IP"
echo "  If you see group40.com anywhere above, that's the problem!"
echo ""
echo "  To fix, run: sudo ./fix_vm_config.sh"

