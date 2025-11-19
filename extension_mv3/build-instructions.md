# Build Instructions

## Step 1: Install Dependencies
```bash
cd extension_mv3
npm install
```

## Step 2: Build the Extension
```bash
npm run build
```

This will create a `dist` folder with all the compiled React files.

## Step 3: Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. **Select the `extension_mv3` folder** (the one containing `manifest.json`, NOT the `dist` folder)

## Step 4: Test
- Click the extension icon
- You should see the login page
- Enter your credentials
- After login, you'll see the shorten form

## Troubleshooting

If the extension shows a blank page:
1. Check the browser console (right-click extension popup → Inspect)
2. Make sure you ran `npm run build` 
3. Make sure the `dist` folder exists with `popup.html` inside
4. Reload the extension in `chrome://extensions/`

If you see "Failed to load" errors:
- Make sure all files in `dist/` are present
- Check that `manifest.json` points to `dist/popup.html`

