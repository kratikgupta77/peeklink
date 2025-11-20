# Script to update Django settings for production
# Run this after deployment to update settings.py with production values

import os

SETTINGS_FILE = "/var/www/peeklink/backend_drf/peeklink/settings.py"
VM_IP = "192.168.2.236"

# Read current settings
with open(SETTINGS_FILE, 'r') as f:
    content = f.read()

# Update ALLOWED_HOSTS
if "ALLOWED_HOSTS" in content:
    # Replace existing ALLOWED_HOSTS
    import re
    pattern = r"ALLOWED_HOSTS\s*=\s*\[.*?\]"
    replacement = f'ALLOWED_HOSTS = ["{VM_IP}", "localhost", "127.0.0.1"]'
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
else:
    # Add ALLOWED_HOSTS if not present
    content = content.replace(
        "from pathlib import Path",
        f'from pathlib import Path\n\nALLOWED_HOSTS = ["{VM_IP}", "localhost", "127.0.0.1"]'
    )

# Update SITE_BASE_URL
if "SITE_BASE_URL" in content:
    pattern = r'SITE_BASE_URL\s*=\s*os\.environ\.get\([^)]+\)'
    replacement = f'SITE_BASE_URL = os.environ.get("SITE_BASE_URL", "http://{VM_IP}")'
    content = re.sub(pattern, replacement, content)
else:
    # Add SITE_BASE_URL if not present
    content = content.replace(
        "BASE_DIR = Path(__file__).resolve().parent.parent",
        f'BASE_DIR = Path(__file__).resolve().parent.parent\nSITE_BASE_URL = os.environ.get("SITE_BASE_URL", "http://{VM_IP}")'
    )

# Write back
with open(SETTINGS_FILE, 'w') as f:
    f.write(content)

print(f"✅ Updated settings.py with VM IP: {VM_IP}")

