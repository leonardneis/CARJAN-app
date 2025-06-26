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

  // App info
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
});
