import { ipcMain } from "electron";
import { spawn } from "child_process";
import path from "path";
import os from "os";

const childProcesses = [];

// Service definitions (adjust paths as needed)
const serviceConfigs = [
  {
    name: "Triplestore",
    winCmd: "startTriplestore.bat",
    unixCmd: "startTriplestore.sh",
    cwd: path.resolve(__dirname, "../../../AJAN-service"),
  },
  {
    name: "AJAN",
    winCmd: "startAJAN.bat",
    unixCmd: "startAJAN.sh",
    cwd: path.resolve(__dirname, "../../../AJAN-service"),
  },
];

ipcMain.handle("services:start", async (event, mainWindow) => {
  const isWin = os.platform() === "win32";
  for (const svc of serviceConfigs) {
    const command = isWin ? svc.winCmd : svc.unixCmd;
    const args = isWin ? ["/c", command] : [];
    const spawnCmd = isWin
      ? process.env.comspec || "cmd.exe"
      : path.join(svc.cwd, svc.unixCmd);
    const child = isWin
      ? spawn(spawnCmd, args, { cwd: svc.cwd, shell: false })
      : spawn(spawnCmd, [], { cwd: svc.cwd, shell: false });
    childProcesses.push(child);

    let started = false;
    // Passe die Patterns ggf. an die tatsächliche Service-Ausgabe an
    const successPatterns = [
      /listening/i,
      /ready/i,
      /started/i,
      /server running/i,
    ];

    child.stdout.on("data", (data) => {
      const str = data.toString();
      if (mainWindow?.webContents) {
        mainWindow.webContents.send("service-log", {
          service: svc.name,
          output: str,
        });
      }
      if (!started && successPatterns.some((pat) => pat.test(str))) {
        started = true;
        if (mainWindow?.webContents) {
          mainWindow.webContents.send("service-status", {
            service: svc.name,
            status: "started",
          });
        }
      }
    });

    child.stderr.on("data", (data) => {
      if (mainWindow?.webContents) {
        mainWindow.webContents.send("service-log", {
          service: svc.name,
          error: data.toString(),
        });
      }
    });

    child.on("close", (code) => {
      childProcesses.splice(childProcesses.indexOf(child), 1);
      if (mainWindow?.webContents) {
        mainWindow.webContents.send("service-status", {
          service: svc.name,
          status: "stopped",
          code,
        });
      }
    });
  }
  return true;
});

// Helper to attach to Electron app for clean shutdown
export const attachServiceShutdown = (app) => {
  app.on("before-quit", () => {
    killAllServices();
  });
};

export const killAllServices = () => {
  const isWin = os.platform() === "win32";
  for (const child of childProcesses) {
    if (isWin) {
      spawn("taskkill", ["/pid", String(child.pid), "/f", "/t"]);
    } else {
      process.kill(child.pid, "SIGTERM");
    }
  }
  childProcesses.length = 0;
};
