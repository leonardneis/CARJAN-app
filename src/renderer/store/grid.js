import { defineStore } from "pinia";

export const useGridStore = defineStore("grid", {
  state: () => ({
    // Grid dimensions
    gridRows: 12,
    gridCols: 8,
    cellHeight: 50,
    cellWidth: 60,

    // Grid data
    mapData: null,
    agentData: [],
    gridCells: [],
    gridStatus: {},

    // Display settings
    scale: 1.0,
    translateX: 0,
    translateY: 0,
    showGrid: true,
    showPaths: true,
    showWaypoints: true,
    showEntities: true,
    showDBoxes: true,

    // Scenario data
    scenarioName: null,
    mapName: null,
    weather: "Clear",
    category: "Urban",
    cameraPosition: "up",

    // Interaction state
    selectedPath: null,
    selectedEntity: null,
    selectedDBox: null,
    canvasMode: "default", // 'default', 'path', 'dbox'
    pathMode: false,
    pathInProgress: null,

    // Collections
    paths: [],
    waypoints: [],
    dboxes: [],
    entities: [],

    // UI state
    loading: false,
    mapAnimating: false,
    propertyPanel: "scenario",
    currentCellPosition: [],
    currentCellStatus: null,

    // Colors - Modern palette with better contrast and readability
    colors: {
      road: "#6B9BD9", // Clear blue for roads
      sidewalk: "#95A5C6", // Muted blue-gray for sidewalks
      path: "#95A5C6", // Legacy support - same as sidewalk
      void: "#1a1a1a", // Dark charcoal for void
      entity: "#FF5722", // Orange-red for entities
      waypoint: "#FFD700", // Gold for waypoints
      path_selected: "#FF00FF", // Magenta for selected path
    },

    // Change tracking for auto-save
    _isInitialized: false,
  }),

  getters: {
    // Get grid cell at specific position
    getCellAt: (state) => (row, col) => {
      return state.gridStatus[`${row},${col}`] || null;
    },

    // Get cell color based on type
    getCellColor: (state) => (row, col) => {
      const mapData = state.mapData;
      if (mapData && mapData[row] && mapData[row][col]) {
        const cellType = mapData[row][col];
        if (cellType === "r") return state.colors.road;
        if (cellType === "s") return state.colors.sidewalk;
        if (cellType === "p") return state.colors.path; // Legacy support
      }
      return state.colors.void;
    },

    // Check if cell is occupied
    isCellOccupied: (state) => (row, col) => {
      const cellStatus = state.gridStatus[`${row},${col}`];
      return cellStatus?.occupied || false;
    },

    // Get entities on grid
    entitiesOnGrid: (state) => {
      return state.entities.filter(
        (entity) =>
          entity.x >= 0 &&
          entity.x < state.gridRows &&
          entity.y >= 0 &&
          entity.y < state.gridCols
      );
    },

    // Get waypoints on grid
    waypointsOnGrid: (state) => {
      return state.waypoints.filter(
        (waypoint) =>
          waypoint.x >= 0 &&
          waypoint.x < state.gridRows &&
          waypoint.y >= 0 &&
          waypoint.y < state.gridCols
      );
    },

    // Export scenario data for saving
    scenarioData: (state) => ({
      metadata: {
        // Will be provided by scenarioStore
      },
      environment: {
        map: state.mapName,
        weather: state.weather,
        category: state.category,
        cameraPosition: state.cameraPosition,
      },
      grid: {
        dimensions: {
          rows: state.gridRows,
          cols: state.gridCols,
        },
        cellSize: {
          width: state.cellWidth,
          height: state.cellHeight,
        },
        mapData: state.mapData,
      },
      entities: state.entities.map((entity) => ({
        ...entity,
        timestamp: new Date(),
      })),
      paths: state.paths.map((path) => ({
        ...path,
        timestamp: new Date(),
      })),
      waypoints: state.waypoints.map((waypoint) => ({
        ...waypoint,
        timestamp: new Date(),
      })),
      dboxes: state.dboxes.map((dbox) => ({
        ...dbox,
        timestamp: new Date(),
      })),
      settings: {
        showGrid: state.showGrid,
        showPaths: state.showPaths,
        showWaypoints: state.showWaypoints,
        showEntities: state.showEntities,
        showDBoxes: state.showDBoxes,
      },
    }),
  },

  actions: {
    // Initialize grid
    initializeGrid() {
      const cells = [];
      const status = {};

      for (let row = 0; row < this.gridRows; row++) {
        for (let col = 0; col < this.gridCols; col++) {
          cells.push({ row, col });
          status[`${row},${col}`] = {
            occupied: false,
            entityType: null,
            waypoints: [],
            sidewalk: false,
          };
        }
      }

      this.gridCells = cells;
      this.gridStatus = status;
      this._isInitialized = true;

      // Set up change tracking AFTER initialization is complete
      this._setupChangeTracking();
    },

    // Setup change tracking for auto-save
    async _setupChangeTracking() {
      // Import scenarioStore within action to avoid circular dependencies
      const { useScenarioStore } = await import("./scenario.js");

      // Track the last mutation timestamp to prevent duplicate triggers
      let lastMutationTime = 0;

      // Watch for changes in critical data
      this.$subscribe((mutation, state) => {
        if (!this._isInitialized) return;

        // Prevent rapid duplicate triggers
        const now = Date.now();
        if (now - lastMutationTime < 50) return; // 50ms debounce
        lastMutationTime = now;

        const scenarioStore = useScenarioStore();
        const changeType = mutation.type;
        const payload = mutation.payload;

        console.log(`Grid change detected: ${changeType}`, payload);

        // Mark scenario as dirty on any change
        scenarioStore.markDirty();

        // Stream change if live streaming is enabled
        scenarioStore.streamChange(changeType, {
          storeId: mutation.storeId,
          payload: payload,
          timestamp: new Date(),
        });
      });
    },

    // Set map data and update grid
    setMapData(mapInfo) {
      // Handle both old format (direct map data) and new format (map object with grid)
      if (mapInfo && mapInfo.grid) {
        // New format with dimensions
        this.mapData = mapInfo.grid.mapData;
        this.gridRows = mapInfo.grid.dimensions.rows;
        this.gridCols = mapInfo.grid.dimensions.cols;

        // Update cell size if provided
        if (mapInfo.grid.cellSize) {
          this.cellWidth = mapInfo.grid.cellSize.width || this.cellWidth;
          this.cellHeight = mapInfo.grid.cellSize.height || this.cellHeight;
        }

        // Set map metadata
        this.mapName = mapInfo.name || mapInfo.id;
      } else {
        // Old format - direct map data array
        this.mapData = mapInfo;
        // Try to infer dimensions from the array
        if (Array.isArray(mapInfo) && mapInfo.length > 0) {
          this.gridRows = mapInfo.length;
          this.gridCols = mapInfo[0]?.length || this.gridCols;
        }
      }

      this.updateGridFromMap();
    },

    // Update grid status based on map data
    updateGridFromMap() {
      if (!this.mapData) return;

      for (let row = 0; row < this.gridRows; row++) {
        for (let col = 0; col < this.gridCols; col++) {
          const cellType = this.mapData[row]?.[col];
          const cellKey = `${row},${col}`;

          if (cellType === "r" || cellType === "p") {
            // Road or path - not void
            this.gridStatus[cellKey] = {
              ...this.gridStatus[cellKey],
              occupied: false,
              entityType: null,
              sidewalk: cellType === "p",
            };
          } else {
            // Void cell
            this.gridStatus[cellKey] = {
              ...this.gridStatus[cellKey],
              occupied: true,
              entityType: "void",
              sidewalk: false,
            };
          }
        }
      }
    },

    // Update grid status based on map data
    updateGridStatus() {
      if (!this.mapData) return;

      for (let row = 0; row < this.gridRows; row++) {
        for (let col = 0; col < this.gridCols; col++) {
          const cellType = this.mapData[row]?.[col];
          const cellKey = `${row},${col}`;

          // Preserve existing waypoints and entities
          const existingStatus = this.gridStatus[cellKey] || {};

          if (cellType === "r" || cellType === "p") {
            // Road or path - not void
            this.gridStatus[cellKey] = {
              ...existingStatus,
              occupied: existingStatus.entityType ? true : false,
              entityType: existingStatus.entityType || null,
              sidewalk: cellType === "p",
            };
          } else {
            // Void cell
            this.gridStatus[cellKey] = {
              ...existingStatus,
              occupied: true,
              entityType: "void",
              sidewalk: false,
            };
          }
        }
      }
    },

    // Load scenario data from imported file
    loadScenarioData(scenarioData) {
      this._isInitialized = false; // Temporarily disable change tracking

      try {
        // Load environment settings
        if (scenarioData.environment) {
          this.mapName = scenarioData.environment.map;
          this.weather = scenarioData.environment.weather;
          this.category = scenarioData.environment.category;
          this.cameraPosition = scenarioData.environment.cameraPosition;
        }

        // Load grid settings
        if (scenarioData.grid) {
          this.gridRows = scenarioData.grid.dimensions?.rows || 12;
          this.gridCols = scenarioData.grid.dimensions?.cols || 8;
          this.cellWidth = scenarioData.grid.cellSize?.width || 60;
          this.cellHeight = scenarioData.grid.cellSize?.height || 50;
          this.mapData = scenarioData.grid.mapData || null;
        }

        // Load entities
        this.entities = scenarioData.entities || [];

        // Load paths
        this.paths = scenarioData.paths || [];

        // Load waypoints
        this.waypoints = scenarioData.waypoints || [];

        // Load dboxes
        this.dboxes = scenarioData.dboxes || [];

        // Load display settings
        if (scenarioData.settings) {
          this.showGrid = scenarioData.settings.showGrid ?? true;
          this.showPaths = scenarioData.settings.showPaths ?? true;
          this.showWaypoints = scenarioData.settings.showWaypoints ?? true;
          this.showEntities = scenarioData.settings.showEntities ?? true;
          this.showDBoxes = scenarioData.settings.showDBoxes ?? true;
        }

        // Rebuild grid status
        this.updateGridStatus();
      } finally {
        this._isInitialized = true; // Re-enable change tracking
      }
    },

    // Load map data from JSON format
    loadMapFromData(mapData, withAnimation = true) {
      this._isInitialized = false; // Temporarily disable change tracking

      try {
        // Clear all existing scenario data first
        this.entities = [];
        this.paths = [];
        this.waypoints = [];
        this.dboxes = [];

        // Reset selections
        this.selectedPath = null;
        this.selectedEntity = null;
        this.selectedDBox = null;

        // Update grid dimensions if provided
        if (mapData.size) {
          this.gridRows = mapData.size.rows;
          this.gridCols = mapData.size.cols;
        }

        // Set map metadata
        if (mapData.name) {
          this.mapName = mapData.name;
        }
        if (mapData.category) {
          this.category = mapData.category;
        }

        // Set the map data
        this.mapData = mapData.mapData;

        // Reinitialize grid with new dimensions
        this.initializeGrid();

        // Update grid status based on new map
        this.updateGridStatus();

        // Trigger stagger animation if requested
        if (withAnimation) {
          this.mapAnimating = true;
          // Animation will be handled by the Vue component
          // Store will be notified when animation completes
        }

        // Load spawn points as entities if provided (after animation)
        if (mapData.spawnPoints && !withAnimation) {
          mapData.spawnPoints.forEach((spawn) => {
            this.addEntity({
              type: spawn.type,
              x: spawn.x,
              y: spawn.y,
              heading: "North",
            });
          });
        }
      } finally {
        this._isInitialized = true; // Re-enable change tracking
      }
    },

    // Entity management
    addEntity(entity) {
      const result = this._addEntityInternal(entity);

      if (result) {
        // Trigger change notification
        this._notifyChange("entity_added", entity);
      }

      return result;
    },

    _addEntityInternal(entity) {
      const { type, x, y } = entity;
      const cellKey = `${x},${y}`;

      // Check if cell can accept entity
      if (this.gridStatus[cellKey]?.entityType === "void") {
        return false;
      }

      // Add entity to collection
      this.entities.push({
        id: `entity_${Date.now()}`,
        type,
        x,
        y,
        color: "#000000",
        heading: "North",
        ...entity,
      });

      // Update grid status
      this.gridStatus[cellKey] = {
        ...this.gridStatus[cellKey],
        occupied: true,
        entityType: type,
      };

      return true;
    },

    // Waypoint management
    addWaypoint(waypoint) {
      this.waypoints.push({
        id: `waypoint_${Date.now()}`,
        positionInCell: "middle-center",
        ...waypoint,
      });

      this._notifyChange("waypoint_added", waypoint);
    },

    removeWaypoint(x, y, positionInCell) {
      const waypointIndex = this.waypoints.findIndex(
        (w) => w.x === x && w.y === y && w.positionInCell === positionInCell
      );

      if (waypointIndex !== -1) {
        this.waypoints.splice(waypointIndex, 1);

        const cellKey = `${x},${y}`;
        if (this.gridStatus[cellKey].waypoints) {
          this.gridStatus[cellKey].waypoints = this.gridStatus[
            cellKey
          ].waypoints.filter((w) => w.positionInCell !== positionInCell);
        }
        return true;
      }
      return false;
    },

    // Path management
    addPath(path) {
      this.paths.push({
        id: `path_${Date.now()}`,
        color: "#2196F3",
        waypoints: [],
        ...path,
      });

      this._notifyChange("path_added", path);
    },

    removePath(pathId) {
      const pathIndex = this.paths.findIndex((p) => p.id === pathId);
      if (pathIndex !== -1) {
        this.paths.splice(pathIndex, 1);
        if (this.selectedPath?.id === pathId) {
          this.selectedPath = null;
        }
      }
    },

    // Decision Box management
    addDBox(dbox) {
      this.dboxes.push({
        id: `dbox_${Date.now()}`,
        startX: dbox.startX,
        startY: dbox.startY,
        endX: dbox.endX,
        endY: dbox.endY,
        color: "#ff0000",
        label: `Decision_Box_${dbox.startX}_${dbox.startY}_${dbox.endX}_${dbox.endY}`,
        ...dbox,
      });
    },

    removeDBox(dboxId) {
      const dboxIndex = this.dboxes.findIndex((d) => d.id === dboxId);
      if (dboxIndex !== -1) {
        this.dboxes.splice(dboxIndex, 1);
        if (this.selectedDBox?.id === dboxId) {
          this.selectedDBox = null;
        }
      }
    },

    // Path creation mode
    startPathMode() {
      this.pathMode = true;
      this.canvasMode = "path";
      this.pathInProgress = {
        path: `#Path${Date.now()}`,
        waypoints: [],
      };
    },

    endPathMode() {
      this.pathMode = false;
      this.canvasMode = "default";
      if (this.pathInProgress?.waypoints.length >= 2) {
        this.addPath(this.pathInProgress);
      }
      this.pathInProgress = null;
    },

    addWaypointToPath(waypoint) {
      if (this.pathInProgress) {
        this.pathInProgress.waypoints.push(waypoint);
      }
    },

    // Transform operations
    setScale(scale) {
      this.scale = Math.max(0.1, Math.min(5.0, scale));
    },

    setTranslation(x, y) {
      this.translateX = x;
      this.translateY = y;
    },

    resetTransform() {
      this.scale = 1.0;
      this.translateX = 0;
      this.translateY = 0;
    },

    // Selection management
    selectPath(path) {
      this.selectedPath = path;
      this.propertyPanel = "path";
    },

    selectEntity(entity) {
      this.selectedEntity = entity;
      this.propertyPanel = "entity";
    },

    selectDBox(dbox) {
      this.selectedDBox = dbox;
      this.propertyPanel = "dbox";
    },

    selectCell(row, col) {
      this.currentCellPosition = [row, col];
      this.currentCellStatus = this.gridStatus[`${row},${col}`];
      this.propertyPanel = "waypoint";
    },

    // Scenario management
    async setScenario(scenario) {
      this.scenarioName = scenario.scenarioName?.split("#")[1] || null;
      this.mapName = scenario.scenarioMap || null;
      this.weather = scenario.weather || "Clear";
      this.category = scenario.category || "Urban";
      this.cameraPosition = scenario.cameraPosition || "up";

      if (scenario.entities) this.entities = scenario.entities;
      if (scenario.paths) this.paths = scenario.paths;
      if (scenario.waypoints) this.waypoints = scenario.waypoints;
      if (scenario.dboxes) this.dboxes = scenario.dboxes;

      // Load the map data when setting a scenario
      if (this.mapName) {
        try {
          console.log(`Attempting to load map: ${this.mapName}`);
          const response = await fetch(`/maps/${this.mapName}.json`);

          if (response.ok) {
            const text = await response.text();

            // Check if we got HTML instead of JSON (common in Electron when files are missing)
            if (
              text.trim().startsWith("<!DOCTYPE") ||
              text.trim().startsWith("<html")
            ) {
              console.warn(
                `Map file returned HTML instead of JSON for ${this.mapName}. This usually means the file doesn't exist or the server isn't serving static files properly.`
              );
              // Use a default/fallback map structure
              this.setMapData(this.createDefaultMapData(this.mapName));
            } else {
              const mapData = JSON.parse(text);
              this.setMapData(mapData);
              console.log(`Successfully loaded map: ${this.mapName}`);
            }
          } else {
            console.warn(
              `Could not load map: ${this.mapName}, status: ${response.status}`
            );
            // Use a default/fallback map structure
            this.setMapData(this.createDefaultMapData(this.mapName));
          }
        } catch (error) {
          console.error(`Error loading map ${this.mapName}:`, error);
          // Use a default/fallback map structure
          this.setMapData(this.createDefaultMapData(this.mapName));
        }
      }
    },

    // Create default map data when map files can't be loaded
    createDefaultMapData(mapName) {
      console.log(`Creating default map data for: ${mapName}`);

      // Basic map structure based on common CARJAN maps
      const defaultMaps = {
        "carjan-map01": {
          name: "CARJAN Map 01",
          description:
            "Classic CARJAN map with central road and sidewalks (default fallback)",
          bounds: { minX: -50, maxX: 50, minY: -50, maxY: 50 },
          gridSize: { width: 100, height: 100 },
          cellSize: 1.0,
          origin: { x: 0, y: 0 },
          roads: [],
          intersections: [],
          landmarks: [],
        },
        Town02: {
          name: "Town02",
          description: "Urban town with residential areas (default fallback)",
          bounds: { minX: -75, maxX: 75, minY: -75, maxY: 75 },
          gridSize: { width: 150, height: 150 },
          cellSize: 1.0,
          origin: { x: 0, y: 0 },
          roads: [],
          intersections: [],
          landmarks: [],
        },
        Town03: {
          name: "Town03",
          description: "Large urban environment (default fallback)",
          bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
          gridSize: { width: 200, height: 200 },
          cellSize: 1.0,
          origin: { x: 0, y: 0 },
          roads: [],
          intersections: [],
          landmarks: [],
        },
        Town04: {
          name: "Town04",
          description: "Highway and countryside (default fallback)",
          bounds: { minX: -200, maxX: 200, minY: -50, maxY: 50 },
          gridSize: { width: 400, height: 100 },
          cellSize: 1.0,
          origin: { x: 0, y: 0 },
          roads: [],
          intersections: [],
          landmarks: [],
        },
        Town05: {
          name: "Town05",
          description: "Urban environment with bridges (default fallback)",
          bounds: { minX: -80, maxX: 80, minY: -80, maxY: 80 },
          gridSize: { width: 160, height: 160 },
          cellSize: 1.0,
          origin: { x: 0, y: 0 },
          roads: [],
          intersections: [],
          landmarks: [],
        },
      };

      // Return specific map data or generic fallback
      if (defaultMaps[mapName]) {
        return defaultMaps[mapName];
      } else if (defaultMaps["carjan-map01"]) {
        // Always fallback to carjan-map01 if unknown
        return defaultMaps["carjan-map01"];
      } else {
        // Last resort: minimal map
        return {
          name: mapName,
          description: "Fallback map",
          bounds: { minX: -50, maxX: 50, minY: -50, maxY: 50 },
          gridSize: { width: 100, height: 100 },
          cellSize: 1.0,
          origin: { x: 0, y: 0 },
          roads: [],
          intersections: [],
          landmarks: [],
        };
      }
    },

    // Visibility toggles
    toggleGrid() {
      this.showGrid = !this.showGrid;
    },
    togglePaths() {
      this.showPaths = !this.showPaths;
    },
    toggleWaypoints() {
      this.showWaypoints = !this.showWaypoints;
    },
    toggleEntities() {
      this.showEntities = !this.showEntities;
    },
    toggleDBoxes() {
      this.showDBoxes = !this.showDBoxes;
    },

    // Loading state
    setLoading(loading) {
      this.loading = loading;
    },

    // Complete map animation
    completeMapAnimation() {
      this.mapAnimating = false;
    },

    // Reset entire scenario
    resetScenario() {
      this.entities = [];
      this.paths = [];
      this.waypoints = [];
      this.dboxes = [];
      this.selectedPath = null;
      this.selectedEntity = null;
      this.selectedDBox = null;
      this.scenarioName = null;
    },

    // Notify about changes for live streaming
    _notifyChange(changeType, data) {
      // This will be picked up by the store subscription
      console.log(`Grid change: ${changeType}`, data);
    },
  },
});
