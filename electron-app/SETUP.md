# Electron App Setup Instructions

## System Dependencies (Linux/WSL)

If you get the error `libnss3.so: cannot open shared object file`, install the required system libraries:

```bash
sudo apt-get update
sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libxss1 libgtk-3-0
```

## Setup Steps

1. **Install React UI dependencies:**
   ```bash
   cd react-ui
   npm install
   ```

2. **Build React UI:**
   ```bash
   npm run build
   ```

3. **Go back to electron-app directory:**
   ```bash
   cd ..
   ```

4. **Install Electron dependencies:**
   ```bash
   npm install
   ```

5. **Run Electron app:**
   ```bash
   npm start
   ```

## Development Mode

For development with hot reload:

1. **Terminal 1 - Start React dev server:**
   ```bash
   cd react-ui
   npm run dev
   ```

2. **Terminal 2 - Start Electron in dev mode:**
   ```bash
   cd electron-app
   NODE_ENV=development npm start
   ```

## Building EXE

To build a distributable EXE:

```bash
npm run build
```

This will create installers in the `dist/` folder.

## Configuration

The app uses `localStorage` for configuration. To change the API base URL:

1. Open DevTools in Electron (View → Toggle Developer Tools or F12)
2. Go to Console tab
3. Run:
   ```javascript
   localStorage.setItem("apiBase", "http://YOUR_VM_IP:8000");
   localStorage.setItem("dashboardBase", "http://YOUR_VM_IP:5173");
   ```
4. Reload the app (Ctrl+R or Cmd+R)

## Troubleshooting

### Electron won't start (missing libraries)
- Install system dependencies (see above)
- Try reinstalling Electron: `rm -rf node_modules && npm install`

### Blank window
- Make sure React UI is built: `cd react-ui && npm run build`
- Check that `react-ui/dist/index.html` exists
- Open DevTools to see console errors

### Can't connect to API
- Check that your VM server is running
- Update `apiBase` in localStorage (see Configuration above)
- Check firewall/network settings

