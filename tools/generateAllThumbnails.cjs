const {
  generateScenarioThumbnail,
  generatePNGThumbnail,
} = require("./generatePNGThumbnails.cjs");
const fs = require("fs");
const path = require("path");

/**
 * Generate thumbnails for all scenarios and maps in the project
 */
async function generateAllThumbnails() {
  console.log("🎨 Generating all thumbnails...\n");

  // Generate map thumbnails
  console.log("📍 Generating map thumbnails...");
  await generateMapThumbnails();

  // Generate scenario thumbnails from scenarios directory
  console.log("\n🎬 Generating scenario thumbnails...");
  await generateScenarioThumbnails();

  // Generate example scenario thumbnails
  console.log("\n📚 Generating example scenario thumbnails...");
  await generateExampleScenarioThumbnails();

  console.log("\n✅ All thumbnails generated successfully!");
}

async function generateMapThumbnails() {
  const mapsDir = path.join(__dirname, "..", "public", "maps");
  const thumbnailsDir = path.join(mapsDir, "thumbnails");

  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }

  const mapFiles = fs
    .readdirSync(mapsDir)
    .filter((file) => file.endsWith(".json") && file !== "index.json");

  for (const mapFile of mapFiles) {
    try {
      const mapPath = path.join(mapsDir, mapFile);
      const mapData = JSON.parse(fs.readFileSync(mapPath, "utf8"));

      const thumbnailPNG = generatePNGThumbnail(mapData, 400, 300);
      const thumbnailName = path.basename(mapFile, ".json") + ".png";
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);

      fs.writeFileSync(thumbnailPath, thumbnailPNG);
      console.log(`  ✓ ${mapData.name}: ${thumbnailName}`);
    } catch (error) {
      console.error(
        `  ✗ Error generating thumbnail for ${mapFile}:`,
        error.message
      );
    }
  }
}

async function generateScenarioThumbnails() {
  const mapsDir = path.join(__dirname, "..", "public", "maps");
  const scenariosDir = path.join(__dirname, "..", "public", "scenarios");
  const thumbnailsDir = path.join(scenariosDir, "thumbnails");

  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }

  // Load scenario index
  const scenarioIndexPath = path.join(scenariosDir, "scenarios-index.json");
  if (!fs.existsSync(scenarioIndexPath)) {
    console.log("  No scenario index found");
    return;
  }

  const scenarioIndex = JSON.parse(fs.readFileSync(scenarioIndexPath, "utf8"));

  for (const scenarioInfo of scenarioIndex.scenarios) {
    try {
      const scenarioPath = path.join(scenariosDir, scenarioInfo.file);
      const scenarioData = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));

      const mapPath = path.join(mapsDir, `${scenarioData.mapId}.json`);
      if (!fs.existsSync(mapPath)) {
        console.error(
          `  ✗ Map not found for scenario ${scenarioInfo.id}: ${scenarioData.mapId}`
        );
        continue;
      }

      const mapData = JSON.parse(fs.readFileSync(mapPath, "utf8"));

      const thumbnailPNG = generateScenarioThumbnail(
        mapData,
        scenarioData,
        400,
        300
      );
      const thumbnailName = `${scenarioInfo.id}.png`;
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);

      fs.writeFileSync(thumbnailPath, thumbnailPNG);
      console.log(`  ✓ ${scenarioInfo.name}: ${thumbnailName}`);
    } catch (error) {
      console.error(
        `  ✗ Error generating thumbnail for ${scenarioInfo.id}:`,
        error.message
      );
    }
  }
}

async function generateExampleScenarioThumbnails() {
  const mapsDir = path.join(__dirname, "..", "public", "maps");
  const exampleDir = path.join(__dirname, "..", "public", "example-scenarios");
  const thumbnailsDir = path.join(exampleDir, "thumbnails");

  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }

  const exampleFiles = fs
    .readdirSync(exampleDir)
    .filter((file) => file.endsWith(".json"));

  for (const exampleFile of exampleFiles) {
    try {
      const scenarioPath = path.join(exampleDir, exampleFile);
      const scenarioData = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));

      // Try to find the map based on scenario data
      let mapId = scenarioData.mapId || scenarioData.environment?.map;
      if (!mapId) {
        console.warn(`  ⚠ No map ID found for ${exampleFile}, skipping`);
        continue;
      }

      const mapPath = path.join(mapsDir, `${mapId}.json`);
      if (!fs.existsSync(mapPath)) {
        console.error(`  ✗ Map not found for example ${exampleFile}: ${mapId}`);
        continue;
      }

      const mapData = JSON.parse(fs.readFileSync(mapPath, "utf8"));

      const thumbnailPNG = generateScenarioThumbnail(
        mapData,
        scenarioData,
        400,
        300
      );
      const thumbnailName = path.basename(exampleFile, ".json") + ".png";
      const thumbnailPath = path.join(thumbnailsDir, thumbnailName);

      fs.writeFileSync(thumbnailPath, thumbnailPNG);
      console.log(
        `  ✓ ${path.basename(exampleFile, ".json")}: ${thumbnailName}`
      );
    } catch (error) {
      console.error(
        `  ✗ Error generating thumbnail for ${exampleFile}:`,
        error.message
      );
    }
  }
}

// CLI usage
if (require.main === module) {
  generateAllThumbnails().catch(console.error);
}

module.exports = {
  generateAllThumbnails,
  generateMapThumbnails,
  generateScenarioThumbnails,
  generateExampleScenarioThumbnails,
};
