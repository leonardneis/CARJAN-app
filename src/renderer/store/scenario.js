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
      interval: 5000, // 5 seconds
      lastSaved: null,
      isDirty: false,
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
    },

    // Export/Import settings
    exportFormat: "json", // json, carla-python

    // Recent files
    recentFiles: [],
  }),

  getters: {
    isUnsaved: (state) => state.autoSave.isDirty || !state.currentFile.saved,

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
    initialize() {
      this.setupAutoSave();
      this.setupChangeTracking();
    },

    // Setup auto-save mechanism
    setupAutoSave() {
      if (this.autoSave.enabled) {
        setInterval(() => {
          if (this.autoSave.isDirty) {
            this.performAutoSave();
          }
        }, this.autoSave.interval);
      }
    },

    // Setup change tracking for auto-save
    setupChangeTracking() {
      // Will be implemented to watch gridStore changes
    },

    // Mark scenario as dirty (needs saving)
    markDirty() {
      this.autoSave.isDirty = true;
      this.currentFile.saved = false;
      this.metadata.modified = new Date();
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
        saved: false,
      };

      this.markDirty();
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
    buildScenarioData() {
      const { useGridStore } = require("./grid.js");
      const gridStore = useGridStore();

      return {
        metadata: { ...this.metadata },
        ...gridStore.scenarioData,
      };
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
      const scenarioData = this.buildScenarioData();

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

    // Auto-save current scenario
    async performAutoSave() {
      const { fileManager } = await import("../services/fileManager.js");
      const scenarioData = this.buildScenarioData();

      if (this.currentFile.path) {
        // Save to existing file
        try {
          if (window.electronAPI) {
            await window.electronAPI.writeFile(
              this.currentFile.path,
              JSON.stringify(scenarioData, null, 2)
            );
          }
          this.autoSave.isDirty = false;
          this.autoSave.lastSaved = new Date();
          return true;
        } catch (error) {
          console.error("Auto-save to file failed:", error);
        }
      }

      // Fallback to localStorage
      const success = fileManager.autoSaveToLocal(
        scenarioData,
        `carjan_autosave_${this.metadata.name}`
      );
      if (success) {
        this.autoSave.lastSaved = new Date();
        this.autoSave.isDirty = false;
      }
      return success;
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
  },
});
