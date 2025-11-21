#!/bin/bash
# Script to commit and push changes to GitHub

echo "Checking git status..."
git status

echo ""
echo "Adding all changed files..."
git add .

echo ""
echo "Committing changes..."
git commit -m "Fix electron app: Remove forced HTTPS, default to HTTP like extension

- Changed default API base from https://192.168.2.236 to http://127.0.0.1:8000
- Removed forced HTTPS conversion in Login.jsx, ShortenForm.jsx, and PreviewTab.jsx
- Changed dashboard default from https://192.168.2.236 to http://127.0.0.1:5173
- Electron app now matches extension behavior for consistency"

echo ""
echo "Pushing to origin main..."
git push origin main

echo ""
echo "Done!"

