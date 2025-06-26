import { ipcMain, app } from "electron"; // Added app
import { spawn } from "child_process"; // Changed from exec to spawn

const runningProcesses = []; // To store references to spawned processes

const startProcess = (command, args, options, serviceName) => {
  const process = spawn(command, args, options);
  runningProcesses.push(process);

  process.stdout.on("data", (data) => {
    console.log(`${serviceName} stdout: ${data}`);
    // Here you could potentially send data to the renderer process
    // e.g., mainWindow.webContents.send('service-log', { serviceName, data: data.toString() });
  });

  process.stderr.on("data", (data) => {
    console.error(`${serviceName} stderr: ${data}`);
    // mainWindow.webContents.send('service-error', { serviceName, data: data.toString() });
  });

  process.on("close", (code) => {
    console.log(`${serviceName} exited with code ${code}`);
    // Remove the process from the list when it closes
    const index = runningProcesses.indexOf(process);
    if (index > -1) {
      runningProcesses.splice(index, 1);
    }
  });

  process.on("error", (err) => {
    console.error(`Failed to start ${serviceName}:`, err);
  });

  return process;
};

ipcMain.handle("services:start", async () => {
  try {
    // For .bat files, we typically use cmd.exe
    // The 'start' command in 'start startAll.bat' is a cmd.exe internal command.
    // To make it work with spawn, we need to call cmd.exe with /c flag.
    // 'start' in cmd also detaches the new process by default.
    // If you want to keep them attached to see output directly or manage them,
    // you might need to call the underlying commands of the .bat files directly if possible,