<template>
  <div class="carjan-editor">
    <!-- Split Layout Container -->
    <Splitter class="editor-splitter" :layout="'horizontal'">
      <!-- Left Panel - Tools and Files -->
      <SplitterPanel :size="25" :min-size="20" :max-size="35">
        <div class="left-panel">
          <!-- Smooth Tab Navigation -->
          <SmoothTabs
            :tabs="leftPanelTabs"
            default-tab="files"
            @tab-change="handleLeftTabChange"
            class="panel-tabs"
          >
            <template #files>
              <CarjanImport
                @map-loaded="handleMapLoaded"
                @scenario-loaded="handleScenarioLoaded"
              />
            </template>

            <template #entities>
              <CarjanEntities @entity-drag-start="handleEntityDragStart" />
            </template>

            <template #tools>
              <CarjanTools @mode-change="handleModeChange" />
            </template>
          </SmoothTabs>
        </div>
      </SplitterPanel>

      <!-- Middle Panel - Grid Editor -->
      <SplitterPanel :size="50" :min-size="30">
        <div class="middle-panel">
          <div class="grid-header">
            <!-- Left: Scenario Info -->
            <div class="grid-title">
              <i class="pi pi-file-edit"></i>
              <div class="scenario-badge">
                <span v-if="gridStore.scenarioName">{{
                  gridStore.scenarioName
                }}</span>
                <span v-else class="no-scenario">No Scenario</span>
              </div>
            </div>
            <!-- Center: Multistate Mode Button -->
            <div class="layer-controls-center">
              <button
                class="multistate-mode-btn"
                @click="cycleToNextMode"
                :class="{
                  'edit-mode': getCurrentMode() === 'Edit Mode',
                  'path-mode': getCurrentMode() === 'Path Mode',
                  'dbox-mode': getCurrentMode() === 'DBox Mode',
                }"
              >
                <motion.div
                  class="mode-content"
                  :animate="{
                    scale: [1, 1.05, 1],
                  }"
                  :transition="{ duration: 0.3 }"
                  :key="getCurrentMode()"
                >
                  <i :class="getCurrentModeIcon()"></i>
                  <span>{{ getCurrentModeLabel() }}</span>
                </motion.div>
              </button>
            </div>
            <!-- Right: Zoom Controls & Exit Button -->
            <div class="grid-controls">
              <!-- Done Button for Path/DBox Mode -->
              <Button
                v-if="gridStore.pathMode || gridStore.canvasMode === 'dbox'"
                icon="pi pi-check"
                severity="success"
                @click="finishCurrentMode"
                size="small"
                v-tooltip.bottom="{
                  value: gridStore.pathMode ? 'Finish Path' : 'Finish DBox',
                  showDelay: 300,
                }"
                rounded
                text
                class="finish-mode-btn"
              />

              <!-- Zoom Controls -->
              <div class="zoom-controls">
                <Button
                  icon="pi pi-refresh"
                  @click="resetGridView"
                  v-tooltip="'Reset View'"
                  size="small"
                  text
                />
                <Button icon="pi pi-minus" @click="zoomOut" size="small" text />
                <span class="zoom-level"
                  >{{ Math.round(gridStore.scale * 100) }}%</span
                >
                <Button icon="pi pi-plus" @click="zoomIn" size="small" text />
              </div>

              <!-- Exit Button -->
              <Button
                icon="pi pi-times"
                label="Exit"
                severity="danger"
                @click="handleQuitEditor"
                size="small"
              />
            </div>
          </div>

          <!-- Grid Component -->
          <CarjanGrid
            @cell-selected="handleCellSelected"
            @entity-selected="handleEntitySelected"
            @path-selected="handlePathSelected"
            @cell-hovered="handleCellHovered"
            @toggle-path-mode="togglePathMode"
            @toggle-dbox-mode="toggleDBoxMode"
            @quit-editor="handleQuitEditor"
          />
        </div>
      </SplitterPanel>
      <!-- Right Panel - Properties -->
      <SplitterPanel :size="25" :min-size="20" :max-size="35">
        <div class="right-panel">
          <CarjanProperties @close="closeProperties" />
        </div>
      </SplitterPanel>
    </Splitter>
    <!-- Status Bar -->
    <div class="status-bar">
      <div class="status-left">
        <div class="status-item">
          <i class="pi pi-cloud"></i>
          <span>{{ gridStore.weather }}</span>
        </div>
        <div class="status-item">
          <i class="pi pi-cog"></i>
          <span>{{ getCurrentMode() }}</span>
        </div>
      </div>
      <div class="status-right">
        <div class="status-item">
          <i class="pi pi-search-plus"></i>
          <span>{{ Math.round(gridStore.scale * 100) }}%</span>
        </div>
        <div v-if="hoveredCell" class="status-item coordinates">
          <i class="pi pi-crosshairs"></i>
          <span>Row: {{ hoveredCell.y }}, Col: {{ hoveredCell.x }}</span>
        </div>
        <div v-else class="status-item coordinates">
          <i class="pi pi-crosshairs"></i>
          <span>Row: -, Col: -</span>
        </div>
        <div class="status-item">
          <i class="pi pi-users"></i>
          <span>{{ gridStore.entities.length }} entities</span>
        </div>
        <div class="status-item">
          <i class="pi pi-map-marker"></i>
          <span>{{ gridStore.waypoints.length }} waypoints</span>
        </div>
        <div class="status-item">
          <i class="pi pi-share-alt"></i>
          <span>{{ gridStore.paths.length }} paths</span>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <Toast position="bottom-right" style="bottom: 50px; z-index: 1100" />

    <!-- Confirmation Dialogs -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { useGridStore } from "../store/grid";
import { motion } from "motion-v";

// Components
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import Button from "primevue/button";
import Badge from "primevue/badge";
import Card from "primevue/card";
import ProgressSpinner from "primevue/progressspinner";
import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";

// CARJAN Components
import CarjanGrid from "../components/CarjanGrid.vue";
import CarjanProperties from "../components/CarjanProperties.vue";
import CarjanImport from "../components/CarjanImport.vue";
import CarjanEntities from "../components/CarjanEntities.vue";
import CarjanTools from "../components/CarjanTools.vue";
import SmoothTabs from "../components/SmoothTabs.vue";

// Store and utilities
const gridStore = useGridStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// State
const hoveredCell = ref(null);

// Available modes for the switcher
const availableModes = [
  { key: "edit", label: "Edit Mode", icon: "pi pi-palette" },
  { key: "path", label: "Path Mode", icon: "pi pi-share-alt" },
  { key: "dbox", label: "DBox Mode", icon: "pi pi-inbox" },
];

// Left panel tabs configuration
const leftPanelTabs = [
  {
    id: "files",
    title: "General",
    icon: "pi pi-folder",
  },
  {
    id: "entities",
    title: "Entities",
    icon: "pi pi-users",
  },
  {
    id: "tools",
    title: "Tools",
    icon: "pi pi-wrench",
  },
];

// Helper method to load sample scenario data
const loadSampleScenarioData = () => {
  gridStore.scenarioName = "Sample Urban Scenario";
  gridStore.mapName = "Town01";
  gridStore.weather = "Clear";
  gridStore.category = "Urban";

  // Add some sample entities
  gridStore.entities = [
    {
      id: "sample_vehicle_1",
      type: "vehicle",
      position: { x: 3, y: 5 },
      rotation: 0,
      model: "vehicle.audi.a2",
    },
    {
      id: "sample_pedestrian_1",
      type: "pedestrian",
      position: { x: 5, y: 3 },
      rotation: 90,
      model: "walker.pedestrian.0001",
    },
  ];

  // Add some sample waypoints
  gridStore.waypoints = [
    { id: "wp_1", position: { x: 2, y: 2 } },
    { id: "wp_2", position: { x: 6, y: 6 } },
  ];

  // Add a sample path
  gridStore.paths = [
    {
      id: "path_1",
      waypoints: ["wp_1", "wp_2"],
      color: "#4CAF50",
    },
  ];
};

// Helper method to load scenario data from route query
const loadScenarioFromQuery = async () => {
  try {
    const scenarioId = route.query.scenario;

    if (scenarioId) {
      // Load scenario from scenarioService
      const { scenarioService } = await import(
        "../services/scenarioService.js"
      );

      // Make sure scenarios are loaded
      await scenarioService.loadScenarios();

      // Get the scenario
      const scenario = scenarioService.getScenario(scenarioId);

      if (scenario && scenario.data) {
        // Use the existing setScenario method which now loads the map automatically
        await gridStore.setScenario({
          scenarioName: `scenario#${scenario.name}`,
          scenarioMap: scenario.mapName,
          weather: scenario.data.environment?.weather || "Clear",
          category: scenario.data.environment?.category || "Urban",
          cameraPosition: scenario.data.environment?.cameraPosition || "up",
          entities: scenario.data.entities || [],
          waypoints: scenario.data.waypoints || [],
          paths: scenario.data.paths || [],
          dboxes: scenario.data.dboxes || [],
        });

        toast.add({
          severity: "success",
          summary: "Scenario Loaded",
          detail: `${scenario.name} has been loaded successfully`,
          life: 3000,
        });
      } else {
        console.warn(`Scenario not found: ${scenarioId}`);
        toast.add({
          severity: "warn",
          summary: "Scenario Not Found",
          detail: `Could not find scenario: ${scenarioId}`,
          life: 5000,
        });
      }
    } else {
      console.warn("No scenario ID found in query parameters");
    }
  } catch (error) {
    console.error("Error loading scenario from query:", error);
    toast.add({
      severity: "error",
      summary: "Loading Error",
      detail: "Failed to load the selected scenario",
      life: 5000,
    });
  }
};

// Lifecycle
onMounted(async () => {
  try {
    // Initialize grid first
    gridStore.initializeGrid();

    // Set some default values
    gridStore.scenarioName = "New Scenario";
    gridStore.weather = "Clear";
    gridStore.category = "Urban";
    gridStore.cameraPosition = "up";

    // Check if we should load a sample scenario or a specific scenario
    if (route.query.loadSample === "true") {
      loadSampleScenarioData();
    } else if (route.query.scenario) {
      await loadScenarioFromQuery();
    }

    toast.add({
      severity: "success",
      summary: "Editor Ready",
      detail: "CARJAN Editor has been successfully initialized",
      life: 3000,
    });
  } catch (error) {
    console.error("Failed to initialize editor:", error);
    toast.add({
      severity: "error",
      summary: "Initialization Error",
      detail: "Failed to initialize the editor",
      life: 5000,
    });
  }
});

// Methods
// Mode Management (like in CarjanEditor_old.vue)
const togglePathMode = () => {
  if (gridStore.pathMode) {
    gridStore.endPathMode();
    toast.add({
      severity: "info",
      summary: "Path Mode",
      detail: "Path creation mode disabled",
      life: 2000,
    });
  } else {
    // Disable other modes first
    gridStore.canvasMode = "default";
    gridStore.startPathMode();
    toast.add({
      severity: "info",
      summary: "Path Mode",
      detail:
        "Click on cells to create a path. Click 'Exit Path Mode' when done.",
      life: 4000,
    });
  }
};

const toggleDBoxMode = () => {
  if (gridStore.canvasMode === "dbox") {
    gridStore.canvasMode = "default";
    toast.add({
      severity: "info",
      summary: "DBox Mode",
      detail: "Decision box creation mode disabled",
      life: 2000,
    });
  } else {
    // Disable other modes first
    gridStore.pathMode = false;
    gridStore.canvasMode = "dbox";
    toast.add({
      severity: "info",
      summary: "DBox Mode",
      detail: "Drag to create decision boxes on the grid",
      life: 3000,
    });
  }
};

// Zoom Controls (moved from CarjanGrid.vue)
const zoomIn = () => {
  const newScale = Math.min(5.0, gridStore.scale + 0.2);
  gridStore.setScale(newScale);
};

const zoomOut = () => {
  const newScale = Math.max(0.1, gridStore.scale - 0.2);
  gridStore.setScale(newScale);
};

const resetGridView = () => {
  gridStore.resetTransform();
  toast.add({
    severity: "info",
    summary: "View Reset",
    detail: "Grid view has been reset to default",
    life: 2000,
  });
};

const closeProperties = () => {
  gridStore.propertyPanel = "scenario";
  gridStore.selectedEntity = null;
  gridStore.selectedPath = null;
  gridStore.selectedDBox = null;
};

const handleQuitEditor = () => {
  confirm.require({
    message:
      "Are you sure you want to quit the editor? Any unsaved changes will be lost.",
    header: "Quit Editor",
    icon: "pi pi-question-circle",
    acceptClass: "p-button-danger",
    accept: () => {
      // Navigate back to main menu
      router.push("/main-menu");
    },
  });
};

// Event Handlers
const handleMapLoaded = (mapData) => {
  gridStore.setMapData(mapData);
  toast.add({
    severity: "success",
    summary: "Map Loaded",
    detail: "Map data has been successfully loaded",
    life: 3000,
  });
};

const handleScenarioLoaded = (scenario) => {
  gridStore.setScenario(scenario);
  toast.add({
    severity: "success",
    summary: "Scenario Loaded",
    detail: `Scenario "${scenario.scenarioName}" has been loaded`,
    life: 3000,
  });
};

const handleEntityDragStart = (entityType) => {
  // This would be handled by the drag and drop system
  toast.add({
    severity: "info",
    summary: "Entity Drag",
    detail: `Drag the ${entityType} to place it on the grid`,
    life: 3000,
  });
};

const handleModeChange = (mode) => {
  if (mode === "path") {
    togglePathMode();
  } else if (mode === "dbox") {
    toggleDBoxMode();
  }
};

const handleCellSelected = (cell) => {
  gridStore.selectCell(cell.row, cell.col);
};

const handleEntitySelected = (entity) => {
  gridStore.selectEntity(entity);
};

const handlePathSelected = (path) => {
  gridStore.selectPath(path);
};

const handleCellHovered = (cellCoords) => {
  hoveredCell.value = cellCoords;
};

const handleLeftTabChange = (tab) => {
  // Optional: Add any specific logic when tabs change
  console.log("Tab changed to:", tab.title);
};

const handleExportScenario = () => {
  confirm.require({
    message: "Are you sure you want to export this scenario to CARLA?",
    header: "Export Confirmation",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      // Export logic would go here
      toast.add({
        severity: "success",
        summary: "Export Started",
        detail: "Scenario export to CARLA has been initiated",
        life: 3000,
      });
    },
  });
};

// Get current mode for status bar
const getCurrentMode = () => {
  if (gridStore.pathMode) {
    return "Path Mode";
  } else if (gridStore.canvasMode === "dbox") {
    return "DBox Mode";
  } else {
    return "Edit Mode";
  }
};

// Get current mode label for the switcher
const getCurrentModeLabel = () => {
  const mode = availableModes.find((m) => {
    if (m.key === "path") return gridStore.pathMode;
    if (m.key === "dbox") return gridStore.canvasMode === "dbox";
    return !gridStore.pathMode && gridStore.canvasMode !== "dbox";
  });
  return mode?.label || "Edit Mode";
};

// Get current mode icon for the switcher
const getCurrentModeIcon = () => {
  const mode = availableModes.find((m) => {
    if (m.key === "path") return gridStore.pathMode;
    if (m.key === "dbox") return gridStore.canvasMode === "dbox";
    return !gridStore.pathMode && gridStore.canvasMode !== "dbox";
  });
  return mode?.icon || "pi pi-pencil";
};

// Toggle mode switcher expansion
const toggleModeSwitcher = () => {
  modeSwitcherExpanded.value = !modeSwitcherExpanded.value;
};

// Cycle to next mode (Multistate button behavior)
const cycleToNextMode = () => {
  const currentMode = getCurrentMode();
  const currentIndex = availableModes.findIndex((m) => m.label === currentMode);
  const nextIndex = (currentIndex + 1) % availableModes.length;
  const nextMode = availableModes[nextIndex];

  selectMode(nextMode.key);
};

// Select a mode from the stack
const selectMode = (modeKey) => {
  switch (modeKey) {
    case "edit":
      setEditMode();
      break;
    case "path":
      setPathMode();
      break;
    case "dbox":
      setDBoxMode();
      break;
  }
};

// Finish current mode (Path or DBox)
const finishCurrentMode = () => {
  if (gridStore.pathMode) {
    gridStore.endPathMode();
    toast.add({
      severity: "success",
      summary: "Path Complete",
      detail: "Path has been completed",
      life: 2000,
    });
  } else if (gridStore.canvasMode === "dbox") {
    gridStore.canvasMode = "default";
    toast.add({
      severity: "success",
      summary: "DBox Complete",
      detail: "Decision box creation completed",
      life: 2000,
    });
  }
};

// Get current mode index for the switcher animation (kept for compatibility)
const getCurrentModeIndex = () => {
  if (gridStore.pathMode) {
    return 1; // Path mode
  } else if (gridStore.canvasMode === "dbox") {
    return 2; // DBox mode
  } else {
    return 0; // Edit mode
  }
};

// Set edit mode (disable other modes)
const setEditMode = () => {
  gridStore.pathMode = false;
  gridStore.canvasMode = "default";
  toast.add({
    severity: "info",
    summary: "Edit Mode",
    detail: "Edit mode activated",
    life: 2000,
  });
};

// Set path mode (disable other modes)
const setPathMode = () => {
  gridStore.startPathMode();
  toast.add({
    severity: "info",
    summary: "Path Mode",
    detail: "Click on cells to create a path. Click 'Finish Path' when done.",
    life: 4000,
  });
};

// Set DBox mode (disable other modes)
const setDBoxMode = () => {
  gridStore.pathMode = false;
  gridStore.canvasMode = "dbox";
  toast.add({
    severity: "info",
    summary: "DBox Mode",
    detail: "Drag to create decision boxes on the grid",
    life: 3000,
  });
};

// Watch for keyboard shortcuts
watch(
  () => {},
  () => {
    // Add keyboard event listeners
    const handleKeydown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "s":
            event.preventDefault();
            // Save scenario
            toast.add({
              severity: "info",
              summary: "Save",
              detail: "Scenario saved",
              life: 2000,
            });
            break;
          case "z":
            event.preventDefault();
            // Undo
            break;
          case "y":
            event.preventDefault();
            // Redo
            break;
        }
      }

      switch (event.key) {
        case "Escape":
          if (gridStore.pathMode) {
            gridStore.endPathMode();
          }
          if (gridStore.canvasMode === "dbox") {
            gridStore.canvasMode = "default";
          }
          break;
        case "Delete":
          // Delete selected entity/path/waypoint
          break;
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }
);
</script>

<style scoped>
.carjan-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0a0a0f 0%, #141419 50%, #0f0f14 100%);
  color: white;
}

.editor-splitter {
  flex: 1;
  height: calc(100vh - 40px); /* Subtract status bar height */
}

:deep(.p-splitter) {
  background: transparent !important;
  border: none !important;
}

:deep(.p-splitter-gutter) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
}

:deep(.p-splitter-gutter-handle) {
  background: rgba(255, 255, 255, 0.3) !important;
}

.left-panel,
.middle-panel,
.right-panel {
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  overflow: auto; /* Add scrolling if content gets too large */
}

.left-panel,
.right-panel {
  max-width: 500px; /* Prevent panels from becoming too wide */
}

.middle-panel {
  display: flex;
  flex-direction: column;
}

.panel-tabs {
  height: 100%;
}

/* Remove old PrimeVue TabView styles since we're using SmoothTabs now */

.grid-header {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  padding: 1rem;
  background: rgba(26, 32, 44, 0.98);
  backdrop-filter: blur(20px);
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  min-height: 60px;
  z-index: 100;
  position: relative;
  gap: 1rem;
}

.grid-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  color: white;
  justify-self: start;
  min-width: 0; /* Prevent overflow */
}

.layer-controls-center {
  justify-self: center;
  min-width: 0; /* Prevent overflow */
}

.grid-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-self: end;
  min-width: 0; /* Prevent overflow */
}

.grid-title i {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
}

.scenario-badge {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 6px 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.85rem;
  font-weight: 500;
  color: white;
}

.no-scenario {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.zoom-level {
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
  color: white;
}

.status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: rgba(26, 32, 44, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.875rem;
  height: 40px;
  box-sizing: border-box;
}

.status-left,
.status-right {
  display: flex;
  gap: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: rgba(255, 255, 255, 0.8);
}

.status-item.coordinates {
  min-width: 120px;
}

.status-item i {
  font-size: 0.75rem;
}

/* Animation for smooth transitions */
.carjan-editor * {
  transition: background-color 0.3s ease, border-color 0.3s ease,
    color 0.3s ease;
}

/* Layer Controls Styling */
.layer-controls-center {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  justify-content: center;
}

/* Multistate Mode Button */
.layer-controls-center {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.multistate-mode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: white;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  min-width: 140px;
  overflow: hidden;
  position: relative;
}

.multistate-mode-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.multistate-mode-btn:active {
  transform: scale(0.98);
}

.mode-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-content i {
  font-size: 1rem;
}

/* Mode State Colors */
.multistate-mode-btn.edit-mode {
  border-color: rgba(108, 92, 231, 0.6);
  box-shadow: 0 0 20px rgba(108, 92, 231, 0.2);
  background: rgba(108, 92, 231, 0.1);
}

.multistate-mode-btn.edit-mode:hover {
  border-color: rgba(108, 92, 231, 0.8);
  box-shadow: 0 0 25px rgba(108, 92, 231, 0.3);
  background: rgba(108, 92, 231, 0.15);
}

.multistate-mode-btn.path-mode {
  border-color: rgba(0, 206, 201, 0.6);
  box-shadow: 0 0 20px rgba(0, 206, 201, 0.2);
  background: rgba(0, 206, 201, 0.1);
}

.multistate-mode-btn.path-mode:hover {
  border-color: rgba(0, 206, 201, 0.8);
  box-shadow: 0 0 25px rgba(0, 206, 201, 0.3);
  background: rgba(0, 206, 201, 0.15);
}

.multistate-mode-btn.dbox-mode {
  border-color: rgba(253, 121, 168, 0.6);
  box-shadow: 0 0 20px rgba(253, 121, 168, 0.2);
  background: rgba(253, 121, 168, 0.1);
}

.multistate-mode-btn.dbox-mode:hover {
  border-color: rgba(253, 121, 168, 0.8);
  box-shadow: 0 0 25px rgba(253, 121, 168, 0.3);
  background: rgba(253, 121, 168, 0.15);
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Responsive design */
@media (max-width: 1200px) {
  .grid-header {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .grid-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .grid-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .grid-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .status-bar {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }
  .status-left,
  .status-right {
    justify-content: center;
  }
}

/* Finish Mode Button */
.finish-mode-btn {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  border-radius: 50% !important;
  background: rgba(76, 175, 80, 0.2) !important;
  border: 2px solid rgba(76, 175, 80, 0.4) !important;
  color: #4caf50 !important;
}

.finish-mode-btn:hover {
  background: rgba(76, 175, 80, 0.3) !important;
  border-color: rgba(76, 175, 80, 0.6) !important;
  transform: scale(1.1) !important;
}

.finish-mode-btn i {
  font-size: 14px !important;
}
</style>
