# PeekLink Browser Extension - User Guide

## Installation

### Step 1: Download the Extension

1. Download or clone the PeekLink repository
2. Navigate to the `extension_mv3` folder

### Step 2: Build the Extension

1. Open a terminal/command prompt in the `extension_mv3` folder
2. Install dependencies (first time only):
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Wait for the build to complete. You should see a `dist` folder created.

### Step 3: Load Extension in Chrome

1. Open Google Chrome
2. Go to `chrome://extensions/` (paste this in the address bar)
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **"Load unpacked"** button
5. Select the **`extension_mv3`** folder (the one containing `manifest.json`, NOT the `dist` folder)
6. The extension should now appear in your extensions list

### Step 4: Pin the Extension (Optional)

1. Click the **puzzle piece icon** (🧩) in Chrome's toolbar
2. Find "PeekLink — Safe Shortener"
3. Click the **pin icon** (📌) to keep it visible in your toolbar

## First-Time Setup

### 1. Configure API Settings

1. **Right-click** the PeekLink extension icon in your toolbar
2. Select **"Options"** from the menu
3. Enter your settings:
   - **API base URL**: Your backend server URL (e.g., `http://your-server.com:8000`)
   - **Dashboard URL**: Your dashboard URL (e.g., `http://your-server.com:5173`)
   - **API Token**: Leave empty for now (you'll log in through the extension)
4. Click **"Save"**

### 2. Log In

1. **Click** the PeekLink extension icon in your toolbar
2. You'll see the login page
3. Enter your **username** and **password**
4. Click **"Sign In"**
5. If you don't have an account, click **"Open Dashboard to Sign Up"** to create one

## Using the Extension

### Shorten a Link

1. Click the PeekLink extension icon
2. Make sure you're on the **"Shorten"** tab
3. Enter the URL you want to shorten in the **"Destination URL"** field
4. (Optional) Select a **Domain Name**
5. (Optional) Set **Expiration**:
   - **No expiry**: Link never expires
   - **Time-based**: Link expires on a specific date/time
   - **Click-based**: Link expires after a certain number of clicks
6. (Optional) Enable **Password protection** and enter a password
7. Click **"Create Link"**
8. Your short link will appear in a blue box - click **"Copy"** to copy it

### Preview a URL (Check Safety)

1. Click the PeekLink extension icon
2. Go to the **"Preview"** tab
3. Enter the URL you want to check
4. Click **"Check"**
5. You'll see:
   - **Safety verdict** (Safe/Warning/Blocked)
   - **Final Destination**
   - **Redirects detected**
   - **Response Time**
   - **Status Code**

### Use Current Tab URL

1. While on any webpage, click the PeekLink extension
2. The current page URL will automatically fill in the "Destination URL" field
3. Click "Create Link" to shorten it

### Right-Click Context Menu

1. **Right-click** on any link or webpage
2. Select **"Peek with PeekLink (shorten + preview)"**
3. The link will be automatically shortened and opened in a new tab

## Navigation

### Bottom Navigation Bar

- **Analytics** (Shorten tab only): Opens your dashboard with automatic login
- **Settings**: Opens extension options page
- **Logout**: Signs you out and returns to login page

## Features

### Password-Protected Links

1. When creating a link, check **"Password protect this link"**
2. Enter a password
3. When someone clicks your short link, they'll need to enter the password to access it

### Link Expiration

**Time-Based Expiry:**
- Set a date and time when the link should expire
- After expiration, the link will show "Link expired"

**Click-Based Expiry:**
- Set the maximum number of clicks
- After reaching the limit, the link will show "Link expired"

### Analytics

- Click **"Analytics"** in the extension to view:
  - Click statistics
  - Verdict breakdown
  - Top referrers
  - All your links

## Troubleshooting

### Extension Shows Blank Page

1. Make sure you ran `npm run build` in the `extension_mv3` folder
2. Check that the `dist` folder exists with `popup.html` inside
3. Reload the extension:
   - Go to `chrome://extensions/`
   - Click the **reload icon** (🔄) on the PeekLink extension

### Can't Log In

1. Check your **API base URL** in Settings (right-click extension → Options)
2. Make sure your backend server is running
3. Verify your username and password are correct
4. Check the browser console for errors:
   - Right-click extension popup → **Inspect**
   - Look for error messages in the Console tab

### "API 400" or "API 500" Errors

1. Verify your **API base URL** is correct in Settings
2. Make sure your backend server is accessible
3. Check that the server is running on the correct port
4. Try accessing the API directly in your browser: `http://your-server:8000/api/links`

### Links Not Creating

1. Check that you're logged in (you should see the Shorten tab, not Login)
2. Verify the URL starts with `http://` or `https://`
3. Make sure your backend server is running
4. Check the browser console for specific error messages

### Can't Access Dashboard

1. Click **"Analytics"** button in the extension
2. If it doesn't open, check your **Dashboard URL** in Settings
3. Make sure your dashboard server is running
4. The extension will automatically log you in using your token

## Updating the Extension

1. Pull the latest code from the repository
2. Rebuild the extension:
   ```bash
   cd extension_mv3
   npm run build
   ```
3. Reload the extension:
   - Go to `chrome://extensions/`
   - Click the **reload icon** (🔄) on the PeekLink extension

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "PeekLink — Safe Shortener"
3. Click **"Remove"**
4. Confirm removal

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify all settings are correct
3. Make sure your servers (backend and dashboard) are running
4. Check the extension's README.md for technical details

---

**Note**: This extension requires your PeekLink backend server to be running and accessible. Make sure your server is configured and running before using the extension.

