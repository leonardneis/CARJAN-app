// Central scenario management service
class ScenarioService {
  constructor() {
    this.scenarios = [];
    this.maps = [];
  }

  // Load all available scenarios
  async loadScenarios() {
    try {
      // Load scenarios index
      const indexResponse = await fetch("/scenarios/scenarios-index.json");
      let scenarioMetadata = [];

      if (indexResponse.ok) {
        const indexData = await indexResponse.json();
        scenarioMetadata = indexData.scenarios;
      }

      const loadedScenarios = [];

      // First, load scenarios from the scenarios-index.json
      for (const metadata of scenarioMetadata) {
        try {
          const response = await fetch(`/scenarios/${metadata.file}`);
          if (response.ok) {
            const scenarioData = await response.json();

            // Convert to our scenario format
            const scenario = {
              id: metadata.id,
              name: metadata.name || scenarioData.name,
              mapName: metadata.map || scenarioData.mapId,
              mapId: metadata.map || scenarioData.mapId,
              lastModified:
                scenarioData.metadata?.modified || new Date().toISOString(),
              entityCount: scenarioData.entities
                ? scenarioData.entities.length
                : 0,
              pathCount: scenarioData.paths ? scenarioData.paths.length : 0,
              waypointCount: scenarioData.waypoints
                ? scenarioData.waypoints.length
                : 0,
              description: metadata.description || scenarioData.description,
              category: metadata.category,
              author: scenarioData.metadata?.author || "Unknown",
              difficulty: metadata.difficulty || "medium",
              duration: metadata.duration || "5-10 minutes",
              tags: metadata.tags || [],
              thumbnailPath: `/scenarios/thumbnails/${metadata.id}.png`,
              data: scenarioData,
            };

            loadedScenarios.push(scenario);
          }
        } catch (fileError) {
          console.warn(`Could not load scenario ${metadata.id}:`, fileError);
        }
      }

      // Load example scenarios
      const exampleFiles = [
        "urban-intersection.json",
        "highway-overtaking.json",
        "parking-lot.json",
      ];

      for (const filename of exampleFiles) {
        try {
          const response = await fetch(`/example-scenarios/${filename}`);
          if (response.ok) {
            const scenarioData = await response.json();

            // Get metadata from index if available
            const metadata = scenarioMetadata.find((m) => m.file === filename);

            // Convert to our scenario format
            const scenario = {
              id: filename.replace(".json", ""),
              name: scenarioData.metadata.name,
              mapName: scenarioData.environment.map,
              mapId: scenarioData.environment.map,
              lastModified: scenarioData.metadata.modified,
              entityCount: scenarioData.entities
                ? scenarioData.entities.length
                : 0,
              pathCount: scenarioData.paths ? scenarioData.paths.length : 0,
              waypointCount: scenarioData.waypoints
                ? scenarioData.waypoints.length
                : 0,
              description: scenarioData.metadata.description,
              category: scenarioData.environment.category,
              author: scenarioData.metadata.author,
              difficulty: metadata?.difficulty || "medium",
              duration: metadata?.duration || "5-10 minutes",
              tags: metadata?.tags || [],
              thumbnailPath: `/example-scenarios/thumbnails/${filename.replace(
                ".json",
                ""
              )}.png`,
              data: scenarioData,
            };

            loadedScenarios.push(scenario);
          }
        } catch (fileError) {
          console.warn(`Could not load ${filename}:`, fileError);
        }
      }

      this.scenarios = loadedScenarios;
      return this.scenarios;
    } catch (error) {
      console.error("Error loading scenarios:", error);
      return [];
    }
  }

  // Load all available maps
  async loadMaps() {
    try {
      const response = await fetch("/maps/maps-index.json");
      if (response.ok) {
        const data = await response.json();
        this.maps = data.maps;
        return this.maps;
      }
    } catch (error) {
      console.error("Error loading maps:", error);
    }
    return [];
  }

  // Get a specific map by ID
  async getMap(mapId) {
    try {
      const response = await fetch(`/maps/${mapId}.json`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error(`Error loading map ${mapId}:`, error);
    }
    return null;
  }

  // Get a specific scenario by ID
  getScenario(scenarioId) {
    return this.scenarios.find((s) => s.id === scenarioId);
  }

  // Save scenario to localStorage
  saveScenarios(scenarios) {
    localStorage.setItem("carjan-scenarios", JSON.stringify(scenarios));
  }

  // Load scenarios from localStorage
  loadSavedScenarios() {
    try {
      const saved = localStorage.getItem("carjan-scenarios");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading saved scenarios:", error);
      return [];
    }
  }

  // Create a new scenario
  createScenario(scenarioData) {
    const newScenario = {
      id: `custom_${Date.now()}`,
      name: scenarioData.name || "New Scenario",
      mapName: scenarioData.mapName || "town01",
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      author: "User",
      category: scenarioData.category || "Custom",
      ...scenarioData,
    };

    return newScenario;
  }

  // Duplicate a scenario
  duplicateScenario(scenario) {
    const duplicated = {
      ...scenario,
      id: `${scenario.id}_copy_${Date.now()}`,
      name: `${scenario.name} (Copy)`,
      lastModified: new Date().toISOString(),
    };

    return duplicated;
  }
}

// Export singleton instance
export const scenarioService = new ScenarioService();
export default scenarioService;
