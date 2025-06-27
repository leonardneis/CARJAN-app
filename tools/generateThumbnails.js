const fs = require("fs");
const path = require("path");

// Grid colors matching CarjanGrid.vue
const COLORS = {
  v: "#2D2D2D", // Void
  r: "#A8E6CF", // Road (pastel mint green)
  s: "#B8D8F0", // Sidewalk (pastel blue)
};

/**
 * Generates an SVG thumbnail for a map that matches the CarjanGrid.vue styling
 * @param {Object} mapData - The map data object
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @returns {string} SVG content
 */
function generateMapThumbnail(mapData, width = 200, height = 150) {
  const grid = mapData.grid;
  const { rows, cols } = grid.dimensions;
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // Background
  svgContent += `<rect width="${width}" height="${height}" fill="#000000"/>`;

  // Grid cells
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellType = grid.mapData[row][col];
      const color = COLORS[cellType] || "#2D2D2D";
      const x = col * cellWidth;
      const y = row * cellHeight;

      svgContent += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${color}" stroke="#555" stroke-width="0.5"/>`;
    }
  }

  // Grid lines for better visibility (subtle)
  for (let i = 0; i <= cols; i++) {
    const x = i * cellWidth;
    svgContent += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#555" stroke-width="0.5" opacity="0.7"/>`;
  }

  for (let i = 0; i <= rows; i++) {
    const y = i * cellHeight;
    svgContent += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#555" stroke-width="0.5" opacity="0.7"/>`;
  }

  // Title
  svgContent += `<text x="${
    width / 2
  }" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${
    mapData.name
  }</text>`;

  svgContent += "</svg>";
  return svgContent;
}

/**
 * Generates thumbnails for all maps in the maps directory
 */
function generateAllThumbnails() {
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

      // Generate thumbnail SVG
      const thumbnailSvg = generateMapThumbnail(mapData);

      // Save thumbnail
      const thumbnailName = path.basename(mapFile, ".json") + ".svg";
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);
      fs.writeFileSync(thumbnailPath, thumbnailSvg);

      console.log(
        `✓ Generated thumbnail for ${mapData.name}: ${thumbnailName}`
      );
    } catch (error) {
      console.error(
        `✗ Error generating thumbnail for ${mapFile}:`,
        error.message
      );
    }
  }
}

/**
 * Generates a thumbnail for a specific map file
 * @param {string} mapId - The map ID
 */
function generateThumbnail(mapId) {
  const mapsDir = path.join(__dirname, "..", "public", "maps");
  const thumbnailsDir = path.join(mapsDir, "thumbnails");
  const mapPath = path.join(mapsDir, `${mapId}.json`);

  // Ensure thumbnails directory exists
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }

  try {
    const mapData = JSON.parse(fs.readFileSync(mapPath, "utf8"));
    const thumbnailSvg = generateMapThumbnail(mapData);

    const thumbnailPath = path.join(thumbnailsDir, `${mapId}.svg`);
    fs.writeFileSync(thumbnailPath, thumbnailSvg);

    console.log(`✓ Generated thumbnail for ${mapData.name}: ${mapId}.svg`);
    return thumbnailPath;
  } catch (error) {
    console.error(`✗ Error generating thumbnail for ${mapId}:`, error.message);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Generating thumbnails for all maps...");
    generateAllThumbnails();
  } else {
    const mapId = args[0];
    console.log(`Generating thumbnail for map: ${mapId}`);
    generateThumbnail(mapId);
  }
}

module.exports = {
  generateMapThumbnail,
  generateAllThumbnails,
  generateThumbnail,
  COLORS,
};
