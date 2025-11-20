const { contextBridge } = require("electron");

// Expose protected methods that allow the renderer process to use
// the APIs safely
contextBridge.exposeInMainWorld("electronAPI", {
  // Add any Electron-specific APIs here if needed
  // For now, we're using standard web APIs (fetch, localStorage)
});

