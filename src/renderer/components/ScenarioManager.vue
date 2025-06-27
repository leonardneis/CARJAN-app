<template>
  <div class="scenario-manager">
    <div class="manager-container">
      <!-- Header -->
      <div class="manager-header">
        <Button
          icon="pi pi-arrow-left"
          @click="goBack"
          text
          class="back-button"
        />
        <h1 class="manager-title">Create New Scenario</h1>
      </div>

      <!-- Main Content Area -->
      <div class="manager-content">
        <!-- Left: Map Templates -->
        <div class="map-list-container">
          <div class="panel-header">
            <h2>Map Templates</h2>
            <div class="category-filter">
              <Button
                label="All"
                :class="{ 'p-button-outlined': selectedCategory !== null }"
                @click="selectCategory(null)"
                size="small"
                class="category-btn"
              />
              <Button
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :class="{
                  'p-button-outlined': selectedCategory !== category.id,
                }"
                @click="selectCategory(category.id)"
                size="small"
                class="category-btn"
              />
            </div>
          </div>

          <div v-if="filteredMaps.length === 0" class="no-maps">
            <div class="empty-icon">
              <i class="pi pi-inbox"></i>
            </div>
            <h3>No maps available</h3>
            <p>Check your map templates!</p>
          </div>

          <div v-else class="map-list">
            <div
              v-for="map in filteredMaps"
              :key="map.id"
              class="map-item"
              :class="{ selected: selectedMapId === map.id }"
              @click="selectMapTemplate(map)"
            >
              <!-- Map Thumbnail -->
              <div class="map-thumbnail">
                <div class="thumbnail-image">
                  <img
                    v-if="map.thumbnail"
                    :src="map.thumbnail"
                    :alt="`${map.name} thumbnail`"
                    @error="onMapThumbnailError"
                  />
                  <i v-else class="pi pi-map"></i>
                </div>
              </div>

              <!-- Map Info -->
              <div class="map-info">
                <div class="map-name">{{ map.name }}</div>
                <div class="map-description" v-if="map.description">
                  {{ map.description }}
                </div>
                <div class="map-details">
                  <div class="detail-line">
                    <span class="detail-label">Category:</span>
                    <span class="detail-value">{{ map.category }}</span>
                  </div>
                  <div class="detail-line">
                    <span class="detail-label">Size:</span>
                    <span class="detail-value">{{
                      getMapDimensions(map)
                    }}</span>
                  </div>
                </div>
              </div>

              <!-- Selection Indicator -->
              <div v-if="selectedMapId === map.id" class="selection-indicator">
                <i class="pi pi-check"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Live Grid Preview and Creation -->
        <div class="grid-preview-container">
          <div class="preview-header">
            <!-- Scenario Name and Action Button Row -->
            <div class="title-action-row">
              <div class="scenario-title-section">
                <InputText
                  v-model="scenarioName"
                  placeholder="Enter scenario name..."
                  class="scenario-title-input"
                />
              </div>

              <!-- Create Button (moved here) -->
              <Button
                :label="creatingScenario ? 'Creating...' : 'Create'"
                icon="pi pi-plus"
                @click="createNewScenario"
                :disabled="
                  !selectedMapId || !scenarioName.trim() || creatingScenario
                "
                :loading="creatingScenario"
                size="small"
                class="action-button create-button-inline"
              />
            </div>

            <!-- Map Info as Subtitle -->
            <div class="map-subtitle">
              <span v-if="!selectedMapData"
                >Select a map template to see preview</span
              >
              <span v-else
                >{{ selectedMapData.name || "Map Preview" }} •
                {{ getMapDimensions(selectedMapData) }}</span
              >
            </div>
          </div>

          <div v-if="!selectedMapData" class="default-grid-preview">
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
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <Dialog
      v-model:visible="showConfirmDialog"
      :modal="true"
      header="Replace Current Work?"
      class="confirm-dialog"
    >
      <div class="confirmation-content">
        <div class="warning-icon">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <div class="warning-text">
          <p>Creating a new scenario will replace your current work.</p>
          <p>
            <strong>All entities, paths, and waypoints will be lost.</strong>
          </p>
          <p>Are you sure you want to continue?</p>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          @click="showConfirmDialog = false"
          text
          severity="secondary"
          class="dialog-button"
        />
        <Button
          label="Create New Scenario"
          @click="confirmCreateScenario"
          severity="danger"
          icon="pi pi-check"
          class="dialog-button"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { motion, animate } from "motion-v";
import { useGridStore } from "../store/grid";
import MapService from "../services/MapService";
import ScenarioStorageService from "../services/ScenarioStorageService";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Dialog from "primevue/dialog";

const router = useRouter();
const toast = useToast();
const gridStore = useGridStore();
const storageService = new ScenarioStorageService();

// State
const availableMaps = ref([]);
const categories = ref([]);
const selectedCategory = ref(null);
const selectedMapId = ref(null);
const selectedMapData = ref(null);
const scenarioName = ref("");
const creatingScenario = ref(false);
const showConfirmDialog = ref(false);

// Preview Grid State (similar to ScenarioSelection)
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
  colors: {
    road: "#6B9BD9",
    sidewalk: "#95A5C6",
    path: "#95A5C6",
    void: "#1a1a1a",
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

// Filtered maps based on category
const filteredMaps = computed(() => {
  if (!selectedCategory.value) return availableMaps.value;
  return availableMaps.value.filter(
    (map) => map.category.toLowerCase() === selectedCategory.value
  );
});

// Load maps from index
const loadData = async () => {
  try {
    const mapsData = await MapService.loadMapsIndex();
    availableMaps.value = mapsData.maps;
    categories.value = mapsData.categories;
    console.log("Loaded maps:", availableMaps.value.length);
    console.log("Loaded categories:", categories.value);
  } catch (error) {
    console.error("Error loading maps:", error);
    toast.add({
      severity: "error",
      summary: "Loading Error",
      detail: "Failed to load maps",
      life: 3000,
    });
  }
};

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId;
};

const selectMapTemplate = async (map) => {
  // Prevent multiple rapid selections
  if (isAnimating.value) {
    clearTimeout(animationTimeoutId.value);
    isAnimating.value = false;
  }

  selectedMapId.value = map.id;

  // Set default scenario name if empty
  if (!scenarioName.value.trim()) {
    scenarioName.value = `New Scenario - ${map.name}`;
  }

  try {
    console.log("Loading map:", map.file);
    // Load full map data for preview using the corrected path
    const mapData = await MapService.loadMap(map.file);
    selectedMapData.value = mapData;

    // Load and preview the map
    await loadMapPreview(mapData);
  } catch (error) {
    console.error("Error loading map data:", error);
    toast.add({
      severity: "error",
      summary: "Loading Error",
      detail: `Failed to load ${map.name}`,
      life: 3000,
    });
  }
};

const loadMapPreview = async (mapData) => {
  try {
    // Immediately hide grid and reset animation state
    gridBlurred.value = true;
    rippleAnimationComplete.value = false;
    isAnimating.value = true;

    // Reset preview grid state
    resetPreviewGrid();

    // Set up preview grid with map data
    setupPreviewGrid(mapData);

    // Wait a bit to ensure DOM is updated, then trigger animation
    await nextTick();
    setTimeout(() => {
      if (isAnimating.value) {
        triggerStaggerAnimation();
      }
    }, 50);
  } catch (error) {
    console.error("Error loading map preview:", error);
    isAnimating.value = false;
  }
};

const resetPreviewGrid = () => {
  previewGridStore.value.mapData = null;
  previewGridStore.value.gridCells = [];
  previewGridStore.value.gridStatus = {};
};

const setupPreviewGrid = (mapData) => {
  // Set map data and grid dimensions using MapService helpers
  if (mapData) {
    previewGridStore.value.mapData = MapService.getMapData(mapData);
    const dimensions = MapService.getMapDimensions(mapData);
    previewGridStore.value.gridRows = dimensions.rows;
    previewGridStore.value.gridCols = dimensions.cols;

    console.log(
      `Grid dimensions set to: ${dimensions.rows}x${dimensions.cols}`
    );
    console.log("Map data loaded:", previewGridStore.value.mapData);
  } else {
    // Default grid size if no map data
    previewGridStore.value.gridRows = 12;
    previewGridStore.value.gridCols = 8;
    previewGridStore.value.mapData = null;
    console.log("Using default grid dimensions: 12x8");
  }

  // Initialize grid cells
  initializePreviewGrid();
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

  // Calculate animation completion time
  const maxDistance = Math.max(
    previewGridStore.value.gridRows,
    previewGridStore.value.gridCols
  );
  const maxDelay = maxDistance * 0.06;
  const animationDuration = 0.5;
  const totalTime = maxDelay + animationDuration;
  const switchTime = totalTime + 0.3;

  // Complete animation and remove blur
  animationTimeoutId.value = setTimeout(() => {
    if (isAnimating.value) {
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
  return distance * 0.06;
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
  }

  return {
    backgroundColor,
    width: `${previewGridStore.value.cellWidth}px`,
    height: `${previewGridStore.value.cellHeight}px`,
  };
};

const getMapDimensions = (map) => {
  if (!map) return "12×8";

  if (map.grid && map.grid.dimensions) {
    return `${map.grid.dimensions.rows}×${map.grid.dimensions.cols}`;
  } else if (selectedMapData.value) {
    const dimensions = MapService.getMapDimensions(selectedMapData.value);
    return `${dimensions.rows}×${dimensions.cols}`;
  }
  return "12×8";
};

const onMapThumbnailError = (event) => {
  console.warn("Map thumbnail failed to load:", event.target.src);
  event.target.style.display = "none";
  if (!event.target.parentNode.querySelector(".pi-map")) {
    const fallbackIcon = document.createElement("i");
    fallbackIcon.className = "pi pi-map";
    fallbackIcon.style.fontSize = "2rem";
    fallbackIcon.style.color = "rgba(255,255,255,0.6)";
    event.target.parentNode.appendChild(fallbackIcon);
  }
};

const createNewScenario = () => {
  if (!selectedMapId.value || !scenarioName.value.trim()) return;

  // Check if there's existing work
  const hasWork =
    gridStore.entities.length > 0 ||
    gridStore.paths.length > 0 ||
    gridStore.waypoints.length > 0;

  if (hasWork) {
    showConfirmDialog.value = true;
  } else {
    confirmCreateScenario();
  }
};

const confirmCreateScenario = async () => {
  showConfirmDialog.value = false;
  creatingScenario.value = true;

  try {
    // Use the already loaded map data
    if (!selectedMapData.value) {
      throw new Error("No map data available");
    }

    const selectedMap = availableMaps.value.find(
      (m) => m.id === selectedMapId.value
    );
    if (!selectedMap) {
      throw new Error("Selected map not found");
    }

    // Clear existing data in grid store
    gridStore.entities.length = 0;
    gridStore.paths.length = 0;
    gridStore.waypoints.length = 0;
    gridStore.dboxes.length = 0;

    // Convert map data to the format expected by gridStore
    const mapDataForStore = {
      name: selectedMapData.value.name || selectedMap.name,
      category: selectedMapData.value.category || selectedMap.category,
      mapData: MapService.getMapData(selectedMapData.value), // Extract the actual grid data
      size: MapService.getMapDimensions(selectedMapData.value), // Get dimensions
    };

    console.log("Converted map data for store:", mapDataForStore);

    // Load map data into the grid store
    gridStore.loadMapFromData(mapDataForStore);

    // Set scenario name
    gridStore.scenarioName = scenarioName.value.trim();

    // Create scenario metadata
    const scenarioMetadata = {
      name: scenarioName.value.trim(),
      description: `Scenario created with ${selectedMap.name}`,
      mapId: selectedMap.id,
      mapName: selectedMap.name,
      category: selectedMap.category || "Custom",
    };

    // Create scenario data
    const scenarioData = {
      name: scenarioName.value.trim(),
      mapId: selectedMap.id,
      entities: [],
      paths: [],
      waypoints: [],
      dboxes: [],
      settings: {
        weather: "Clear",
        category: selectedMap.category || "Custom",
        cameraPosition: "up",
      },
    };

    // Save scenario using storage service
    const newScenarioId = storageService.createScenario(
      scenarioMetadata,
      scenarioData
    );

    console.log(`Created new scenario with ID: ${newScenarioId}`);

    toast.add({
      severity: "success",
      summary: "Scenario Created",
      detail: `"${scenarioName.value}" created successfully`,
      life: 3000,
    });

    // Navigate to editor
    router.push("/carjan");
  } catch (error) {
    console.error("Error creating scenario:", error);
    toast.add({
      severity: "error",
      summary: "Creation Error",
      detail: "Failed to create new scenario",
      life: 3000,
    });
  } finally {
    creatingScenario.value = false;
  }
};

const goBack = () => {
  router.push("/scenario-selection");
};

onMounted(() => {
  loadData();
});

onUnmounted(() => {
  // Clear any pending animations on unmount
  if (animationTimeoutId.value) {
    clearTimeout(animationTimeoutId.value);
  }
});
</script>

<style scoped>
.scenario-manager {
  min-height: 100vh;
  background: radial-gradient(circle at 40% 40%, #2c2f35 0%, #141619 100%);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.manager-container {
  width: 100%;
  max-width: 1600px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(20px);
}

.manager-header {
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

.manager-title {
  color: white;
  font-size: 2.2rem;
  margin: 0;
  font-weight: 500;
}

.manager-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  height: 580px;
}

/* Left Panel: Map Templates */
.map-list-container {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow-y: auto;
  height: 580px;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h2 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 300;
  color: white;
}

.category-filter {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-btn {
  font-size: 0.85rem !important;
  padding: 0.4rem 0.8rem !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: rgba(255, 255, 255, 0.8) !important;
  transition: all 0.3s ease;
}

.category-btn:not(.p-button-outlined) {
  background: rgba(74, 144, 226, 0.8) !important;
  border-color: #4a90e2 !important;
  color: white !important;
}

.category-btn:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

.no-maps {
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

.map-list {
  padding: 1rem;
}

.map-item {
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

.map-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.map-item.selected {
  background: rgba(74, 144, 226, 0.2);
  border-color: #4a90e2;
  box-shadow: 0 0 15px rgba(74, 144, 226, 0.3);
}

.map-thumbnail {
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

.map-info {
  flex: 1;
  min-width: 0;
}

.map-name {
  color: white;
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.map-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.map-details {
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

/* Right Panel: Grid Preview and Creation */
.grid-preview-container {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: 580px;
  overflow: hidden;
}

.preview-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.2);
}

.title-action-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 0.75rem;
  margin-top: 0.5rem;
}

.scenario-title-section {
  flex: 1;
  max-width: 65%;
}

.scenario-title-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1.4rem;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  text-align: left;
}

.scenario-title-input:focus {
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
  outline: none;
}

.scenario-title-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

.create-button-inline {
  height: 50px;
  font-size: 0.95rem;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 130px;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 2px solid #28a745 !important;
  color: #28a745 !important;
  flex-shrink: 0;
  font-weight: 600;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.create-button-inline::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(40, 167, 69, 0.1),
    transparent
  );
  transition: left 0.5s;
}

.create-button-inline:hover:not(:disabled) {
  background: rgba(40, 167, 69, 0.15) !important;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 25px rgba(40, 167, 69, 0.2);
  border-color: #34ce57 !important;
  color: #34ce57 !important;
}

.create-button-inline:hover:not(:disabled)::before {
  left: 100%;
}

.create-button-inline:active:not(:disabled) {
  transform: translateY(-1px) scale(1.01);
}

.map-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
  font-weight: 400;
}

.default-grid-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.live-grid-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

.grid-viewport {
  flex: 1;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%);
  border-radius: 8px;
  position: relative;
  min-height: 320px;
  max-height: 380px;
  margin: 0;
  width: 100%;
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

.default-grid {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(8px) !important;
  border-radius: 8px !important;
  padding: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
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

.preview-cell.cell-void {
  background-color: #1a1a1a !important;
  opacity: 0.95;
  border-color: rgba(255, 255, 255, 0.05);
}

.preview-cell.cell-sidewalk {
  border: 1px dashed rgba(255, 255, 255, 0.3);
  box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.1);
}

/* Confirmation Dialog */
.confirm-dialog .confirmation-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.warning-icon {
  color: #ffc107;
  font-size: 2rem;
  margin-top: 0.25rem;
}

.warning-text {
  flex: 1;
}

.warning-text p {
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
  color: #333;
}

.warning-text p:last-child {
  margin-bottom: 0;
}

.warning-text strong {
  color: #dc3545;
}

.dialog-button {
  margin: 0 0.5rem;
}

/* Custom Scrollbar */
.map-list-container::-webkit-scrollbar {
  width: 8px;
}

.map-list-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.map-list-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.map-list-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .manager-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    height: auto;
  }
}

@media (max-width: 768px) {
  .manager-container {
    padding: 1rem;
  }

  .manager-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .manager-title {
    font-size: 1.75rem;
  }

  .manager-content {
    padding: 0;
  }

  .category-filter {
    justify-content: center;
  }

  .map-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>
