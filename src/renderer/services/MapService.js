/**
 * Map Management Service
 * Handles loading, parsing, and validation of map files
 */

export class MapService {
  static async loadMapsIndex() {
    try {
      const response = await fetch("/maps/index.json");
      if (!response.ok) {
        throw new Error(`Failed to load maps index: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error loading maps index:", error);
      throw error;
    }
  }

  static async loadMap(mapFile) {
    try {
      const response = await fetch(mapFile);
      if (!response.ok) {
        throw new Error(`Failed to load map: ${response.statusText}`);
      }
      const mapData = await response.json();

      // Validate map data
      this.validateMapData(mapData);

      return mapData;
    } catch (error) {
      console.error("Error loading map:", error);
      throw error;
    }
  }

  static validateMapData(mapData) {
    // Required fields
    const requiredFields = ["id", "name", "mapData"];
    for (const field of requiredFields) {
      if (!mapData[field]) {
        throw new Error(`Map data missing required field: ${field}`);
      }
    }

    // Validate map grid
    if (!Array.isArray(mapData.mapData)) {
      throw new Error("Map data must be a 2D array");
    }

    // Check for consistent row lengths
    const firstRowLength = mapData.mapData[0]?.length;
    for (let i = 0; i < mapData.mapData.length; i++) {
      if (mapData.mapData[i].length !== firstRowLength) {
        throw new Error(`Inconsistent row length at row ${i}`);
      }
    }

    // Validate cell types
    const validCellTypes = ["v", "r", "p"];
    for (let row = 0; row < mapData.mapData.length; row++) {
      for (let col = 0; col < mapData.mapData[row].length; col++) {
        const cellType = mapData.mapData[row][col];
        if (!validCellTypes.includes(cellType)) {
          throw new Error(
            `Invalid cell type "${cellType}" at row ${row}, col ${col}`
          );
        }
      }
    }

    return true;
  }

  static generateMapPreview(mapData, maxRows = 6, maxCols = 4) {
    if (!mapData || !Array.isArray(mapData)) {
      return Array(maxRows)
        .fill()
        .map(() => Array(maxCols).fill("v"));
    }

    return mapData.slice(0, maxRows).map((row) => row.slice(0, maxCols));
  }

  static getMapStatistics(mapData) {
    if (!mapData || !Array.isArray(mapData)) {
      return { roads: 0, paths: 0, voids: 0, total: 0 };
    }

    let roads = 0,
      paths = 0,
      voids = 0;

    for (const row of mapData) {
      for (const cell of row) {
        switch (cell) {
          case "r":
            roads++;
            break;
          case "p":
            paths++;
            break;
          case "v":
            voids++;
            break;
        }
      }
    }

    return {
      roads,
      paths,
      voids,
      total: roads + paths + voids,
      roadPercentage: Math.round((roads / (roads + paths + voids)) * 100),
      pathPercentage: Math.round((paths / (roads + paths + voids)) * 100),
      voidPercentage: Math.round((voids / (roads + paths + voids)) * 100),
    };
  }

  static getCellTypeColor(cellType) {
    const colorMap = {
      v: "#333333", // void
      r: "#4CAF50", // road
      p: "#2196F3", // path
    };
    return colorMap[cellType] || "#333333";
  }

  static exportMapToJSON(mapData) {
    return JSON.stringify(mapData, null, 2);
  }

  static async importMapFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const mapData = JSON.parse(event.target.result);
          this.validateMapData(mapData);
          resolve(mapData);
        } catch (error) {
          reject(new Error(`Invalid map file: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  }
}

export default MapService;
