<template>
  <div class="carjan-editor">
    <!-- Split Layout Container -->
    <Splitter class="editor-splitter" :layout="'horizontal'">
      <!-- Left Panel - Tools and Files -->
      <SplitterPanel :size="25" :min-size="20">
        <div class="left-panel">
          <!-- Tab Navigation -->
          <TabView class="panel-tabs">
            <TabPanel header="Files" left-icon="pi pi-folder">
              <CarjanImport
                @map-loaded="handleMapLoaded"
                @scenario-loaded="handleScenarioLoaded"
              />
            </TabPanel>

            <TabPanel header="Maps" left-icon="pi pi-map">
              <CarjanMaps @map-selected="handleMapSelected" />
            </TabPanel>

            <TabPanel header="Entities" left-icon="pi pi-users">
              <CarjanEntities @entity-drag-start="handleEntityDragStart" />
            </TabPanel>

            <TabPanel header="Tools" left-icon="pi pi-wrench">
              <CarjanTools @mode-change="handleModeChange" />
            </TabPanel>

            <TabPanel header="CARLA" left-icon="pi pi-cog">
              <CarjanCarla @export-scenario="handleExportScenario" />
            </TabPanel>
          </TabView>
        </div>
      </SplitterPanel>

      <!-- Middle Panel - Grid Editor -->
      <SplitterPanel :size="50" :min-size="30">
        <div class="middle-panel">
          <div class="grid-header">
            <div class="grid-title">
              <i class="pi pi-th-large"></i>
              <span>Grid Editor</span>
              <Badge
                v-if="gridStore.scenarioName"
                :value="gridStore.scenarioName"
              />
            </div>

            <div class="grid-controls">
              <!-- Path Mode Toggle -->
              <Button
                :label="gridStore.pathMode ? 'Exit Path Mode' : 'Path Mode'"
                :icon="gridStore.pathMode ? 'pi pi-times' : 'pi pi-share-alt'"
                :severity="gridStore.pathMode ? 'danger' : 'info'"
                @click="togglePathMode"
                size="small"
              />

              <!-- Decision Box Mode -->
              <Button
                label="DBox Mode"
                icon="pi pi-inbox"
                :severity="
                  gridStore.canvasMode === 'dbox' ? 'warning' : 'secondary'
                "
                @click="toggleDBoxMode"
                size="small"
              />

              <!-- Reset View -->
              <Button
                icon="pi pi-refresh"
                @click="resetGridView"
                v-tooltip="'Reset View'"
                text
              />

              <!-- Zoom Controls -->
              <div class="zoom-controls">
                <Button icon="pi pi-minus" @click="zoomOut" size="small" text />
                <span class="zoom-level"
                  >{{ Math.round(gridStore.scale * 100) }}%</span
                >
                <Button icon="pi pi-plus" @click="zoomIn" size="small" text />
              </div>
            </div>
          </div>

          <!-- Grid Component -->
          <CarjanGrid
            @cell-selected="handleCellSelected"
            @entity-selected="handleEntitySelected"
            @path-selected="handlePathSelected"
          />
        </div>
      </SplitterPanel>

      <!-- Right Panel - Properties -->
      <SplitterPanel :size="25" :min-size="20">
        <div class="right-panel">
          <CarjanProperties @close="closeProperties" />
        </div>
      </SplitterPanel>
    </Splitter>

    <!-- Status Bar -->
    <div class="status-bar">
      <div class="status-left">
        <div class="status-item">
          <i class="pi pi-map"></i>
          <span>{{ gridStore.mapName || "No map loaded" }}</span>
        </div>
        <div class="status-item">
          <i class="pi pi-cloud"></i>
          <span>{{ gridStore.weather }}</span>
        </div>
        <div class="status-item">
          <i class="pi pi-building"></i>
          <span>{{ gridStore.category }}</span>
        </div>
      </div>

      <div class="status-right">
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
        <div
          v-if="gridStore.currentCellPosition.length === 2"
          class="status-item"
        >
          <i class="pi pi-crosshairs"></i>
          <span
            >{{ gridStore.currentCellPosition[0] }},
            {{ gridStore.currentCellPosition[1] }}</span
          >
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="loading" class="editor-loading">
      <Card class="loading-card">
        <template #content>
          <div class="loading-content">
            <ProgressSpinner />
            <h3>Loading CARJAN Editor</h3>
            <p>{{ loadingMessage }}</p>
          </div>
        </template>
      </Card>
    </div>

    <!-- Notifications -->
    <Toast position="bottom-right" />

    <!-- Confirmation Dialogs -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { useGridStore } from "../store/grid";
import { motion } from "motion-v";

// Components
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
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
import CarjanMaps from "../components/CarjanMaps.vue";
import CarjanEntities from "../components/CarjanEntities.vue";
import CarjanTools from "../components/CarjanTools.vue";
import CarjanCarla from "../components/CarjanCarla.vue";

// Store and utilities
const gridStore = useGridStore();
const route = useRoute();
const toast = useToast();
const confirm = useConfirm();

// State
const loading = ref(true);
const loadingMessage = ref("Initializing editor...");

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

// Lifecycle
onMounted(async () => {
  try {
    loadingMessage.value = "Setting up grid...";
    await new Promise((resolve) => setTimeout(resolve, 500));

    gridStore.initializeGrid();

    loadingMessage.value = "Loading default scenario...";
    await new Promise((resolve) => setTimeout(resolve, 300)); // Set some default values
    gridStore.scenarioName = "New Scenario";
    gridStore.weather = "Clear";
    gridStore.category = "Urban";
    gridStore.cameraPosition = "up";

    // Check if we should load a sample scenario
    if (route.query.loadSample === "true") {
      loadingMessage.value = "Loading sample scenario...";
      await new Promise((resolve) => setTimeout(resolve, 300));
      loadSampleScenarioData();
    }

    loading.value = false;

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
    gridStore.startPathMode();
    toast.add({
      severity: "info",
      summary: "Path Mode",
      detail:
        'Click on cells to create a path. Click "Exit Path Mode" when done.',
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
    gridStore.canvasMode = "dbox";
    toast.add({
      severity: "info",
      summary: "DBox Mode",
      detail: "Drag to create decision boxes on the grid",
      life: 3000,
    });
  }
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

const zoomIn = () => {
  gridStore.setScale(gridStore.scale + 0.1);
};

const zoomOut = () => {
  gridStore.setScale(gridStore.scale - 0.1);
};

const closeProperties = () => {
  gridStore.propertyPanel = "scenario";
  gridStore.selectedEntity = null;
  gridStore.selectedPath = null;
  gridStore.selectedDBox = null;
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

const handleMapSelected = (mapName) => {
  gridStore.mapName = mapName;
  toast.add({
    severity: "info",
    summary: "Map Selected",
    detail: `Selected map: ${mapName}`,
    life: 2000,
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.editor-splitter {
  flex: 1;
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
}

.panel-tabs {
  height: 100%;
}

:deep(.p-tabview) {
  background: transparent !important;
}

:deep(.p-tabview-nav) {
  background: rgba(255, 255, 255, 0.1) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-tabview-nav-link) {
  color: white !important;
  border-color: transparent !important;
}

:deep(.p-tabview-nav-link:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
}

:deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  background: rgba(255, 255, 255, 0.2) !important;
  border-bottom-color: white !important;
}

:deep(.p-tabview-panels) {
  background: transparent !important;
  color: white !important;
}

.grid-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.grid-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.grid-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

.zoom-level {
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.875rem;
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

.status-item i {
  font-size: 0.75rem;
}

.editor-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-card {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.loading-content {
  text-align: center;
  padding: 2rem;
  color: white;
}

.loading-content h3 {
  margin: 1rem 0 0.5rem;
  color: white;
}

.loading-content p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

/* Animation for smooth transitions */
.carjan-editor * {
  transition: background-color 0.3s ease, border-color 0.3s ease,
    color 0.3s ease;
}

/* Responsive design */
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
</style>
