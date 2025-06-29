// Central scenario management service
class ScenarioService {
  constructor() {
    this.scenarios = [];
    this.maps = [];
  }

  // Load all available scenarios
  async loadScenarios() {
    try {
      console.log("Starting to load scenarios...");

      // Load scenarios index
      const indexResponse = await fetch("/scenarios/scenarios-index.json");
      let scenarioMetadata = [];

      if (indexResponse.ok) {
        try {
          const indexData = await indexResponse.json();
          scenarioMetadata = indexData.scenarios;
          console.log(
            "Loaded scenarios index:",
            scenarioMetadata.length,
            "scenarios"
          );
        } catch (jsonError) {
          console.warn("Failed to parse scenarios index JSON:", jsonError);
        }
      } else {
        console.warn(
          "Scenarios index not found, status:",
          indexResponse.status
        );
      }

      const loadedScenarios = [];

      // First, load scenarios from the scenarios-index.json
      for (const metadata of scenarioMetadata) {
        try {
          console.log(`Loading scenario: ${metadata.id}`);
          const response = await fetch(`/scenarios/${metadata.file}`);
          if (response.ok) {
            const text = await response.text();
            if (text.trim() === "") {
              console.warn(`Empty scenario file: ${metadata.file}`);
              continue;
            }

            const scenarioData = JSON.parse(text);

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
          } else {
            console.warn(
              `Scenario file not found: ${metadata.file}, status: ${response.status}`
            );
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

      console.log("Loading example scenarios...");
      for (const filename of exampleFiles) {
        try {
          console.log(`Loading example scenario: ${filename}`);
          const response = await fetch(`/example-scenarios/${filename}`);
          if (response.ok) {
            const text = await response.text();
            if (text.trim() === "") {
              console.warn(`Empty example scenario file: ${filename}`);
              continue;
            }

            const scenarioData = JSON.parse(text);

            // Get metadata from index if available
            const metadata = scenarioMetadata.find((m) => m.file === filename);

            // Convert to our scenario format
            const scenario = {
              id: filename.replace(".json", ""),
              name:
                scenarioData.metadata?.name ||
                filename.replace(".json", "").replace("-", " "),
              mapName: scenarioData.environment?.map || "carjan-map01",
              mapId: scenarioData.environment?.map || "carjan-map01",
              lastModified:
                scenarioData.metadata?.modified || new Date().toISOString(),
              entityCount: scenarioData.entities
                ? scenarioData.entities.length
                : 0,
              pathCount: scenarioData.paths ? scenarioData.paths.length : 0,
              waypointCount: scenarioData.waypoints
                ? scenarioData.waypoints.length
                : 0,
              description:
                scenarioData.metadata?.description || "Example scenario",
              category: scenarioData.environment?.category || "Example",
              author: scenarioData.metadata?.author || "CARJAN",
              difficulty: metadata?.difficulty || "medium",
              duration: metadata?.duration || "5-10 minutes",
              tags: metadata?.tags || ["example"],
              thumbnailPath: `/example-scenarios/thumbnails/${filename.replace(
                ".json",
                ""
              )}.png`,
              data: scenarioData,
            };

            loadedScenarios.push(scenario);
          } else {
            console.warn(
              `Example scenario file not found: ${filename}, status: ${response.status}`
            );
          }
        } catch (fileError) {
          console.warn(`Could not load ${filename}:`, fileError);
        }
      }

      console.log(`Successfully loaded ${loadedScenarios.length} scenarios`);

      // If no scenarios were loaded, create some default/empty scenarios
      if (loadedScenarios.length === 0) {
        console.log(
          "No scenarios loaded from files, creating default scenarios..."
        );
        loadedScenarios.push(...this.createDefaultScenarios());
      }

      this.scenarios = loadedScenarios;
      return this.scenarios;
    } catch (error) {
      console.error("Error loading scenarios:", error);
      // Return some default scenarios even if loading fails
      this.scenarios = this.createDefaultScenarios();
      return this.scenarios;
    }
  }

  // Create default/fallback scenarios when files can't be loaded
  createDefaultScenarios() {
    return [
      {
        id: "new-urban-scenario",
        name: "New Urban Scenario",
        mapName: "carjan-map01",
        mapId: "carjan-map01",
        lastModified: new Date().toISOString(),
        entityCount: 0,
        pathCount: 0,
        waypointCount: 0,
        description: "A blank urban scenario template",
        category: "Urban",
        author: "CARJAN",
        difficulty: "easy",
        duration: "5-10 minutes",
        tags: ["template", "urban"],
        thumbnailPath: "/assets/img/default-urban.png",
        data: {
          metadata: {
            name: "New Urban Scenario",
            version: "1.0.0",
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            author: "CARJAN",
            description: "A blank urban scenario template",
          },
          environment: {
            weather: "Clear",
            category: "Urban",
            cameraPosition: "up",
            map: "carjan-map01",
          },
          entities: [],
          waypoints: [],
          paths: [],
          dboxes: [],
        },
      },
      {
        id: "new-highway-scenario",
        name: "New Highway Scenario",
        mapName: "Town04",
        mapId: "Town04",
        lastModified: new Date().toISOString(),
        entityCount: 0,
        pathCount: 0,
        waypointCount: 0,
        description: "A blank highway scenario template",
        category: "Highway",
        author: "CARJAN",
        difficulty: "medium",
        duration: "5-10 minutes",
        tags: ["template", "highway"],
        thumbnailPath: "/assets/img/default-highway.png",
        data: {
          metadata: {
            name: "New Highway Scenario",
            version: "1.0.0",
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            author: "CARJAN",
            description: "A blank highway scenario template",
          },
          environment: {
            weather: "Clear",
            category: "Highway",
            cameraPosition: "up",
            map: "Town04",
          },
          entities: [],
          waypoints: [],
          paths: [],
          dboxes: [],
        },
      },
    ];
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
    console.log(`Looking for scenario with ID: ${scenarioId}`);
    console.log(
      `Available scenarios: ${this.scenarios.map((s) => s.id).join(", ")}`
    );

    const scenario = this.scenarios.find((s) => s.id === scenarioId);

    if (!scenario) {
      console.warn(`Scenario not found: ${scenarioId}`);
      // Try to check if it's a dynamically generated scenario ID (from ScenarioSelection)
      if (scenarioId.startsWith("scenario-")) {
        console.log(
          "Attempting to create a new default scenario for dynamic ID"
        );
        return {
          id: scenarioId,
          name: "New Scenario",
          mapName: "carjan-map01",
          mapId: "carjan-map01",
          lastModified: new Date().toISOString(),
          entityCount: 0,
          pathCount: 0,
          waypointCount: 0,
          description: "A new scenario",
          category: "Urban",
          author: "CARJAN",
          difficulty: "easy",
          duration: "5-10 minutes",
          tags: ["new"],
          thumbnailPath: "/assets/img/default-urban.png",
          data: {
            metadata: {
              name: "New Scenario",
              version: "1.0.0",
              created: new Date().toISOString(),
              modified: new Date().toISOString(),
              author: "CARJAN",
              description: "A new scenario",
            },
            environment: {
              weather: "Clear",
              category: "Urban",
              cameraPosition: "up",
              map: "carjan-map01",
            },
            entities: [],
            waypoints: [],
            paths: [],
            dboxes: [],
          },
        };
      }
    }

    return scenario;
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
      mapName: scenarioData.mapName || "carjan-map01",
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
