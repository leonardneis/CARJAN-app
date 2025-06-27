/**
 * ScenarioStorageService - Manages local scenario storage and metadata
 * Uses localStorage for simplicity but can be upgraded to SQLite later
 */
class ScenarioStorageService {
  constructor() {
    this.STORAGE_KEY = "carjan-scenarios";
    this.SCENARIO_DATA_PREFIX = "carjan-scenario-";
  }

  /**
   * Get all scenario metadata
   * @returns {Array} Array of scenario metadata objects
   */
  getAllScenarios() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading scenarios from storage:", error);
      return [];
    }
  }

  /**
   * Save scenario metadata index
   * @param {Array} scenarios - Array of scenario metadata
   */
  saveScenarioIndex(scenarios) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scenarios));
    } catch (error) {
      console.error("Error saving scenario index:", error);
      throw error;
    }
  }

  /**
   * Get full scenario data by ID
   * @param {string} scenarioId - Scenario ID
   * @returns {Object|null} Full scenario data or null if not found
   */
  getScenarioData(scenarioId) {
    try {
      const stored = localStorage.getItem(
        this.SCENARIO_DATA_PREFIX + scenarioId
      );
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`Error loading scenario data for ${scenarioId}:`, error);
      return null;
    }
  }

  /**
   * Save full scenario data
   * @param {string} scenarioId - Scenario ID
   * @param {Object} scenarioData - Full scenario data
   */
  saveScenarioData(scenarioId, scenarioData) {
    try {
      localStorage.setItem(
        this.SCENARIO_DATA_PREFIX + scenarioId,
        JSON.stringify(scenarioData)
      );
    } catch (error) {
      console.error(`Error saving scenario data for ${scenarioId}:`, error);
      throw error;
    }
  }

  /**
   * Delete scenario completely
   * @param {string} scenarioId - Scenario ID to delete
   */
  deleteScenario(scenarioId) {
    try {
      // Remove from index
      let scenarios = this.getAllScenarios();
      scenarios = scenarios.filter((s) => s.id !== scenarioId);
      this.saveScenarioIndex(scenarios);

      // Remove scenario data
      localStorage.removeItem(this.SCENARIO_DATA_PREFIX + scenarioId);

      return true;
    } catch (error) {
      console.error(`Error deleting scenario ${scenarioId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new scenario
   * @param {Object} scenarioMetadata - Basic scenario info (name, mapId, etc.)
   * @param {Object} scenarioData - Full scenario data (entities, paths, etc.)
   * @returns {string} The new scenario ID
   */
  createScenario(scenarioMetadata, scenarioData = null) {
    try {
      // Generate unique ID
      const scenarioId = this.generateScenarioId();

      // Default metadata
      const metadata = {
        id: scenarioId,
        name: scenarioMetadata.name || "Unnamed Scenario",
        description: scenarioMetadata.description || "",
        mapId: scenarioMetadata.mapId,
        mapName: scenarioMetadata.mapName || "",
        category: scenarioMetadata.category || "Custom",
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        entityCount: 0,
        thumbnailPath: this.generateThumbnailPath(scenarioId),
        ...scenarioMetadata,
      };

      // Default scenario data structure
      const defaultData = {
        id: scenarioId,
        name: metadata.name,
        mapId: metadata.mapId,
        entities: [],
        paths: [],
        waypoints: [],
        dboxes: [],
        settings: {
          weather: "Clear",
          category: metadata.category,
          cameraPosition: "up",
        },
        created: metadata.created,
        lastModified: metadata.lastModified,
        ...scenarioData,
      };

      // Update entity count
      metadata.entityCount = defaultData.entities.length;

      // Save to storage
      this.saveScenarioData(scenarioId, defaultData);

      // Add to index
      const scenarios = this.getAllScenarios();
      scenarios.push(metadata);
      this.saveScenarioIndex(scenarios);

      console.log(`Created new scenario: ${scenarioId}`);
      return scenarioId;
    } catch (error) {
      console.error("Error creating scenario:", error);
      throw error;
    }
  }

  /**
   * Update an existing scenario
   * @param {string} scenarioId - Scenario ID
   * @param {Object} scenarioData - Updated scenario data
   * @param {Object} metadataUpdates - Optional metadata updates
   */
  updateScenario(scenarioId, scenarioData, metadataUpdates = {}) {
    try {
      // Update scenario data
      const currentData = this.getScenarioData(scenarioId) || {};
      const updatedData = {
        ...currentData,
        ...scenarioData,
        lastModified: new Date().toISOString(),
      };
      this.saveScenarioData(scenarioId, updatedData);

      // Update metadata in index
      const scenarios = this.getAllScenarios();
      const scenarioIndex = scenarios.findIndex((s) => s.id === scenarioId);

      if (scenarioIndex !== -1) {
        scenarios[scenarioIndex] = {
          ...scenarios[scenarioIndex],
          ...metadataUpdates,
          lastModified: updatedData.lastModified,
          entityCount: updatedData.entities ? updatedData.entities.length : 0,
        };
        this.saveScenarioIndex(scenarios);
      }

      console.log(`Updated scenario: ${scenarioId}`);
      return true;
    } catch (error) {
      console.error(`Error updating scenario ${scenarioId}:`, error);
      throw error;
    }
  }

  /**
   * Duplicate a scenario
   * @param {string} sourceScenarioId - ID of scenario to duplicate
   * @param {string} newName - Name for the new scenario
   * @returns {string} ID of the new scenario
   */
  duplicateScenario(sourceScenarioId, newName = null) {
    try {
      // Get source data
      const sourceData = this.getScenarioData(sourceScenarioId);
      const scenarios = this.getAllScenarios();
      const sourceMetadata = scenarios.find((s) => s.id === sourceScenarioId);

      if (!sourceData || !sourceMetadata) {
        throw new Error(`Source scenario ${sourceScenarioId} not found`);
      }

      // Create duplicate
      const duplicateName = newName || `${sourceMetadata.name} (Copy)`;
      const duplicateId = this.createScenario(
        {
          ...sourceMetadata,
          name: duplicateName,
          description: sourceMetadata.description
            ? `Copy of: ${sourceMetadata.description}`
            : "",
        },
        {
          ...sourceData,
          name: duplicateName,
        }
      );

      console.log(`Duplicated scenario ${sourceScenarioId} to ${duplicateId}`);
      return duplicateId;
    } catch (error) {
      console.error(`Error duplicating scenario ${sourceScenarioId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a unique scenario ID
   * @returns {string} Unique scenario ID
   */
  generateScenarioId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `scenario-${timestamp}-${random}`;
  }

  /**
   * Generate thumbnail path for a scenario
   * @param {string} scenarioId - Scenario ID
   * @returns {string} Thumbnail path
   */
  generateThumbnailPath(scenarioId) {
    return `/scenarios/thumbnails/${scenarioId}.png`;
  }

  /**
   * Export scenario to JSON file
   * @param {string} scenarioId - Scenario ID to export
   * @returns {Object} Complete scenario export data
   */
  exportScenario(scenarioId) {
    try {
      const scenarios = this.getAllScenarios();
      const metadata = scenarios.find((s) => s.id === scenarioId);
      const data = this.getScenarioData(scenarioId);

      if (!metadata || !data) {
        throw new Error(`Scenario ${scenarioId} not found`);
      }

      return {
        metadata,
        data,
        exportedAt: new Date().toISOString(),
        version: "1.0",
      };
    } catch (error) {
      console.error(`Error exporting scenario ${scenarioId}:`, error);
      throw error;
    }
  }

  /**
   * Import scenario from JSON data
   * @param {Object} exportData - Exported scenario data
   * @param {boolean} generateNewId - Whether to generate a new ID
   * @returns {string} Imported scenario ID
   */
  importScenario(exportData, generateNewId = true) {
    try {
      const { metadata, data } = exportData;

      if (generateNewId || this.getScenarioData(metadata.id)) {
        // Generate new ID to avoid conflicts
        const newId = this.generateScenarioId();
        metadata.id = newId;
        data.id = newId;
        metadata.name = `${metadata.name} (Imported)`;
        data.name = metadata.name;
      }

      // Reset timestamps
      metadata.created = new Date().toISOString();
      metadata.lastModified = metadata.created;
      data.created = metadata.created;
      data.lastModified = metadata.lastModified;

      // Create scenario
      return this.createScenario(metadata, data);
    } catch (error) {
      console.error("Error importing scenario:", error);
      throw error;
    }
  }

  /**
   * Clear all scenarios (for development/reset)
   */
  clearAllScenarios() {
    try {
      const scenarios = this.getAllScenarios();
      scenarios.forEach((scenario) => {
        localStorage.removeItem(this.SCENARIO_DATA_PREFIX + scenario.id);
      });
      localStorage.removeItem(this.STORAGE_KEY);
      console.log("Cleared all scenarios");
    } catch (error) {
      console.error("Error clearing scenarios:", error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage usage info
   */
  getStorageStats() {
    try {
      const scenarios = this.getAllScenarios();
      let totalSize = 0;

      // Calculate total storage used
      scenarios.forEach((scenario) => {
        const data = localStorage.getItem(
          this.SCENARIO_DATA_PREFIX + scenario.id
        );
        if (data) {
          totalSize += data.length;
        }
      });

      return {
        scenarioCount: scenarios.length,
        totalSizeBytes: totalSize,
        totalSizeKB: Math.round(totalSize / 1024),
        scenarios: scenarios.map((s) => ({
          id: s.id,
          name: s.name,
          lastModified: s.lastModified,
          entityCount: s.entityCount,
        })),
      };
    } catch (error) {
      console.error("Error getting storage stats:", error);
      return {
        scenarioCount: 0,
        totalSizeBytes: 0,
        totalSizeKB: 0,
        scenarios: [],
      };
    }
  }
}

export default ScenarioStorageService;
