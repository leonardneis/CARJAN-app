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
    propertyPanel: "scenario",
    currentCellPosition: [],
    currentCellStatus: null,

    // Colors
    colors: {
      road: "#4CAF50", // Green for roads
      path: "#2196F3", // Blue for paths
      void: "#333333", // Dark gray for void
      entity: "#FF9800", // Orange for entities
      waypoint: "#9C27B0", // Purple for waypoints
      path_selected: "#E91E63", // Pink for selected path
    },
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
        if (cellType === "p") return state.colors.path;
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
    },

    // Set map data and update grid
    setMapData(mapData) {
      this.mapData = mapData;
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

    // Entity management
    addEntity(entity) {
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

    removeEntity(x, y) {
      const entityIndex = this.entities.findIndex(
        (e) => e.x === x && e.y === y
      );
      if (entityIndex !== -1) {
        this.entities.splice(entityIndex, 1);

        const cellKey = `${x},${y}`;
        this.gridStatus[cellKey] = {
          ...this.gridStatus[cellKey],
          occupied: false,
          entityType: null,
        };
        return true;
      }
      return false;
    },

    // Waypoint management
    addWaypoint(waypoint) {
      const { x, y, positionInCell = "middle-center" } = waypoint;
      const cellKey = `${x},${y}`;

      // Add to waypoints collection
      this.waypoints.push({
        id: `waypoint_${Date.now()}`,
        x,
        y,
        positionInCell,
        ...waypoint,
      });

      // Update grid status
      if (!this.gridStatus[cellKey].waypoints) {
        this.gridStatus[cellKey].waypoints = [];
      }
      this.gridStatus[cellKey].waypoints.push(waypoint);
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
        path: `#Path${Date.now()}`,
        waypoints: [],
        color: "#2196F3",
        ...path,
      });
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
    setScenario(scenario) {
      this.scenarioName = scenario.scenarioName?.split("#")[1] || null;
      this.mapName = scenario.scenarioMap || null;
      this.weather = scenario.weather || "Clear";
      this.category = scenario.category || "Urban";
      this.cameraPosition = scenario.cameraPosition || "up";

      if (scenario.entities) this.entities = scenario.entities;
      if (scenario.paths) this.paths = scenario.paths;
      if (scenario.waypoints) this.waypoints = scenario.waypoints;
      if (scenario.dboxes) this.dboxes = scenario.dboxes;
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
  },
});
