/**
 * MapService - Handles loading and validation of map data
 * Supports both legacy (mapData at root) and new format (grid.mapData)
 */
class MapService {
  /**
   * Load maps index from the public folder
   * @returns {Promise<Object>} Maps index with categories and maps array
   */
  static async loadMapsIndex() {
    try {
      const response = await fetch("/maps/index.json");
      if (!response.ok) {
        throw new Error(`Failed to load maps index: ${response.status}`);
      }
      const data = await response.json();

      // Extract unique categories from maps
      const categories = [...new Set(data.maps.map((map) => map.category))].map(
        (category, index) => ({
          id: category.toLowerCase().replace(/\s+/g, "-"),
          name: category,
        })
      );

      return {
        maps: data.maps,
        categories,
      };
    } catch (error) {
      console.error("Error loading maps index:", error);
      throw error;
    }
  }

  /**
   * Load a single map file
   * @param {string} mapPath - Path to the map file (e.g., "/maps/carjan-map01.json")
   * @returns {Promise<Object>} Map data object
   */
  static async loadMap(mapPath) {
    try {
      // Ensure path starts with /
      if (!mapPath.startsWith("/")) {
        mapPath = "/" + mapPath;
      }

      console.log("Loading map from path:", mapPath);

      const response = await fetch(mapPath);
      if (!response.ok) {
        throw new Error(
          `Failed to load map: ${response.status} ${response.statusText}`
        );
      }

      const mapData = await response.json();
      console.log("Loaded map data:", mapData);

      // Validate and return the map data
      this.validateMapData(mapData);
      return mapData;
    } catch (error) {
      console.error("Error loading map:", error);
      throw error;
    }
  }

  /**
   * Validate map data structure
   * @param {Object} mapData - Map data to validate
   * @throws {Error} If map data is invalid
   */
  static validateMapData(mapData) {
    if (!mapData) {
      throw new Error("Map data is null or undefined");
    }

    // Check for new format (grid.mapData)
    if (mapData.grid && mapData.grid.mapData) {
      if (!Array.isArray(mapData.grid.mapData)) {
        throw new Error("Map data grid.mapData must be an array");
      }
      if (!mapData.grid.dimensions) {
        throw new Error("Map data missing grid.dimensions");
      }
      return; // Valid new format
    }

    // Check for legacy format (mapData at root)
    if (mapData.mapData) {
      if (!Array.isArray(mapData.mapData)) {
        throw new Error("Map data mapData must be an array");
      }
      return; // Valid legacy format
    }

    // Neither format found
    throw new Error("Map data missing required field: mapData or grid.mapData");
  }

  /**
   * Extract map data array from either format
   * @param {Object} mapData - Map data object
   * @returns {Array} 2D array of map cells
   */
  static getMapData(mapData) {
    if (!mapData) return null;

    // Try new format first (grid.mapData)
    if (mapData.grid && mapData.grid.mapData) {
      return mapData.grid.mapData;
    }

    // Try legacy format (mapData at root)
    if (mapData.mapData) {
      return mapData.mapData;
    }

    return null;
  }

  /**
   * Extract map dimensions from either format
   * @param {Object} mapData - Map data object
   * @returns {Object} {rows, cols} dimensions
   */
  static getMapDimensions(mapData) {
    if (!mapData) return { rows: 12, cols: 8 }; // Default

    // Try new format first (grid.dimensions)
    if (mapData.grid && mapData.grid.dimensions) {
      return {
        rows: mapData.grid.dimensions.rows,
        cols: mapData.grid.dimensions.cols,
      };
    }

    // Try legacy format (size at root)
    if (mapData.size) {
      return {
        rows: mapData.size.rows,
        cols: mapData.size.cols,
      };
    }

    // Try to infer from map data
    const gridData = this.getMapData(mapData);
    if (gridData && Array.isArray(gridData)) {
      return {
        rows: gridData.length,
        cols: gridData[0] ? gridData[0].length : 8,
      };
    }

    // Default fallback
    return { rows: 12, cols: 8 };
  }

  /**
   * Convert map cell type to display format
   * @param {string} cellType - Cell type from map data (r, s, v, etc.)
   * @returns {Object} Cell display properties
   */
  static getCellDisplayInfo(cellType) {
    const cellMap = {
      r: { type: "road", color: "#6B9BD9", name: "Road" },
      s: { type: "sidewalk", color: "#95A5C6", name: "Sidewalk" },
      p: { type: "sidewalk", color: "#95A5C6", name: "Path" },
      v: { type: "void", color: "#1a1a1a", name: "Void" },
    };

    return cellMap[cellType] || cellMap["v"];
  }

  /**
   * Create a preview grid from map data
   * @param {Object} mapData - Map data object
   * @returns {Array} 2D array with cell display info
   */
  static createPreviewGrid(mapData) {
    const gridData = this.getMapData(mapData);
    if (!gridData) return [];

    return gridData.map((row) =>
      row.map((cellType) => ({
        ...this.getCellDisplayInfo(cellType),
        original: cellType,
      }))
    );
  }
}

export default MapService;
