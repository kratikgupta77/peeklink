const { app, BrowserWindow } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  const iconPath = path.join(__dirname, "assets", "icon.png");
  const fs = require("fs");
  
  const windowOptions = {
    width: 500,
    height: 700,
    minWidth: 400,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  };
  
  // Only set icon if it exists
  if (fs.existsSync(iconPath)) {
    windowOptions.icon = iconPath;
  }
  
  mainWindow = new BrowserWindow(windowOptions);

  // Load the built React app
  const isDev = process.env.NODE_ENV === "development";
  
  if (isDev) {
    // Development: load from Vite dev server
    mainWindow.loadURL("http://localhost:5175");
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from built files
    // Vite builds to dist/index.html
    mainWindow.loadFile(path.join(__dirname, "react-ui", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

