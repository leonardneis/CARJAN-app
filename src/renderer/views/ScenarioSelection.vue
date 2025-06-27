<template>
  <div class="scenario-selection">
    <div class="selection-container">
      <!-- Header -->
      <div class="selection-header">
        <Button
          icon="pi pi-arrow-left"
          @click="goBack"
          text
          class="back-button"
          v-tooltip="'Back to Main Menu'"
        />
        <h1 class="selection-title">Select Scenario</h1>
      </div>

      <!-- Main Content Area -->
      <div class="selection-content">
        <!-- Left: Scenario List -->
        <div class="scenario-list-container">
          <div v-if="scenarios.length === 0" class="no-scenarios">
            <div class="empty-icon">
              <i class="pi pi-inbox"></i>
            </div>
            <h3>No scenarios available</h3>
            <p>Create a new scenario to get started!</p>
          </div>

          <div v-else class="scenario-list">
            <div
              v-for="scenario in scenarios"
              :key="scenario.id"
              class="scenario-item"
              :class="{ selected: selectedScenario?.id === scenario.id }"
              @click="selectScenario(scenario)"
            >
              <!-- Scenario Thumbnail -->
              <div class="scenario-thumbnail">
                <div class="thumbnail-image">
                  <img
                    v-if="scenario.thumbnailPath"
                    :src="scenario.thumbnailPath"
                    :alt="`${scenario.name} thumbnail`"
                    @error="onThumbnailError"
                  />
                  <i v-else class="pi pi-map"></i>
                </div>
              </div>

              <!-- Scenario Info -->
              <div class="scenario-info">
                <div class="scenario-name">{{ scenario.name }}</div>
                <div class="scenario-description" v-if="scenario.description">
                  {{ scenario.description }}
                </div>
                <div class="scenario-details">
                  <div class="detail-line">
                    <span class="detail-label">Map:</span>
                    <span class="detail-value">{{ scenario.mapName }}</span>
                  </div>
                  <div class="detail-line">
                    <span class="detail-label">Entities:</span>
                    <span class="detail-value">{{ scenario.entityCount }}</span>
                  </div>
                  <div class="detail-line">
                    <span class="detail-label">Last access:</span>
                    <span class="detail-value">{{
                      formatDate(scenario.lastModified)
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="scenario-actions">
                <i
                  class="pi pi-pencil action-icon edit-icon"
                  @click.stop="editScenario(scenario)"
                  v-tooltip.bottom="{ showDelay: 500, value: 'Edit' }"
                ></i>
                <i
                  class="pi pi-trash action-icon delete-icon"
                  @click.stop="deleteScenario(scenario)"
                  v-tooltip.bottom="{ showDelay: 500, value: 'Delete' }"
                ></i>
                <i
                  class="pi pi-copy action-icon duplicate-icon"
                  @click.stop="duplicateScenario(scenario)"
                  v-tooltip.bottom="{ showDelay: 500, value: 'Duplicate' }"
                ></i>
              </div>

              <!-- Selection Indicator -->
              <div
                v-if="selectedScenario?.id === scenario.id"
                class="selection-indicator"
              >
                <i class="pi pi-check"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Live Grid Preview -->
        <div class="grid-preview-container">
          <div v-if="!selectedScenario" class="default-grid-preview">
            <div class="preview-header">
              <h3>Grid Preview</h3>
              <div class="preview-info">
                <span>Select a scenario to see details</span>
              </div>
            </div>
            <!-- Default Grid -->
            <div class="grid-viewport">
              <div class="grid-room" :style="previewTransformStyle">
                <div
                  class="grid-main preview-grid default-grid"
                  :style="{
                    gridTemplateColumns: `repeat(8, 48px)`,
                    gridTemplateRows: `repeat(12, 40px)`,
                  }"
                >
                  <div
                    v-for="i in 96"
                    :key="`default-cell-${i}`"
                    class="grid-cell preview-cell default-cell"
                    :style="{
                      backgroundColor: '#1a1a1a',
                      width: '48px',
                      height: '40px',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="live-grid-preview">
            <div class="preview-header">
              <h3>{{ selectedScenario.name }}</h3>
              <div class="preview-info">
                <span
                  >Map:
                  {{ selectedScenario.mapName || selectedScenario.mapId }}</span
                >
                <span>{{ previewGridStore.entities.length }} Entities</span>
              </div>
            </div>

            <!-- Live Grid Component -->
            <div class="grid-viewport" ref="previewViewport">
              <div class="grid-room" :style="previewTransformStyle">
                <!-- Grid Container -->
                <div
                  class="grid-main preview-grid"
                  :class="{ 'grid-blurred': gridBlurred }"
                  ref="previewGridContainer"
                  :style="previewGridStyle"
                >
                  <!-- Grid Cells - Animation Version -->
                  <motion.div
                    v-if="!rippleAnimationComplete && isAnimating"
                    v-for="cell in previewGridStore.gridCells"
                    :key="`motion-cell-${cell.row}-${cell.col}`"
                    class="grid-cell preview-cell"
                    :class="getPreviewCellClasses(cell)"
                    :style="getPreviewCellStyle(cell)"
                    :data-row="cell.row"
                    :data-col="cell.col"
                    :initial="{ scale: 0, opacity: 0 }"
                    :animate="{
                      scale: [0, 1.1, 1],
                      opacity: [0, 0.8, 1],
                    }"
                    :transition="{
                      duration: 0.5,
                      delay: getCellAnimationDelay(cell),
                      ease: [0.25, 0.46, 0.45, 0.94],
                      times: [0, 0.7, 1],
                    }"
                  >
                    <!-- Waypoints in cell -->
                    <div
                      v-for="waypoint in getWaypointsInCell(cell)"
                      :key="waypoint.id"
                      class="waypoint-marker"
                      :data-position="waypoint.positionInCell"
                    >
                      <i class="pi pi-map-marker"></i>
                    </div>

                    <!-- Entity in cell -->
                    <div
                      v-if="getEntityInCell(cell)"
                      class="entity-marker"
                      :class="getEntityClasses(getEntityInCell(cell))"
                    >
                      <i :class="getEntityIcon(getEntityInCell(cell))"></i>
                      <!-- Entity direction chevron -->
                      <div
                        v-if="getEntityInCell(cell).heading"
                        class="entity-chevron"
                        :style="getChevronStyle(getEntityInCell(cell))"
                      >
                        <i class="pi pi-chevron-up"></i>
                      </div>
                    </div>
                  </motion.div>

                  <!-- Grid Cells - Performance Version (after animation) -->
                  <div
                    v-if="rippleAnimationComplete && !isAnimating"
                    v-for="cell in previewGridStore.gridCells"
                    :key="`div-cell-${cell.row}-${cell.col}`"
                    class="grid-cell preview-cell"
                    :class="getPreviewCellClasses(cell)"
                    :style="getPreviewCellStyle(cell)"
                    :data-row="cell.row"
                    :data-col="cell.col"
                  >
                    <!-- Waypoints in cell -->
                    <div
                      v-for="waypoint in getWaypointsInCell(cell)"
                      :key="waypoint.id"
                      class="waypoint-marker"
                      :data-position="waypoint.positionInCell"
                    >
                      <i class="pi pi-map-marker"></i>
                    </div>

                    <!-- Entity in cell -->
                    <div
                      v-if="getEntityInCell(cell)"
                      class="entity-marker"
                      :class="getEntityClasses(getEntityInCell(cell))"
                    >
                      <i :class="getEntityIcon(getEntityInCell(cell))"></i>
                      <!-- Entity direction chevron -->
                      <div
                        v-if="getEntityInCell(cell).heading"
                        class="entity-chevron"
                        :style="getChevronStyle(getEntityInCell(cell))"
                      >
                        <i class="pi pi-chevron-up"></i>
                      </div>
                    </div>
                  </div>

                  <!-- Path Overlay SVG -->
                  <svg
                    class="path-overlay"
                    width="100%"
                    height="100%"
                    v-if="previewGridStore.paths.length > 0"
                  >
                    <path
                      v-for="path in visiblePaths"
                      :key="path.id"
                      :d="getPathData(path)"
                      :stroke="
                        path.color || previewGridStore.colors.path_selected
                      "
                      stroke-width="3"
                      stroke-dasharray="6,6"
                      fill="none"
                      class="path-line"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <Button
          label="Load Scenario"
          @click="loadSelectedScenario"
          :disabled="!selectedScenario"
          class="action-button load-button"
          size="large"
        />
        <Button
          label="New Scenario"
          @click="createNewScenario"
          class="action-button create-button"
          size="large"
        />
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      :modal="true"
      header="Delete Scenario"
      class="delete-dialog"
    >
      <div class="delete-content">
        <div class="warning-icon">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <div class="warning-text">
          <p>
            <strong>'{{ selectedScenario?.name }}'</strong> will be deleted
            forever! (A very long time!)
          </p>
          <p>Are you sure?</p>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          @click="showDeleteDialog = false"
          text
          class="dialog-button"
        />
        <Button
          label="Delete"
          @click="confirmDelete"
          severity="danger"
          class="dialog-button"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { motion, animate } from "motion-v";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import scenarioService from "../services/scenarioService.js";
import ScenarioStorageService from "../services/ScenarioStorageService.js";
import MapService from "../services/MapService.js";

const router = useRouter();
const toast = useToast();
const storageService = new ScenarioStorageService();

// State
const scenarios = ref([]);
const selectedScenario = ref(null);
const showDeleteDialog = ref(false);

// Preview Grid State
const previewViewport = ref(null);
const previewGridContainer = ref(null);
const previewGridStore = ref({
  gridRows: 12,
  gridCols: 8,
  cellHeight: 40,
  cellWidth: 48,
  mapData: null,
  gridCells: [],
  gridStatus: {},
  entities: [],
  paths: [],
  waypoints: [],
  dboxes: [],
  colors: {
    road: "#6B9BD9",
    sidewalk: "#95A5C6",
    path: "#95A5C6",
    void: "#1a1a1a",
    entity: "#FF5722",
    waypoint: "#FFD700",
    path_selected: "#FF00FF",
  },
  scale: 0.7,
  translateX: 0,
  translateY: 0,
});

// Animation state
const animationCenter = ref({ row: 0, col: 0 });
const gridBlurred = ref(true);
const rippleAnimationComplete = ref(false);
const isAnimating = ref(false);
const animationTimeoutId = ref(null);

// Computed
const previewTransformStyle = computed(() => ({
  transform: `translate3d(${previewGridStore.value.translateX}px, ${previewGridStore.value.translateY}px, 0) scale(${previewGridStore.value.scale})`,
  transition: "transform 0.2s ease-out",
}));

const previewGridStyle = computed(() => {
  const cols = previewGridStore.value.gridCols;
  const rows = previewGridStore.value.gridRows;
  return {
    gridTemplateColumns: `repeat(${cols}, ${previewGridStore.value.cellWidth}px)`,
    gridTemplateRows: `repeat(${rows}, ${previewGridStore.value.cellHeight}px)`,
  };
});

const visiblePaths = computed(() => {
  return previewGridStore.value.paths.filter(
    (path) => path.waypoints && path.waypoints.length >= 2
  );
});

// Load scenarios using the new storage service
const loadScenarios = async () => {
  try {
    // Load from new storage service first
    let localScenarios = storageService.getAllScenarios();

    // If no local scenarios, try to load from central system as fallback
    if (localScenarios.length === 0) {
      try {
        const centralScenarios = await scenarioService.loadScenarios();
        // Convert central scenarios to new format if needed
        for (const scenario of centralScenarios) {
          if (scenario.data) {
            storageService.createScenario(
              {
                name: scenario.name,
                description: scenario.description,
                mapId: scenario.mapId,
                mapName: scenario.mapName,
                category: scenario.category || "Imported",
              },
              scenario.data
            );
          }
        }
        // Reload after conversion
        localScenarios = storageService.getAllScenarios();
      } catch (error) {
        console.warn("Could not load central scenarios:", error);
      }
    }

    scenarios.value = localScenarios;

    console.log(
      "Loaded scenarios:",
      scenarios.value.map((s) => ({ name: s.name, thumbnail: s.thumbnailPath }))
    );
  } catch (error) {
    console.error("Error loading scenarios:", error);
    scenarios.value = [];
  }
};

const selectScenario = async (scenario) => {
  // Prevent multiple rapid selections
  if (isAnimating.value) {
    // Cancel current animation
    clearTimeout(animationTimeoutId.value);
    isAnimating.value = false;
  }

  selectedScenario.value = scenario;

  // Load and preview the scenario
  await loadScenarioPreview(scenario);
};

const loadScenarioPreview = async (scenario) => {
  try {
    // Immediately hide grid and reset animation state
    gridBlurred.value = true;
    rippleAnimationComplete.value = false;
    isAnimating.value = true;

    // Reset preview grid state
    resetPreviewGrid();

    // Load map data for the scenario
    let mapData = null;
    if (scenario.mapId) {
      try {
        const mapResponse = await fetch(`/maps/${scenario.mapId}.json`);
        if (mapResponse.ok) {
          const fullMapData = await mapResponse.json();
          mapData = {
            mapData: fullMapData.grid.mapData,
            size: fullMapData.grid.dimensions,
          };
          console.log(`Loaded map ${scenario.mapId}:`, mapData);
        } else {
          console.warn(`Map file not found: /maps/${scenario.mapId}.json`);
        }
      } catch (error) {
        console.warn(`Could not load map ${scenario.mapId}:`, error);
      }
    } else if (scenario.mapName) {
      // Fallback to mapName for backwards compatibility
      try {
        mapData = await MapService.loadMap(`${scenario.mapName}.json`);
        console.log(`Loaded map ${scenario.mapName}:`, mapData);
      } catch (error) {
        console.warn(`Could not load map ${scenario.mapName}:`, error);
      }
    }

    // Load full scenario data if we have an ID
    let scenarioData = scenario.data;
    if (!scenarioData && scenario.id) {
      try {
        scenarioData = storageService.getScenarioData(scenario.id);
        console.log(`Loaded scenario data for ${scenario.name}:`, scenarioData);
      } catch (error) {
        console.warn(`Could not load scenario data for ${scenario.id}:`, error);
      }
    }

    // Set up preview grid with scenario data
    setupPreviewGrid(scenarioData, mapData);

    // Wait a bit to ensure DOM is updated, then trigger animation
    await nextTick();
    setTimeout(() => {
      if (isAnimating.value) {
        // Only if we're still supposed to animate
        triggerStaggerAnimation();
      }
    }, 50);
  } catch (error) {
    console.error("Error loading scenario preview:", error);
    isAnimating.value = false;
  }
};

const resetPreviewGrid = () => {
  previewGridStore.value.entities = [];
  previewGridStore.value.paths = [];
  previewGridStore.value.waypoints = [];
  previewGridStore.value.dboxes = [];
  previewGridStore.value.mapData = null;
  previewGridStore.value.gridCells = [];
  previewGridStore.value.gridStatus = {};
};

const setupPreviewGrid = (scenarioData, mapData) => {
  // Set map data and grid dimensions
  if (mapData) {
    previewGridStore.value.mapData = mapData.mapData || mapData;
    if (mapData.size) {
      previewGridStore.value.gridRows = mapData.size.rows;
      previewGridStore.value.gridCols = mapData.size.cols;
    }
    console.log(
      `Grid dimensions set to: ${previewGridStore.value.gridRows}x${previewGridStore.value.gridCols}`
    );
    console.log("Map data loaded:", previewGridStore.value.mapData);
  } else {
    // Default grid size if no map data
    previewGridStore.value.gridRows = 12;
    previewGridStore.value.gridCols = 8;
    previewGridStore.value.mapData = null;
    console.log("Using default grid dimensions: 12x8");
  }

  // Initialize grid cells first
  initializePreviewGrid();

  // Load scenario entities, paths, waypoints if available
  if (scenarioData) {
    if (scenarioData.entities && Array.isArray(scenarioData.entities)) {
      // Convert position format if needed (position.x/y instead of x/y)
      previewGridStore.value.entities = scenarioData.entities.map((entity) => ({
        ...entity,
        x: entity.position ? entity.position.x : entity.x,
        y: entity.position ? entity.position.y : entity.y,
      }));
      console.log(`Loaded ${scenarioData.entities.length} entities`);
    }
    if (scenarioData.paths && Array.isArray(scenarioData.paths)) {
      previewGridStore.value.paths = [...scenarioData.paths];
      console.log(`Loaded ${scenarioData.paths.length} paths`);
    }
    if (scenarioData.waypoints && Array.isArray(scenarioData.waypoints)) {
      // Convert position format if needed
      previewGridStore.value.waypoints = scenarioData.waypoints.map(
        (waypoint) => ({
          ...waypoint,
          x: waypoint.position ? waypoint.position.x : waypoint.x,
          y: waypoint.position ? waypoint.position.y : waypoint.y,
        })
      );
      console.log(`Loaded ${scenarioData.waypoints.length} waypoints`);
    }
  }

  // Update grid status after all data is loaded
  updatePreviewGridStatus();

  console.log(
    `Preview grid setup complete with ${previewGridStore.value.gridCells.length} cells`
  );
};

const initializePreviewGrid = () => {
  const cells = [];
  const status = {};

  for (let row = 0; row < previewGridStore.value.gridRows; row++) {
    for (let col = 0; col < previewGridStore.value.gridCols; col++) {
      cells.push({ row, col });
      status[`${row},${col}`] = {
        occupied: false,
        entityType: null,
        waypoints: [],
        sidewalk: false,
      };
    }
  }

  previewGridStore.value.gridCells = cells;
  previewGridStore.value.gridStatus = status;
};

const updatePreviewGridStatus = () => {
  // Initialize all cells first
  for (let row = 0; row < previewGridStore.value.gridRows; row++) {
    for (let col = 0; col < previewGridStore.value.gridCols; col++) {
      const cellKey = `${row},${col}`;
      previewGridStore.value.gridStatus[cellKey] = {
        occupied: false,
        entityType: null,
        waypoints: [],
        sidewalk: false,
      };
    }
  }

  // Apply map data if available
  if (previewGridStore.value.mapData) {
    for (let row = 0; row < previewGridStore.value.gridRows; row++) {
      for (let col = 0; col < previewGridStore.value.gridCols; col++) {
        const cellType = previewGridStore.value.mapData[row]?.[col];
        const cellKey = `${row},${col}`;

        if (cellType === "r") {
          // Road cell
          previewGridStore.value.gridStatus[cellKey].occupied = false;
          previewGridStore.value.gridStatus[cellKey].sidewalk = false;
        } else if (cellType === "s" || cellType === "p") {
          // Sidewalk/path cell
          previewGridStore.value.gridStatus[cellKey].occupied = false;
          previewGridStore.value.gridStatus[cellKey].sidewalk = true;
        } else {
          // Void or undefined cell
          previewGridStore.value.gridStatus[cellKey].occupied = true;
          previewGridStore.value.gridStatus[cellKey].entityType = "void";
        }
      }
    }
  }

  // Mark entity positions as occupied
  previewGridStore.value.entities.forEach((entity) => {
    const cellKey = `${entity.x},${entity.y}`;
    if (previewGridStore.value.gridStatus[cellKey]) {
      previewGridStore.value.gridStatus[cellKey].occupied = true;
      previewGridStore.value.gridStatus[cellKey].entityType = entity.type;
    }
  });
};

const triggerStaggerAnimation = () => {
  // Clear any existing timeout
  if (animationTimeoutId.value) {
    clearTimeout(animationTimeoutId.value);
  }

  // Reset animation state
  gridBlurred.value = true;
  rippleAnimationComplete.value = false;
  isAnimating.value = true;

  // Generate random center for animation
  animationCenter.value = {
    row: Math.floor(Math.random() * previewGridStore.value.gridRows),
    col: Math.floor(Math.random() * previewGridStore.value.gridCols),
  };

  // Calculate animation completion time (slightly faster)
  const maxDistance = Math.max(
    previewGridStore.value.gridRows,
    previewGridStore.value.gridCols
  );
  const maxDelay = maxDistance * 0.06; // Slightly faster delay multiplier
  const animationDuration = 0.5; // Moderate duration
  const totalTime = maxDelay + animationDuration;
  const switchTime = totalTime + 0.3; // Wait before switching

  // Complete animation and remove blur
  animationTimeoutId.value = setTimeout(() => {
    if (isAnimating.value) {
      // Only complete if we're still animating
      gridBlurred.value = false;
      rippleAnimationComplete.value = true;
      isAnimating.value = false;
      animationTimeoutId.value = null;
    }
  }, switchTime * 1000);
};

const getCellAnimationDelay = (cell) => {
  const distance =
    Math.abs(cell.row - animationCenter.value.row) +
    Math.abs(cell.col - animationCenter.value.col);
  return distance * 0.06; // Moderate delay multiplier for preview
};

// Preview Grid Rendering Methods
const getPreviewCellClasses = (cell) => {
  const classes = [];
  const cellStatus =
    previewGridStore.value.gridStatus[`${cell.row},${cell.col}`];

  if (cellStatus?.occupied && cellStatus.entityType === "void") {
    classes.push("cell-void");
  }
  if (cellStatus?.sidewalk) {
    classes.push("cell-sidewalk");
  }

  return classes;
};

const getPreviewCellStyle = (cell) => {
  const mapData = previewGridStore.value.mapData;
  let backgroundColor = previewGridStore.value.colors.void;

  if (
    mapData &&
    mapData[cell.row] &&
    mapData[cell.row][cell.col] !== undefined
  ) {
    const cellType = mapData[cell.row][cell.col];
    if (cellType === "r") {
      backgroundColor = previewGridStore.value.colors.road;
    } else if (cellType === "s" || cellType === "p") {
      backgroundColor = previewGridStore.value.colors.sidewalk;
    }
    // else: undefined/void cells remain with void color
  }

  return {
    backgroundColor,
    width: `${previewGridStore.value.cellWidth}px`,
    height: `${previewGridStore.value.cellHeight}px`,
  };
};

const getWaypointsInCell = (cell) => {
  return previewGridStore.value.waypoints.filter(
    (waypoint) => waypoint.x === cell.row && waypoint.y === cell.col
  );
};

const getEntityInCell = (cell) => {
  return previewGridStore.value.entities.find(
    (entity) => entity.x === cell.row && entity.y === cell.col
  );
};

const getEntityClasses = (entity) => {
  const classes = ["entity-marker"];
  if (entity.type) {
    classes.push(`entity-${entity.type.toLowerCase()}`);
  }
  return classes;
};

const getEntityIcon = (entity) => {
  const iconMap = {
    vehicle: "pi pi-car",
    pedestrian: "pi pi-user",
    bike: "pi pi-car", // Placeholder
    truck: "pi pi-car",
    bus: "pi pi-car",
  };
  return iconMap[entity.type] || "pi pi-circle";
};

const getChevronStyle = (entity) => {
  const rotationMap = {
    North: "0deg",
    East: "90deg",
    South: "180deg",
    West: "270deg",
  };
  return {
    transform: `rotate(${rotationMap[entity.heading] || "0deg"})`,
  };
};

const getPathData = (path) => {
  if (!path.waypoints || path.waypoints.length < 2) return "";

  let pathData = "";
  path.waypoints.forEach((waypoint, index) => {
    const x =
      waypoint.y * previewGridStore.value.cellWidth +
      previewGridStore.value.cellWidth / 2;
    const y =
      waypoint.x * previewGridStore.value.cellHeight +
      previewGridStore.value.cellHeight / 2;

    if (index === 0) {
      pathData += `M ${x} ${y}`;
    } else {
      pathData += ` L ${x} ${y}`;
    }
  });

  return pathData;
};

const loadSelectedScenario = () => {
  if (!selectedScenario.value) return;

  toast.add({
    severity: "info",
    summary: "Loading Scenario",
    detail: `Loading ${selectedScenario.value.name}...`,
    life: 2000,
  });

  // Navigate to editor with selected scenario
  router.push({
    name: "CarjanEditor",
    query: {
      scenario: selectedScenario.value.id,
    },
  });
};

const createNewScenario = () => {
  router.push("/new");
};

const confirmDelete = () => {
  if (!selectedScenario.value) return;

  try {
    // Delete using storage service
    storageService.deleteScenario(selectedScenario.value.id);

    // Update local list
    const index = scenarios.value.findIndex(
      (s) => s.id === selectedScenario.value.id
    );
    if (index !== -1) {
      scenarios.value.splice(index, 1);
    }

    toast.add({
      severity: "success",
      summary: "Scenario Deleted",
      detail: `${selectedScenario.value.name} has been deleted forever!`,
      life: 3000,
    });

    selectedScenario.value = null;
  } catch (error) {
    console.error("Error deleting scenario:", error);
    toast.add({
      severity: "error",
      summary: "Delete Failed",
      detail: "Could not delete scenario",
      life: 3000,
    });
  }

  showDeleteDialog.value = false;
};

const goBack = () => {
  router.push("/main-menu");
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const editScenario = (scenario) => {
  selectedScenario.value = scenario;
  loadSelectedScenario();
};

const deleteScenario = (scenario) => {
  selectedScenario.value = scenario;
  showDeleteDialog.value = true;
};

const duplicateScenario = (scenario) => {
  try {
    const newScenarioId = storageService.duplicateScenario(scenario.id);

    // Reload scenarios to include the new one
    loadScenarios();

    toast.add({
      severity: "success",
      summary: "Scenario Duplicated",
      detail: `${scenario.name} has been duplicated`,
      life: 3000,
    });
  } catch (error) {
    console.error("Error duplicating scenario:", error);
    toast.add({
      severity: "error",
      summary: "Duplicate Failed",
      detail: "Could not duplicate scenario",
      life: 3000,
    });
  }
};

const onThumbnailError = (event) => {
  console.warn("Thumbnail failed to load:", event.target.src);
  // Hide broken image and show fallback icon
  event.target.style.display = "none";
  if (!event.target.parentNode.querySelector(".pi-map")) {
    const fallbackIcon = document.createElement("i");
    fallbackIcon.className = "pi pi-map";
    fallbackIcon.style.fontSize = "2rem";
    fallbackIcon.style.color = "rgba(255,255,255,0.6)";
    event.target.parentNode.appendChild(fallbackIcon);
  }
};

const refreshScenariosFromCentral = async () => {
  try {
    // Clear local storage and reload
    storageService.clearAllScenarios();
    await loadScenarios();

    toast.add({
      severity: "success",
      summary: "Scenarios Refreshed",
      detail: "Scenarios have been refreshed",
      life: 3000,
    });
  } catch (error) {
    console.error("Error refreshing scenarios:", error);
    toast.add({
      severity: "error",
      summary: "Refresh Failed",
      detail: "Failed to refresh scenarios",
      life: 5000,
    });
  }
};

onMounted(async () => {
  await loadScenarios();
});

onUnmounted(() => {
  // Clear any pending animations on unmount
  if (animationTimeoutId.value) {
    clearTimeout(animationTimeoutId.value);
  }
});
</script>

<style scoped>
.scenario-selection {
  min-height: 100vh;
  background: radial-gradient(circle at 40% 40%, #2c2f35 0%, #141619 100%);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-container {
  width: 100%;
  max-width: 1600px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(20px);
}

.selection-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  height: 600px;
}

.scenario-list-container {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow-y: auto;
}

.selection-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-button {
  color: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  background: rgba(255, 255, 255, 0.1) !important;
  padding: 0.75rem !important;
}

.back-button:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.2) !important;
}

.selection-title {
  color: white;
  font-size: 2.2rem;
  margin: 0;
  font-weight: 500;
}

/* Grid Preview Styles */
.grid-preview-container {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.default-grid-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.no-selection-preview {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.default-grid {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(8px) !important;
  border-radius: 8px !important;
  padding: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.default-cell {
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  transition: all 0.2s ease;
  backdrop-filter: blur(2px);
  border-radius: 2px;
  overflow: hidden;
  background-color: #1a1a1a !important;
}

.default-cell:hover {
  border-color: rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.1);
}

.live-grid-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-header h3 {
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
}

.preview-info {
  display: flex;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.animation-indicator {
  color: #4caf50;
  font-weight: 500;
}

.grid-viewport {
  flex: 1;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%);
  border-radius: 0 0 8px 8px;
  position: relative;
}

.grid-viewport::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
      circle at 25% 25%,
      rgba(107, 155, 217, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 75% 75%,
      rgba(149, 165, 198, 0.1) 0%,
      transparent 50%
    );
  pointer-events: none;
  z-index: 1;
}

.grid-room {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transform-origin: center center;
  z-index: 2;
}

.grid-main.preview-grid {
  position: relative;
  display: grid;
  gap: 1px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: backdrop-filter 0.8s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.grid-main.preview-grid.grid-blurred {
  backdrop-filter: blur(20px);
}

.preview-cell {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  backdrop-filter: blur(2px);
  border-radius: 2px;
  overflow: hidden;
}

.preview-cell:hover {
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.1);
}

.preview-cell.cell-void {
  background-color: #1a1a1a !important;
  opacity: 0.95;
  border-color: rgba(255, 255, 255, 0.05);
}

.preview-cell.cell-sidewalk {
  border: 1px dashed rgba(255, 255, 255, 0.3);
  box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.1);
}

.path-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.path-line {
  transition: stroke-width 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  stroke-linecap: round;
  stroke-linejoin: round;
}

.waypoint-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #9c27b0;
  font-size: 14px;
  transition: all 0.3s ease;
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.entity-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  color: #ff9800;
  transition: all 0.3s ease;
  z-index: 5;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.entity-marker:hover {
  transform: translate(-50%, -50%) scale(1.2);
}

.entity-chevron {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 8px;
  color: #666;
  transition: transform 0.3s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.no-scenarios {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.scenario-list {
  padding: 1rem;
}

.scenario-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  margin-bottom: 0.5rem;
  position: relative;
}

.scenario-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.scenario-item.selected {
  background: rgba(74, 144, 226, 0.2);
  border-color: #4a90e2;
  box-shadow: 0 0 15px rgba(74, 144, 226, 0.3);
}

.scenario-thumbnail {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 2rem;
}

.thumbnail-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
}

.scenario-info {
  flex: 1;
  min-width: 0;
}

.scenario-name {
  color: white;
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.scenario-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.scenario-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-line {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.detail-label {
  color: rgba(255, 255, 255, 0.6);
  min-width: 80px;
}

.detail-value {
  color: rgba(255, 255, 255, 0.8);
}

.selection-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: #4a90e2;
  font-size: 1.2rem;
}

.action-buttons {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-top: 1rem;
}

.action-button {
  height: 50px;
  font-size: 1rem;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 200px;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.action-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  transition: left 0.5s;
}

.action-button:hover:not(:disabled)::before {
  left: 100%;
}

.load-button {
  border: 2px solid #4a90e2 !important;
  color: #4a90e2 !important;
}

.load-button::before {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(74, 144, 226, 0.1),
    transparent
  );
}

.load-button:hover:not(:disabled) {
  background: rgba(74, 144, 226, 0.15) !important;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(74, 144, 226, 0.2);
  border-color: #5ba0f2 !important;
  color: #5ba0f2 !important;
}

.create-button {
  border: 2px solid #28a745 !important;
  color: #28a745 !important;
}

.create-button::before {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(40, 167, 69, 0.1),
    transparent
  );
}

.create-button:hover {
  background: rgba(40, 167, 69, 0.15) !important;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(40, 167, 69, 0.2);
  border-color: #34ce57 !important;
  color: #34ce57 !important;
}

.action-button:active:not(:disabled) {
  transform: translateY(-1px) scale(1.01);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Delete Dialog Styles */
.delete-dialog {
  background: rgba(0, 0, 0, 0.8) !important;
}

.delete-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.warning-icon {
  color: #ffc107;
  font-size: 3rem;
}

.warning-text {
  flex: 1;
}

.warning-text p {
  margin: 0.5rem 0;
  color: white;
}

.dialog-button {
  margin: 0 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    gap: 1rem;
  }

  .action-button {
    min-width: auto;
  }

  .selection-container {
    padding: 1rem;
  }

  .scenario-item {
    flex-direction: column;
    text-align: center;
  }

  .scenario-actions {
    flex-direction: row;
    min-width: auto;
  }
}

/* Custom Scrollbar */
.scenario-list-container::-webkit-scrollbar {
  width: 8px;
}

.scenario-list-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.scenario-list-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.scenario-list-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.scenario-actions {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: center;
  min-width: 100px;
  justify-content: flex-end;
}

.action-icon {
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-icon:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.edit-icon {
  color: #28a745 !important;
}

.edit-icon:hover {
  background: rgba(40, 167, 69, 0.2) !important;
  border-color: #28a745 !important;
}

.delete-icon {
  color: #dc3545 !important;
}

.delete-icon:hover {
  background: rgba(220, 53, 69, 0.2) !important;
  border-color: #dc3545 !important;
}

.duplicate-icon {
  color: #007bff !important;
}

.duplicate-icon:hover {
  background: rgba(0, 123, 255, 0.2) !important;
  border-color: #007bff !important;
}
</style>
