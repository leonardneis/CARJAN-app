const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

// Grid colors with better contrast and modern styling
const COLORS = {
  v: "#1a1a1a", // Void (dark charcoal)
  r: "#6B9BD9", // Road (clear blue)
  s: "#95A5C6", // Sidewalk (muted blue-gray)
  background: "#0f0f0f", // Grid background (very dark)
  gridLine: "#ffffff", // Grid lines (white for contrast)
  gridLineAlpha: 0.8, // Grid line opacity (more visible)
};

/**
 * Generates a high-quality PNG thumbnail that matches CarjanGrid.vue styling
 * @param {Object} mapData - The map data object
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Buffer} PNG image buffer
 */
function generatePNGThumbnail(mapData, width = 400, height = 300) {
  const grid = mapData.grid;
  const { rows, cols } = grid.dimensions;

  // Calculate cell size to ensure square cells
  const cellSize = Math.min(width / cols, height / rows);

  // Calculate actual canvas dimensions to fit square cells
  const actualWidth = cols * cellSize;
  const actualHeight = rows * cellSize;

  const canvas = createCanvas(actualWidth, actualHeight);
  const ctx = canvas.getContext("2d");

  const cellWidth = cellSize;
  const cellHeight = cellSize;

  // Fill background with black
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, actualWidth, actualHeight);

  // Draw grid cells
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellType = grid.mapData[row][col];
      const color = COLORS[cellType] || COLORS.v;
      const x = col * cellWidth;
      const y = row * cellHeight;

      // Fill cell with appropriate color
      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellWidth, cellHeight);
    }
  }

  // Draw prominent grid lines for better definition
  ctx.strokeStyle = COLORS.gridLine;
  ctx.globalAlpha = COLORS.gridLineAlpha;
  ctx.lineWidth = 1.5; // Thicker lines for better visibility

  // Vertical lines
  for (let i = 0; i <= cols; i++) {
    const x = i * cellWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, actualHeight);
    ctx.stroke();
  }

  // Horizontal lines
  for (let i = 0; i <= rows; i++) {
    const y = i * cellHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(actualWidth, y);
    ctx.stroke();
  }

  // Reset alpha for text
  ctx.globalAlpha = 1;

  // Add title (optional, can be disabled)
  const showTitle = false; // Set to true if you want title overlay
  if (showTitle) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(mapData.name, actualWidth / 2, 25);
  }

  return canvas.toBuffer("image/png");
}

/**
 * Generates PNG thumbnails for all maps in the maps directory
 */
function generateAllPNGThumbnails() {
  const mapsDir = path.join(__dirname, "..", "public", "maps");
  const thumbnailsDir = path.join(mapsDir, "thumbnails");

  // Ensure thumbnails directory exists
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }

  // Read all map files
  const mapFiles = fs
    .readdirSync(mapsDir)
    .filter((file) => file.endsWith(".json") && file !== "index.json");

  for (const mapFile of mapFiles) {
    try {
      const mapPath = path.join(mapsDir, mapFile);
      const mapData = JSON.parse(fs.readFileSync(mapPath, "utf8"));

      // Generate thumbnail PNG
      const thumbnailPNG = generatePNGThumbnail(mapData);

      // Save thumbnail as PNG
      const thumbnailName = path.basename(mapFile, ".json") + ".png";
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);
      fs.writeFileSync(thumbnailPath, thumbnailPNG);

      console.log(
        `✓ Generated PNG thumbnail for ${mapData.name}: ${thumbnailName}`
      );
    } catch (error) {
      console.error(
        `✗ Error generating PNG thumbnail for ${mapFile}:`,
        error.message
      );
    }
  }
}

/**
 * Generates a PNG thumbnail for a specific map file
 * @param {string} mapId - The map ID
 * @param {Object} options - Generation options
 */
function generatePNGThumbnailForMap(mapId, options = {}) {
  const { width = 400, height = 300 } = options;
  const mapsDir = path.join(__dirname, "..", "public", "maps");
  const thumbnailsDir = path.join(mapsDir, "thumbnails");
  const mapPath = path.join(mapsDir, `${mapId}.json`);

  // Ensure thumbnails directory exists
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }

  try {
    const mapData = JSON.parse(fs.readFileSync(mapPath, "utf8"));
    const thumbnailPNG = generatePNGThumbnail(mapData, width, height);

    const thumbnailPath = path.join(thumbnailsDir, `${mapId}.png`);
    fs.writeFileSync(thumbnailPath, thumbnailPNG);

    console.log(`✓ Generated PNG thumbnail for ${mapData.name}: ${mapId}.png`);
    return thumbnailPath;
  } catch (error) {
    console.error(
      `✗ Error generating PNG thumbnail for ${mapId}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Generate a thumbnail with scenario data (entities, waypoints, paths)
 * @param {Object} mapData - Map data
 * @param {Object} scenarioData - Scenario data with entities/waypoints
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Buffer} PNG image buffer
 */
function generateScenarioThumbnail(
  mapData,
  scenarioData,
  width = 400,
  height = 300
) {
  const grid = mapData.grid;
  const { rows, cols } = grid.dimensions;

  // Calculate cell size to ensure square cells
  const cellSize = Math.min(width / cols, height / rows);

  // Calculate actual canvas dimensions to fit square cells
  const actualWidth = cols * cellSize;
  const actualHeight = rows * cellSize;

  const canvas = createCanvas(actualWidth, actualHeight);
  const ctx = canvas.getContext("2d");

  const cellWidth = cellSize;
  const cellHeight = cellSize;

  // Fill background with black
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, actualWidth, actualHeight);

  // Draw grid cells (map background)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellType = grid.mapData[row][col];
      const color = COLORS[cellType] || COLORS.v;
      const x = col * cellWidth;
      const y = row * cellHeight;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellWidth, cellHeight);
    }
  }

  // Draw grid lines with better visibility
  ctx.strokeStyle = COLORS.gridLine;
  ctx.globalAlpha = COLORS.gridLineAlpha;
  ctx.lineWidth = 1.5; // Thicker lines for better visibility

  for (let i = 0; i <= cols; i++) {
    const x = i * cellWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, actualHeight);
    ctx.stroke();
  }

  for (let i = 0; i <= rows; i++) {
    const y = i * cellHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(actualWidth, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  // Draw paths first (so they appear behind entities)
  if (scenarioData.paths) {
    for (const path of scenarioData.paths) {
      if (path.waypoints && path.waypoints.length > 1) {
        ctx.strokeStyle = path.color || "#FF00FF";
        ctx.lineWidth = 4; // Thicker path lines
        ctx.setLineDash([8, 4]); // Larger dashes

        ctx.beginPath();
        for (let i = 0; i < path.waypoints.length; i++) {
          const waypoint = path.waypoints[i];

          // Handle both position formats: {position: {x, y}} and {x, y}
          let x, y;
          if (waypoint.position) {
            x = waypoint.position.y * cellWidth + cellWidth / 2;
            y = waypoint.position.x * cellHeight + cellHeight / 2;
          } else if (waypoint.x !== undefined && waypoint.y !== undefined) {
            x = waypoint.y * cellWidth + cellWidth / 2;
            y = waypoint.x * cellHeight + cellHeight / 2;
          } else {
            // Try to find waypoint by ID in separate waypoints array
            const separateWaypoint = scenarioData.waypoints?.find(
              (w) => w.id === path.waypoints[i]
            );
            if (separateWaypoint) {
              x = separateWaypoint.position.y * cellWidth + cellWidth / 2;
              y = separateWaypoint.position.x * cellHeight + cellHeight / 2;
            } else {
              continue; // Skip this waypoint if we can't find coordinates
            }
          }

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash
      }
    }
  }

  // Draw waypoints with better visibility
  if (scenarioData.waypoints) {
    for (const waypoint of scenarioData.waypoints) {
      // Handle both position formats: {position: {x, y}} and {x, y}
      let x, y;
      if (waypoint.position) {
        x = waypoint.position.y * cellWidth + cellWidth / 2;
        y = waypoint.position.x * cellHeight + cellHeight / 2;
      } else if (waypoint.x !== undefined && waypoint.y !== undefined) {
        x = waypoint.y * cellWidth + cellWidth / 2;
        y = waypoint.x * cellHeight + cellHeight / 2;
      } else {
        continue; // Skip waypoints without valid coordinates
      }

      // Larger waypoints with contrasting colors
      ctx.fillStyle = waypoint.color || "#FFD700";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Prominent white border
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Also draw waypoints that are embedded in paths
  if (scenarioData.paths) {
    for (const path of scenarioData.paths) {
      if (path.waypoints) {
        for (const waypoint of path.waypoints) {
          if (waypoint.x !== undefined && waypoint.y !== undefined) {
            const x = waypoint.y * cellWidth + cellWidth / 2;
            const y = waypoint.x * cellHeight + cellHeight / 2;

            // Smaller waypoints for path waypoints (to distinguish from standalone waypoints)
            ctx.fillStyle = path.color || "#FFD700";
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();

            // Prominent white border
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }
    }
  }

  // Draw entities with better contrast
  if (scenarioData.entities) {
    for (const entity of scenarioData.entities) {
      // Handle both position formats: {position: {x, y}} and {x, y}
      let x, y;
      if (entity.position) {
        x = entity.position.y * cellWidth + cellWidth / 2;
        y = entity.position.x * cellHeight + cellHeight / 2;
      } else if (entity.x !== undefined && entity.y !== undefined) {
        x = entity.y * cellWidth + cellWidth / 2;
        y = entity.x * cellHeight + cellHeight / 2;
      } else {
        continue; // Skip entities without valid coordinates
      }

      if (entity.type === "vehicle") {
        // Draw vehicle as rectangle with better colors
        ctx.fillStyle = entity.color || "#FF5722"; // Orange-red for vehicles
        ctx.fillRect(x - 10, y - 8, 20, 16);

        // Prominent white border
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 10, y - 8, 20, 16);
      } else if (entity.type === "pedestrian") {
        // Draw pedestrian as circle with better colors
        ctx.fillStyle = entity.color || "#4CAF50"; // Green for pedestrians
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Prominent white border
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  return canvas.toBuffer("image/png");
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Generating PNG thumbnails for all maps...");
    generateAllPNGThumbnails();
  } else {
    const mapId = args[0];
    console.log(`Generating PNG thumbnail for map: ${mapId}`);
    generatePNGThumbnailForMap(mapId);
  }
}

module.exports = {
  generatePNGThumbnail,
  generateAllPNGThumbnails,
  generatePNGThumbnailForMap,
  generateScenarioThumbnail,
  COLORS,
};
