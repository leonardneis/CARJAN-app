import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// import "./services.js";
// import { killAllServices } from "./services.js";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, "../renderer/assets/img/marker.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Don't show until ready-to-show
    titleBarStyle: "default",
    frame: true,
  });

  // Load the appropriate URL based on environment
  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

  console.log("Electron environment:", {
    NODE_ENV: process.env.NODE_ENV,
    isPackaged: app.isPackaged,
    isDev: isDev,
  });

  if (isDev) {
    console.log("Loading development server: http://localhost:5173");
    win.loadURL("http://localhost:5173");
    // Open DevTools in development
    win.webContents.openDevTools();
  } else {
    console.log("Loading production build from dist folder");
    // In production, load from the dist folder
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  // Show window when ready to prevent visual flash
  win.once("ready-to-show", () => {
    win.show();
  });

  // Store window reference for file dialogs
  global.mainWindow = win;
}

// File operations IPC handlers
ipcMain.handle("show-save-dialog", async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(global.mainWindow, options);
    return result;
  } catch (error) {
    console.error("Save dialog error:", error);
    throw error;
  }
});

ipcMain.handle("show-open-dialog", async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(global.mainWindow, options);
    return result;
  } catch (error) {
    console.error("Open dialog error:", error);
    throw error;
  }
});

ipcMain.handle("write-file", async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, "utf8");
    return { success: true };
  } catch (error) {
    console.error("Write file error:", error);
    throw error;
  }
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return content;
  } catch (error) {
    console.error("Read file error:", error);
    throw error;
  }
});

ipcMain.handle("file-exists", async (event, filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
});

// Autosave operations
ipcMain.handle("get-autosave-path", async () => {
  try {
    const autosavePath = path.join(
      os.homedir(),
      "Documents",
      "CARJAN_Autosaves"
    );
    // Ensure directory exists
    await fs.mkdir(autosavePath, { recursive: true });
    return autosavePath;
  } catch (error) {
    console.error("Error creating autosave path:", error);
    // Fallback to Desktop
    return path.join(os.homedir(), "Desktop");
  }
});

ipcMain.handle("write-autosave-file", async (event, filename, content) => {
  try {
    // Get autosave path
    const autosavePath = path.join(
      os.homedir(),
      "Documents",
      "CARJAN_Autosaves"
    );

    // Ensure directory exists
    await fs.mkdir(autosavePath, { recursive: true });

    const filePath = path.join(autosavePath, filename);
    await fs.writeFile(filePath, content, "utf8");

    console.log(`Autosave file written: ${filePath}`);
    return { success: true, filePath };
  } catch (error) {
    console.error("Write autosave file error:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-app-version", async () => {
  return app.getVersion();
});

// Close app handler
ipcMain.handle("close-app", async () => {
  app.quit();
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // On macOS, applications and their menu bar stay active until explicitly quit
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// app.on("before-quit", () => {
//   killAllServices();
// });
