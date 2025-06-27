const { generateScenarioThumbnail } = require("./generatePNGThumbnails.cjs");
const fs = require("fs");
const path = require("path");

/**
 * Generate thumbnails for scenarios that include entities, waypoints, and paths
 */
function generateScenarioThumbnails() {
  const mapsDir = path.join(__dirname, "..", "public", "maps");
  const scenariosDir = path.join(__dirname, "..", "public", "scenarios");
  const thumbnailsDir = path.join(scenariosDir, "thumbnails");

  // Ensure thumbnails directory exists
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }

  // Read scenario index
  const scenarioIndexPath = path.join(scenariosDir, "scenarios-index.json");
  if (!fs.existsSync(scenarioIndexPath)) {
    console.log("No scenario index found");
    return;
  }

  const scenarioIndex = JSON.parse(fs.readFileSync(scenarioIndexPath, "utf8"));

  for (const scenarioInfo of scenarioIndex.scenarios) {
    try {
      // Load scenario data
      const scenarioPath = path.join(scenariosDir, scenarioInfo.file);
      const scenarioData = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));

      // Load corresponding map data
      const mapPath = path.join(mapsDir, `${scenarioData.mapId}.json`);
      if (!fs.existsSync(mapPath)) {
        console.error(
          `Map not found for scenario ${scenarioInfo.id}: ${scenarioData.mapId}`
        );
        continue;
      }

      const mapData = JSON.parse(fs.readFileSync(mapPath, "utf8"));

      // Generate scenario thumbnail with entities and waypoints
      const thumbnailPNG = generateScenarioThumbnail(
        mapData,
        scenarioData,
        400,
        300
      );

      // Save thumbnail
      const thumbnailName = `${scenarioInfo.id}.png`;
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);
      fs.writeFileSync(thumbnailPath, thumbnailPNG);

      console.log(
        `✓ Generated scenario thumbnail for ${scenarioInfo.name}: ${thumbnailName}`
      );
    } catch (error) {
      console.error(
        `✗ Error generating scenario thumbnail for ${scenarioInfo.id}:`,
        error.message
      );
    }
  }
}

/**
 * Generate thumbnail for a specific scenario
 * @param {string} scenarioId - Scenario ID
 */
function generateSingleScenarioThumbnail(scenarioId) {
  const mapsDir = path.join(__dirname, "..", "public", "maps");
  const scenariosDir = path.join(__dirname, "..", "public", "scenarios");
  const thumbnailsDir = path.join(scenariosDir, "thumbnails");

  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }

  try {
    // Load scenario data
    const scenarioPath = path.join(scenariosDir, `${scenarioId}.json`);
    const scenarioData = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));

    // Load corresponding map data
    const mapPath = path.join(mapsDir, `${scenarioData.mapId}.json`);
    const mapData = JSON.parse(fs.readFileSync(mapPath, "utf8"));

    // Generate scenario thumbnail
    const thumbnailPNG = generateScenarioThumbnail(
      mapData,
      scenarioData,
      400,
      300
    );

    // Save thumbnail
    const thumbnailPath = path.join(thumbnailsDir, `${scenarioId}.png`);
    fs.writeFileSync(thumbnailPath, thumbnailPNG);

    console.log(
      `✓ Generated scenario thumbnail for ${scenarioId}: ${scenarioId}.png`
    );
    return thumbnailPath;
  } catch (error) {
    console.error(
      `✗ Error generating scenario thumbnail for ${scenarioId}:`,
      error.message
    );
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Generating scenario thumbnails for all scenarios...");
    generateScenarioThumbnails();
  } else {
    const scenarioId = args[0];
    console.log(`Generating scenario thumbnail for: ${scenarioId}`);
    generateSingleScenarioThumbnail(scenarioId);
  }
}

module.exports = {
  generateScenarioThumbnails,
  generateSingleScenarioThumbnail,
};
