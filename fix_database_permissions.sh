#!/bin/bash
# Fix database permissions for PeekLink
# This script fixes the SQLite database permissions so www-data can write to it

echo "🔧 Fixing database permissions for PeekLink..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ This script must be run as root (use sudo)"
    exit 1
fi

DB_FILE="/var/www/peeklink/backend_drf/db.sqlite3"
DB_DIR="/var/www/peeklink/backend_drf"

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    echo "❌ Database file not found: $DB_FILE"
    exit 1
fi

echo "📁 Current permissions:"
ls -la "$DB_FILE" "$DB_DIR" | head -2
echo ""

# Fix ownership
echo "👤 Setting ownership to www-data:www-data..."
chown www-data:www-data "$DB_FILE" "$DB_DIR"
if [ $? -eq 0 ]; then
    echo "✅ Ownership fixed"
else
    echo "❌ Failed to set ownership"
    exit 1
fi

# Fix permissions
echo "🔐 Setting permissions..."
chmod 664 "$DB_FILE"
chmod 775 "$DB_DIR"
if [ $? -eq 0 ]; then
    echo "✅ Permissions fixed"
else
    echo "❌ Failed to set permissions"
    exit 1
fi

echo ""
echo "📁 New permissions:"
ls -la "$DB_FILE" "$DB_DIR" | head -2
echo ""

# Restart gunicorn to apply changes
echo "🔄 Restarting gunicorn service..."
systemctl restart gunicorn
if [ $? -eq 0 ]; then
    echo "✅ Gunicorn restarted"
else
    echo "⚠️  Failed to restart gunicorn (you may need to restart it manually)"
fi

echo ""
echo "✅ Database permissions fixed!"
echo "The database should now be writable by the web server."

