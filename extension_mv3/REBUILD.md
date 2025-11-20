# Rebuild Extension

After making changes to the extension source code, you need to rebuild:

```bash
cd extension_mv3
npm run build
```

This will:
1. Compile the React app
2. Output to `dist/` folder
3. Create `dist/popup.html` with relative paths

Then reload the extension in Chrome:
1. Go to `chrome://extensions/`
2. Find "PeekLink — Safe Shortener"
3. Click the reload icon (circular arrow)

## Current Fixes Applied

✅ Success message with short link after creation
✅ Short link copy button
✅ PreviewCard shows short link only for safe verdicts
✅ Short URLs use `/p/` (preview) instead of `/r/` (redirect)
✅ Fixed icon paths in manifest.json
✅ Password protection, time-based expiry, click-based expiry all working
✅ Authentication required before use
✅ Blocked URLs show error (no link created)

