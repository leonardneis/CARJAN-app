// Test the scenario service locally
const path = require("path");
const fs = require("fs");

// Mock fetch for Node.js environment
global.fetch = async (url) => {
  const filePath = path.join(__dirname, "..", "public", url.replace(/^\//, ""));

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    return {
      ok: true,
      json: async () => JSON.parse(content),
    };
  }

  return { ok: false };
};

// Import the scenario service
const scenarioService =
  require("../src/renderer/services/scenarioService.js").default;

async function testScenarioService() {
  console.log("Testing scenario service...\n");

  try {
    const scenarios = await scenarioService.loadScenarios();

    console.log(`Loaded ${scenarios.length} scenarios:`);
    scenarios.forEach((scenario) => {
      console.log(`  - ${scenario.name} (${scenario.id})`);
      console.log(`    Map: ${scenario.mapName}`);
      console.log(`    Thumbnail: ${scenario.thumbnailPath}`);
      console.log(`    Entities: ${scenario.entityCount}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error testing scenario service:", error);
  }
}

testScenarioService();
