/**
 * Map Thumbnail Generator Utility
 *
 * This utility provides functions to generate thumbnails for maps
 * that match the styling of CarjanGrid.vue component.
 */

const {
  generateMapThumbnail,
  generateAllThumbnails,
  generateThumbnail,
  COLORS,
} = require("./generateThumbnails.cjs");
const {
  generatePNGThumbnail,
  generateAllPNGThumbnails,
  generatePNGThumbnailForMap,
  generateScenarioThumbnail,
} = require("./generatePNGThumbnails.cjs");
const fs = require("fs");
const path = require("path");

/**
 * Service class for map thumbnail generation
 */
class ThumbnailService {
  constructor() {
    this.colors = COLORS;
    this.defaultSize = { width: 200, height: 150 };
  }

  /**
   * Generate thumbnail for a map object
   * @param {Object} mapData - Map data object
   * @param {Object} options - Generation options
   * @returns {string} SVG content
   */
  generateFromMapData(mapData, options = {}) {
    const { width = this.defaultSize.width, height = this.defaultSize.height } =
      options;
    return generateMapThumbnail(mapData, width, height);
  }

  /**
   * Generate thumbnail for a specific map ID
   * @param {string} mapId - Map ID
   * @returns {string} Path to generated thumbnail
   */
  generateForMap(mapId) {
    return generateThumbnail(mapId);
  }

  /**
   * Generate thumbnails for all maps
   */
  generateAll() {
    return generateAllThumbnails();
  }

  /**
   * Generate PNG thumbnail for a map object (high quality)
   * @param {Object} mapData - Map data object
   * @param {Object} options - Generation options
   * @returns {Buffer} PNG image buffer
   */
  generatePNGFromMapData(mapData, options = {}) {
    const { width = 400, height = 300 } = options;
    return generatePNGThumbnail(mapData, width, height);
  }

  /**
   * Generate PNG thumbnail for a specific map ID
   * @param {string} mapId - Map ID
   * @param {Object} options - Generation options
   * @returns {string} Path to generated thumbnail
   */
  generatePNGForMap(mapId, options = {}) {
    return generatePNGThumbnailForMap(mapId, options);
  }

  /**
   * Generate PNG thumbnails for all maps
   */
  generateAllPNG() {
    return generateAllPNGThumbnails();
  }

  /**
   * Generate PNG thumbnail with scenario data (entities, waypoints, paths)
   * @param {Object} mapData - Map data
   * @param {Object} scenarioData - Scenario data
   * @param {Object} options - Generation options
   * @returns {Buffer} PNG image buffer
   */
  generateScenarioPNG(mapData, scenarioData, options = {}) {
    const { width = 400, height = 300 } = options;
    return generateScenarioThumbnail(mapData, scenarioData, width, height);
  }

  /**
   * Get color for a cell type
   * @param {string} cellType - Cell type identifier (v, r, s)
   * @returns {string} Hex color code
   */
  getCellColor(cellType) {
    return this.colors[cellType] || this.colors.v;
  }

  /**
   * Validate map data structure
   * @param {Object} mapData - Map data to validate
   * @returns {boolean} True if valid
   */
  validateMapData(mapData) {
    if (!mapData || !mapData.grid) return false;
    if (!mapData.grid.dimensions || !mapData.grid.mapData) return false;

    const { rows, cols } = mapData.grid.dimensions;
    const { mapData: gridData } = mapData.grid;

    if (gridData.length !== rows) return false;

    for (const row of gridData) {
      if (row.length !== cols) return false;
      for (const cell of row) {
        if (!["v", "r", "s"].includes(cell)) {
          console.warn(`Unknown cell type: ${cell}`);
        }
      }
    }

    return true;
  }

  /**
   * Get supported cell types and their descriptions
   * @returns {Object} Cell type definitions
   */
  getCellTypeDefinitions() {
    return {
      v: {
        name: "Void",
        color: this.colors.v,
        description: "Non-traversable void area",
        traversable: false,
      },
      r: {
        name: "Road",
        color: this.colors.r,
        description: "Drivable road surface",
        traversable: true,
      },
      s: {
        name: "Sidewalk",
        color: this.colors.s,
        description: "Walkable sidewalk area",
        traversable: true,
      },
    };
  }
}

// Export singleton instance
module.exports = new ThumbnailService();
