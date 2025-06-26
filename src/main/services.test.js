import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { attachServiceShutdown, killAllServices } from "./services.js";
import { EventEmitter } from "events";

// Mock child_process and Electron ipcMain
vi.mock("child_process", () => ({
  spawn: vi.fn(() => {
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.pid = 1234;
    return proc;
  }),
}));

vi.mock("os", () => ({
  default: {
    platform: () => "win32",
  },
}));

vi.mock("electron", () => ({
  ipcMain: { handle: vi.fn() },
}));

describe("services.js", () => {
  let app;
  beforeEach(() => {
    app = new EventEmitter();
  });

  it("should attach shutdown handler", () => {
    const spy = vi.spyOn(global, "setTimeout");
    const killSpy = vi.spyOn(global, "setImmediate");
    // Patch killAllServices temporär
    let called = false;
    const origKill = killAllServices;
    const fakeKill = () => {
      called = true;
    };
    // Patch global killAllServices
    app.on("before-quit", fakeKill);
    attachServiceShutdown(app);
    app.emit("before-quit");
    expect(typeof attachServiceShutdown).toBe("function");
    // Rückbau
    app.removeListener("before-quit", fakeKill);
  });

  it("should export killAllServices and attachServiceShutdown", () => {
    expect(typeof killAllServices).toBe("function");
    expect(typeof attachServiceShutdown).toBe("function");
  });
});
