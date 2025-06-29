const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
});

// Expose file operations API
contextBridge.exposeInMainWorld("electronAPI", {
  // File dialog operations
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),
  showOpenDialog: (options) => ipcRenderer.invoke("show-open-dialog", options),

  // File system operations
  writeFile: (filePath, content) =>
    ipcRenderer.invoke("write-file", filePath, content),
  readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
  fileExists: (filePath) => ipcRenderer.invoke("file-exists", filePath),

  // Autosave operations
  writeAutosaveFile: (filename, content) =>
    ipcRenderer.invoke("write-autosave-file", filename, content),
  getAutosavePath: () => ipcRenderer.invoke("get-autosave-path"),

  // App operations
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  closeApp: () => ipcRenderer.invoke("close-app"),

  // Platform info
  platform: process.platform,
  isElectron: true,
});
