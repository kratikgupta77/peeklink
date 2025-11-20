# PeekLink Extension - Installation Instructions

## For End Users

### Prerequisites

- Google Chrome, Microsoft Edge, Brave, or any Chromium-based browser
- Node.js installed (for building the extension)
- Access to your PeekLink backend server

### Installation Steps

#### 1. Get the Extension Files

Download or clone the PeekLink repository and navigate to the `extension_mv3` folder.

#### 2. Build the Extension

Open a terminal/command prompt in the `extension_mv3` folder and run:

```bash
npm install
npm run build
```

Wait for the build to complete. You should see a `dist` folder created.

#### 3. Load Extension in Chrome

1. Open **Google Chrome** (or your Chromium browser)
2. Type `chrome://extensions/` in the address bar and press Enter
3. Toggle **"Developer mode"** ON (top-right corner)
4. Click **"Load unpacked"** button
5. Navigate to and select the **`extension_mv3`** folder
   - ⚠️ Select the folder containing `manifest.json`, NOT the `dist` folder
6. The extension should now appear in your extensions list

#### 4. Pin the Extension (Recommended)

1. Click the **puzzle piece icon** (🧩) in Chrome's toolbar
2. Find **"PeekLink — Safe Shortener"**
3. Click the **pin icon** (📌) to keep it visible

#### 5. Configure Settings

1. **Right-click** the PeekLink extension icon
2. Select **"Options"**
3. Enter your server URLs:
   - **API base URL**: `http://your-server.com:8000` (or your backend URL)
   - **Dashboard URL**: `http://your-server.com:5173` (or your dashboard URL)
4. Click **"Save"**

#### 6. Log In

1. Click the PeekLink extension icon
2. Enter your **username** and **password**
3. Click **"Sign In"**
4. If you don't have an account, click **"Open Dashboard to Sign Up"**

## You're Ready!

The extension is now installed and ready to use. See [USER_GUIDE.md](./USER_GUIDE.md) for how to use all features.

## Troubleshooting Installation

### "Load unpacked" is grayed out
- Make sure Developer mode is enabled

### Extension shows blank page
- Make sure you ran `npm run build` successfully
- Check that `dist/popup.html` exists
- Reload the extension in `chrome://extensions/`

### Build fails
- Make sure Node.js is installed: `node --version`
- Try deleting `node_modules` and running `npm install` again

### Can't find the extension icon
- Click the puzzle piece icon (🧩) in Chrome toolbar
- Find PeekLink and click the pin icon to keep it visible

