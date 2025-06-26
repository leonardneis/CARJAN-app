import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// import "./services.js";
// import { killAllServices } from "./services.js";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, "../renderer/assets/img/marker.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL("http://localhost:5173");

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

ipcMain.handle("get-app-version", async () => {
  return app.getVersion();
});

app.whenReady().then(createWindow);

// app.on("before-quit", () => {
//   killAllServices();
// });
