import { defineStore } from "pinia";
import { watch, nextTick } from "vue";

export const useScenarioStore = defineStore("scenario", {
  state: () => ({
    // Scenario metadata
    metadata: {
      name: "Untitled Scenario",
      version: "1.0.0",
      created: new Date(),
      modified: new Date(),
      author: null,
      description: null,
    },

    // Auto-save settings
    autoSave: {
      enabled: true,
      localStorageInterval: 0, // Immediate LocalStorage save
      fileInterval: 30000, // 30 seconds for JSON file save
      lastLocalSaved: null,
      lastFileSaved: null,
      isDirty: false,
      isFileDirty: false, // Separate flag for file-based saves
      isInProgress: false,
      timerId: null,
      fileTimerId: null,
    },

    // Live streaming settings
    liveStreaming: {
      enabled: false,
      endpoint: null,
      connected: false,
    },

    // File management
    currentFile: {
      path: null,
      saved: true,
      scenarioId: null,
    },

    // Export/Import settings
    exportFormat: "json", // json, carla-python

    // Recent files
    recentFiles: [],
  }),

  getters: {
    isUnsaved: (state) => state.autoSave.isDirty || !state.currentFile.saved,

    isFileUnsaved: (state) => state.autoSave.isFileDirty,

    scenarioData: (state) => {
      // This will be populated by combining data from gridStore
      return null; // Will be implemented after gridStore integration
    },

    exportFileName: (state) => {
      const name = state.metadata.name.replace(/[^a-zA-Z0-9]/g, "_");
      const timestamp = new Date().toISOString().split("T")[0];
      return `${name}_${timestamp}.json`;
    },
  },

  actions: {
    // Initialize scenario store
    initialize(notificationCallback = null) {
      this.setupAutoSave(notificationCallback);
      this.setupChangeTracking();

      // Initialize as saved state if no previous state exists
      if (this.currentFile.saved === undefined) {
        this.currentFile.saved = true;
        this.autoSave.isDirty = false;
        console.log("Scenario initialized in saved state");
      }
    },

    // Setup auto-save mechanism
    setupAutoSave(notificationCallback = null) {
      if (this.autoSave.enabled) {
        // Store notification callback for file autosave success
        this.autoSave.notificationCallback = notificationCallback;

        // Clear any existing timers
        if (this.autoSave.timerId) {
          clearInterval(this.autoSave.timerId);
          this.autoSave.timerId = null;
        }
        if (this.autoSave.fileTimerId) {
          clearInterval(this.autoSave.fileTimerId);
          this.autoSave.fileTimerId = null;
        }

        // Setup periodic file-based autosave (30s)
        this.autoSave.fileTimerId = setInterval(() => {
          if (this.autoSave.isFileDirty && !this.autoSave.isInProgress) {
            console.log("Performing scheduled file autosave...");
            this.performFileAutoSave(this.autoSave.notificationCallback);
          }
        }, this.autoSave.fileInterval);

        console.log(
          "Autosave system initialized - LocalStorage immediate, File every 30s"
        );
      }
    },

    // Setup change tracking for auto-save
    setupChangeTracking() {
      // Will be implemented to watch gridStore changes
    },

    // Mark scenario as dirty (needs saving)
    markDirty() {
      if (!this.autoSave.isDirty) {
        console.log(
          "Scenario marked as dirty - changes detected, triggering immediate LocalStorage autosave"
        );
        this.autoSave.isDirty = true;
        this.autoSave.isFileDirty = true; // Also mark for file save
        this.currentFile.saved = false;
        this.metadata.modified = new Date();

        // Trigger immediate LocalStorage autosave if enabled
        if (this.autoSave.enabled && !this.autoSave.isInProgress) {
          this.performLocalStorageAutoSave();
        }
      }
    },

    // Create new scenario
    newScenario(name = "New Scenario") {
      this.metadata = {
        name,
        version: "1.0.0",
        created: new Date(),
        modified: new Date(),
        author: null,
        description: null,
      };

      this.currentFile = {
        path: null,
        saved: true, // Start as saved until real changes are made
      };

      // Reset dirty state for new scenario
      this.autoSave.isDirty = false;
      console.log("New scenario created in saved state");
    },

    // Save scenario
    async saveScenario(filePath = null) {
      try {
        const scenarioData = this.buildScenarioData();

        if (filePath) {
          await this.saveToFile(filePath, scenarioData);
          this.currentFile.path = filePath;
        } else {
          await this.autoSaveToLocal(scenarioData);
        }

        this.autoSave.isDirty = false;
        this.autoSave.lastSaved = new Date();
        this.currentFile.saved = true;

        return true;
      } catch (error) {
        console.error("Failed to save scenario:", error);
        return false;
      }
    },

    // Load scenario
    async loadScenario(filePath) {
      try {
        const scenarioData = await this.loadFromFile(filePath);
        this.applyScenarioData(scenarioData);

        this.currentFile = {
          path: filePath,
          saved: true,
        };

        this.autoSave.isDirty = false;

        return true;
      } catch (error) {
        console.error("Failed to load scenario:", error);
        return false;
      }
    },

    // Export scenario in different formats
    async exportScenario(format = "json") {
      const scenarioData = this.buildScenarioData();

      switch (format) {
        case "json":
          return this.exportAsJSON(scenarioData);
        case "carla-python":
          return this.exportAsPython(scenarioData);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    },

    // Build complete scenario data from stores
    async buildScenarioData() {
      try {
        const { useGridStore } = await import("./grid.js");
        const gridStore = useGridStore();

        const scenarioData = {
          metadata: { ...this.metadata },
          environment: {
            weather: gridStore.weather || "Clear",
            category: gridStore.category || "Urban",
            cameraPosition: gridStore.cameraPosition || "up",
          },
          entities: gridStore.entities || [],
          waypoints: gridStore.waypoints || [],
          paths: gridStore.paths || [],
          dboxes: gridStore.dboxes || [],
        };

        console.log("Built scenario data for autosave:", scenarioData);
        return scenarioData;
      } catch (error) {
        console.error("Error building scenario data:", error);
        return {
          metadata: { ...this.metadata },
          environment: {
            weather: "Clear",
            category: "Urban",
            cameraPosition: "up",
          },
          entities: [],
          waypoints: [],
          paths: [],
          dboxes: [],
        };
      }
    },

    // Apply loaded scenario data to stores
    applyScenarioData(scenarioData) {
      // Update metadata
      this.metadata = { ...scenarioData.metadata };

      // Apply to gridStore
      const { useGridStore } = require("./grid.js");
      const gridStore = useGridStore();
      gridStore.loadScenarioData(scenarioData);
    },

    // Save scenario using file manager
    async saveScenarioAs() {
      const { fileManager } = await import("../services/fileManager.js");
      const scenarioData = await this.buildScenarioData();

      const result = await fileManager.saveScenarioAs(
        scenarioData,
        this.metadata.name
      );

      if (result.success) {
        this.currentFile.path = result.filePath;
        this.currentFile.saved = true;
        this.autoSave.isDirty = false;
        this.autoSave.lastSaved = new Date();
      }

      return result;
    },

    // Load scenario using file manager
    async loadScenarioFile() {
      const { fileManager } = await import("../services/fileManager.js");

      const result = await fileManager.openScenario();

      if (result.success) {
        this.applyScenarioData(result.data);
        this.currentFile.path = result.filePath;
        this.currentFile.saved = true;
        this.autoSave.isDirty = false;
      }

      return result;
    },

    // Export scenario in various formats
    async exportScenarioAs(format = "json") {
      const { fileManager } = await import("../services/fileManager.js");
      const scenarioData = this.buildScenarioData();

      return await fileManager.exportScenario(scenarioData, format);
    },

    // Auto-save current scenario to LocalStorage (immediate)
    async performLocalStorageAutoSave() {
      if (this.autoSave.isInProgress) return false; // Prevent concurrent saves

      this.autoSave.isInProgress = true;
      console.log("Starting immediate LocalStorage autosave...");

      try {
        const scenarioData = await this.buildScenarioData();

        // Use ScenarioStorageService for autosave
        const { default: ScenarioStorageService } = await import(
          "../services/ScenarioStorageService.js"
        );
        const storageService = new ScenarioStorageService();

        // Generate a scenario ID if we don't have one yet
        let scenarioId = this.currentFile.scenarioId;
        if (!scenarioId) {
          scenarioId = `autosave_${Date.now()}`;
          this.currentFile.scenarioId = scenarioId;
        }

        // Save as autosave
        const success = storageService.saveAutosave(scenarioId, scenarioData);

        if (success) {
          this.autoSave.lastLocalSaved = new Date();
          this.autoSave.isDirty = false;
          this.currentFile.saved = true; // Mark UI as saved
          console.log("LocalStorage autosave completed successfully");
        }

        return success;
      } catch (error) {
        console.error("LocalStorage autosave failed:", error);
        return false;
      } finally {
        // Reduced delay for debugging (1s instead of 1.6s)
        setTimeout(() => {
          this.autoSave.isInProgress = false;
        }, 1000);
      }
    },

    // Auto-save current scenario to JSON file (periodic)
    async performFileAutoSave(onSuccessCallback = null) {
      console.log("Starting file-based autosave...");

      // Check if we're in Electron environment
      const isElectron = !!(
        window.electronAPI && window.electronAPI.isElectron
      );
      console.log("Electron API status:", {
        electronAPI: !!window.electronAPI,
        writeAutosaveFile: !!(
          window.electronAPI && window.electronAPI.writeAutosaveFile
        ),
        isElectron: isElectron,
        userAgent: navigator.userAgent.includes("Electron"),
      });

      try {
        const scenarioData = await this.buildScenarioData();

        // Save to JSON file using Electron's file system
        if (isElectron && window.electronAPI.writeAutosaveFile) {
          console.log("Using Electron file autosave...");

          // Generate filename with timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const scenarioName = (this.metadata.name || "scenario").replace(
            /[^a-zA-Z0-9]/g,
            "_"
          );
          const filename = `autosave_${scenarioName}_${timestamp}.json`;

          try {
            const result = await window.electronAPI.writeAutosaveFile(
              filename,
              JSON.stringify(scenarioData, null, 2)
            );

            if (result && result.success) {
              this.autoSave.lastFileSaved = new Date();
              this.autoSave.isFileDirty = false;
              console.log(`File autosave completed: ${result.filePath}`);

              // Call success callback if provided (for toast notifications)
              if (onSuccessCallback) {
                onSuccessCallback(result.filePath);
              }

              return { success: true, filePath: result.filePath };
            } else {
              console.error(
                "File autosave failed:",
                result?.error || "Unknown error"
              );
              return {
                success: false,
                error: result?.error || "Unknown error",
              };
            }
          } catch (electronError) {
            console.error("Electron file autosave error:", electronError);
            // Fall back to browser download
            this.performBrowserDownloadFallback(
              scenarioData,
              onSuccessCallback
            );
            return { success: true, method: "download_fallback" };
          }
        } else {
          console.log(
            "Electron API not available or not in Electron environment, falling back to browser download..."
          );
          return this.performBrowserDownloadFallback(
            scenarioData,
            onSuccessCallback
          );
        }
      } catch (error) {
        console.error("File autosave failed:", error);
        return { success: false, error: error.message };
      }
    },

    // Fallback method for browser download
    performBrowserDownloadFallback(scenarioData, onSuccessCallback) {
      try {
        this.downloadAsFile(scenarioData, `autosave_${Date.now()}.json`);
        this.autoSave.lastFileSaved = new Date();
        this.autoSave.isFileDirty = false;
        console.log("File autosave completed via browser download");

        // Call success callback if provided
        if (onSuccessCallback) {
          onSuccessCallback("Download");
        }

        return { success: true, method: "download" };
      } catch (downloadError) {
        console.error("Browser download fallback failed:", downloadError);
        return { success: false, error: downloadError.message };
      }
    },

    // Legacy method (backward compatibility)
    async performAutoSave() {
      return this.performLocalStorageAutoSave();
    },

    // Auto-save to local storage
    async autoSaveToLocal(data) {
      const key = `carjan_autosave_${this.metadata.name}`;
      localStorage.setItem(key, JSON.stringify(data));
    },

    // Download as file (web fallback)
    downloadAsFile(data, fileName) {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || this.exportFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    // Export as JSON
    exportAsJSON(scenarioData) {
      return {
        format: "json",
        data: scenarioData,
        fileName: this.exportFileName,
      };
    },

    // Export as Python script for CARLA
    exportAsPython(scenarioData) {
      const pythonScript = this.generatePythonScript(scenarioData);
      return {
        format: "python",
        data: pythonScript,
        fileName: this.exportFileName.replace(".json", ".py"),
      };
    },

    // Generate Python script for CARLA
    generatePythonScript(scenarioData) {
      return `#!/usr/bin/env python3
"""
CARLA Scenario: ${scenarioData.metadata.name}
Generated by CARJAN-app on ${new Date().toISOString()}
"""

import carla
import random
import time

def setup_scenario():
    # Connect to CARLA server
    client = carla.Client('localhost', 2000)
    client.set_timeout(10.0)
    
    # Load world
    world = client.get_world()
    
    # TODO: Implement scenario setup based on data
    # Scenario data: ${JSON.stringify(scenarioData, null, 4)}
    
    return world

if __name__ == "__main__":
    world = setup_scenario()
    print("Scenario loaded successfully!")
`;
    },

    // Live streaming methods
    async enableLiveStreaming(endpoint = "ws://localhost:8765") {
      const { liveStreaming } = await import("../services/liveStreaming.js");

      try {
        await liveStreaming.connect(endpoint);

        this.liveStreaming.enabled = true;
        this.liveStreaming.endpoint = endpoint;
        this.liveStreaming.connected = true;

        // Setup event listeners
        liveStreaming.on("connected", () => {
          this.liveStreaming.connected = true;
          // Send current scenario to CARLA
          liveStreaming.sendCompleteScenario(this.buildScenarioData());
        });

        liveStreaming.on("disconnected", () => {
          this.liveStreaming.connected = false;
        });

        liveStreaming.on("error", (error) => {
          console.error("CARLA streaming error:", error);
          this.liveStreaming.connected = false;
        });

        return true;
      } catch (error) {
        console.error("Failed to enable live streaming:", error);
        this.liveStreaming.enabled = false;
        this.liveStreaming.connected = false;
        throw error;
      }
    },

    async disableLiveStreaming() {
      const { liveStreaming } = await import("../services/liveStreaming.js");

      await liveStreaming.disconnect();
      this.liveStreaming.enabled = false;
      this.liveStreaming.connected = false;
    },

    async streamChange(changeType, data) {
      if (this.liveStreaming.enabled && this.liveStreaming.connected) {
        const { liveStreaming } = await import("../services/liveStreaming.js");
        liveStreaming.streamScenarioChange(changeType, data);
      }
    },

    // Load scenario data from object
    async loadScenarioData(scenarioData) {
      try {
        // Update metadata
        if (scenarioData.metadata) {
          this.metadata = {
            ...this.metadata,
            ...scenarioData.metadata,
          };
        }

        // Get grid store to update grid data
        const { useGridStore } = await import("./grid.js");
        const gridStore = useGridStore();

        // Update grid data
        if (scenarioData.grid) {
          gridStore.setGridData(scenarioData.grid);
        }

        // Update environment
        if (scenarioData.environment) {
          gridStore.setEnvironment(scenarioData.environment);
        }

        // Update entities
        if (scenarioData.entities) {
          gridStore.setEntities(scenarioData.entities);
        }

        // Update paths
        if (scenarioData.paths) {
          gridStore.setPaths(scenarioData.paths);
        }

        // Update waypoints
        if (scenarioData.waypoints) {
          gridStore.setWaypoints(scenarioData.waypoints);
        }

        // Update settings
        if (scenarioData.settings) {
          gridStore.updateSettings(scenarioData.settings);
        }

        // Mark as clean since we just loaded
        this.autoSave.isDirty = false;
        this.currentFile.saved = true;

        return true;
      } catch (error) {
        console.error("Failed to load scenario data:", error);
        return false;
      }
    },

    // Cleanup method for autosave timers
    cleanup() {
      if (this.autoSave.timerId) {
        clearInterval(this.autoSave.timerId);
        this.autoSave.timerId = null;
        console.log("LocalStorage autosave timer cleared");
      }
      if (this.autoSave.fileTimerId) {
        clearInterval(this.autoSave.fileTimerId);
        this.autoSave.fileTimerId = null;
        console.log("File autosave timer cleared");
      }
    },
  },
});
