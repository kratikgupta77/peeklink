# PeekLink Extension

React-based Chrome extension for PeekLink that requires authentication before use.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension_mv3` directory (the one containing `manifest.json`)

## Development

To develop with hot reload:
```bash
npm run dev
```

Note: For extension development, you'll need to manually reload the extension after changes.

## Features

- **Authentication Required**: Users must log in before using the extension
- **Login Page**: Integrated login form that authenticates with the backend
- **Shorten Form**: Full-featured form with password protection and expiry options
- **Preview Card**: Shows verdict and allows opening preview/analytics
- **Chrome Storage**: Auth tokens are stored in `chrome.storage.sync` for persistence

## Authentication Flow

1. User opens extension popup
2. If not authenticated, login page is shown
3. User enters credentials and logs in
4. Token is stored in `chrome.storage.sync`
5. Extension shows shorten form
6. User can create links, view previews, and access analytics

## Configuration

The extension uses the same API base URL as configured in the options page. Authentication tokens are synced via `chrome.storage.sync`.

