# PeekLink Desktop (Electron)

Desktop application for PeekLink built with Electron and React.

## Setup

1. **Install React UI dependencies:**
   ```bash
   cd react-ui
   npm install
   ```

2. **Build the React UI:**
   ```bash
   npm run build
   ```

3. **Install Electron dependencies:**
   ```bash
   cd ..
   npm install
   ```

## Development

1. **Start React dev server (in one terminal):**
   ```bash
   cd react-ui
   npm run dev
   ```

2. **Start Electron app (in another terminal):**
   ```bash
   npm run dev
   ```

## Building for Production

1. **Build React UI:**
   ```bash
   npm run build-ui
   ```

2. **Build Electron app:**
   ```bash
   npm run build
   ```

This will create platform-specific installers in the `dist/` folder.

## Configuration

The app uses `localStorage` to store:
- `accessToken` - JWT access token
- `apiBase` - API server URL (default: `http://127.0.0.1:8000`)
- `dashboardBase` - Dashboard URL (default: `http://127.0.0.1:5173`)

To change these settings, you can:
- Edit `localStorage` in DevTools (F12)
- Or modify the default values in the React components

## Features

- ✅ Authentication with JWT tokens
- ✅ Link shortening with expiry options
- ✅ URL preview and safety checking
- ✅ Password-protected links
- ✅ Click-based and time-based expiry
- ✅ Opens dashboard in browser with auto-login

## Architecture

- **Electron Main Process** (`main.js`) - Creates and manages the window
- **React UI** (`react-ui/`) - All UI components (copied from extension)
- **Preload Script** (`preload.js`) - Secure bridge between Electron and React

The app communicates directly with your VM server:
- Django API: `http://your-vm:8000/api/...`
- FastAPI Verdicts: `http://your-vm:9000/score`

