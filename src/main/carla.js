import { ipcMain, dialog } from "electron";
import Store from "electron-store";
import { spawn } from "child_process";
const store = new Store();

let carlaProcess = null;

ipcMain.handle("carla:selectPath", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "Executable", extensions: ["exe"] }],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    store.set("carla.path", filePath);
    return filePath;
  }

  return null;
});

ipcMain.handle("carla:getPath", () => {
  return store.get("carla.path", null);
});

ipcMain.handle("carla:start", () => {
  const path = store.get("carla.path");
  if (!path) return false;

  if (!carlaProcess) {
    carlaProcess = spawn(path, [], { detached: true });
    return true;
  }

  return false;
});
