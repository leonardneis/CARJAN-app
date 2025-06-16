<template>
  <div class="carjan-tools">
    <div class="tools-header">
      <h3>
        <i class="pi pi-wrench"></i>
        Editor Tools
      </h3>
      <p class="subtitle">Tools for creating and editing scenarios</p>
    </div>

    <!-- Mode Selection -->
    <Card class="tool-section glass">
      <template #title>
        <div class="section-title">
          <i class="pi pi-palette"></i>
          <span>Edit Mode</span>
        </div>
      </template>
      <template #content>
        <div class="mode-buttons">
          <Button
            label="Default Mode"
            icon="pi pi-cursor"
            :severity="
              gridStore.canvasMode === 'default' ? 'info' : 'secondary'
            "
            @click="setMode('default')"
            size="small"
            outlined
          />
          <Button
            label="Path Mode"
            icon="pi pi-share-alt"
            :severity="gridStore.pathMode ? 'warning' : 'secondary'"
            @click="togglePathMode"
            size="small"
            outlined
          />
          <Button
            label="DBox Mode"
            icon="pi pi-inbox"
            :severity="gridStore.canvasMode === 'dbox' ? 'danger' : 'secondary'"
            @click="toggleDBoxMode"
            size="small"
            outlined
          />
        </div>

        <div class="mode-info">
          <div
            v-if="gridStore.canvasMode === 'default'"
            class="mode-description"
          >
            <i class="pi pi-info-circle"></i>
            <span>Click cells to select them, drag entities to place them</span>
          </div>
          <div v-if="gridStore.pathMode" class="mode-description">
            <i class="pi pi-info-circle"></i>
            <span>Click on cells to create waypoints and build a path</span>
          </div>
          <div v-if="gridStore.canvasMode === 'dbox'" class="mode-description">
            <i class="pi pi-info-circle"></i>
            <span>Drag on the grid to create decision boxes</span>
          </div>
        </div>
      </template>
    </Card>

    <!-- Path Tools -->
    <Card v-if="gridStore.paths.length > 0" class="tool-section glass">
      <template #title>
        <div class="section-title">
          <i class="pi pi-share-alt"></i>
          <span>Path Tools</span>
          <Badge :value="gridStore.paths.length" severity="info" />
        </div>
      </template>
      <template #content>
        <div class="path-list">
          <div
            v-for="path in gridStore.paths"
            :key="path.id"
            class="path-item"
            @click="selectPath(path)"
            :class="{ active: gridStore.selectedPath?.id === path.id }"
          >
            <div class="path-preview">
              <div
                class="path-color"
                :style="{ backgroundColor: path.color }"
              ></div>
            </div>
            <div class="path-info">
              <div class="path-name">{{ getPathName(path) }}</div>
              <div class="path-waypoints">
                {{ path.waypoints?.length || 0 }} waypoints
              </div>
            </div>
            <div class="path-actions">
              <Button
                icon="pi pi-eye"
                text
                size="small"
                @click.stop="highlightPath(path)"
                v-tooltip="'Highlight Path'"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                size="small"
                @click.stop="deletePath(path)"
                v-tooltip="'Delete Path'"
              />
            </div>
          </div>
        </div>

        <div class="path-controls">
          <Button
            label="New Path"
            icon="pi pi-plus"
            @click="startNewPath"
            size="small"
          />
          <Button
            label="Clear All Paths"
            icon="pi pi-trash"
            severity="danger"
            @click="clearAllPaths"
            size="small"
            :disabled="gridStore.paths.length === 0"
          />
        </div>
      </template>
    </Card>

    <!-- Decision Box Tools -->
    <Card v-if="gridStore.dboxes.length > 0" class="tool-section glass">
      <template #title>
        <div class="section-title">
          <i class="pi pi-inbox"></i>
          <span>Decision Boxes</span>
          <Badge :value="gridStore.dboxes.length" severity="warning" />
        </div>
      </template>
      <template #content>
        <div class="dbox-list">
          <div
            v-for="dbox in gridStore.dboxes"
            :key="dbox.id"
            class="dbox-item"
            @click="selectDBox(dbox)"
            :class="{ active: gridStore.selectedDBox?.id === dbox.id }"
          >
            <div class="dbox-preview">
              <div
                class="dbox-color"
                :style="{ backgroundColor: dbox.color }"
              ></div>
            </div>
            <div class="dbox-info">
              <div class="dbox-label">{{ dbox.label }}</div>
              <div class="dbox-coords">
                {{ dbox.startX }},{{ dbox.startY }} → {{ dbox.endX }},{{
                  dbox.endY
                }}
              </div>
            </div>
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              @click.stop="deleteDBox(dbox)"
              v-tooltip="'Delete Decision Box'"
            />
          </div>
        </div>

        <div class="dbox-controls">
          <Button
            label="New DBox"
            icon="pi pi-plus"
            @click="startNewDBox"
            size="small"
          />
          <Button
            label="Clear All"
            icon="pi pi-trash"
            severity="danger"
            @click="clearAllDBoxes"
            size="small"
            :disabled="gridStore.dboxes.length === 0"
          />
        </div>
      </template>
    </Card>

    <!-- Grid Tools -->
    <Card class="tool-section glass">
      <template #title>
        <div class="section-title">
          <i class="pi pi-th-large"></i>
          <span>Grid Tools</span>
        </div>
      </template>
      <template #content>
        <div class="grid-tools">
          <div class="tool-group">
            <label>View Controls</label>
            <div class="control-buttons">
              <Button
                label="Reset View"
                icon="pi pi-refresh"
                @click="resetView"
                size="small"
                outlined
              />
              <Button
                label="Center Grid"
                icon="pi pi-expand"
                @click="centerGrid"
                size="small"
                outlined
              />
            </div>
          </div>

          <div class="tool-group">
            <label>Zoom</label>
            <div class="zoom-control">
              <Button
                icon="pi pi-minus"
                @click="zoomOut"
                size="small"
                outlined
              />
              <span class="zoom-display"
                >{{ Math.round(gridStore.scale * 100) }}%</span
              >
              <Button icon="pi pi-plus" @click="zoomIn" size="small" outlined />
            </div>
          </div>

          <div class="tool-group">
            <label>Grid Actions</label>
            <div class="control-buttons">
              <Button
                label="Clear Grid"
                icon="pi pi-eraser"
                severity="danger"
                @click="clearGrid"
                size="small"
                outlined
              />
              <Button
                label="Validate"
                icon="pi pi-check"
                severity="success"
                @click="validateGrid"
                size="small"
                outlined
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Layer Visibility -->
    <Card class="tool-section glass">
      <template #title>
        <div class="section-title">
          <i class="pi pi-eye"></i>
          <span>Layer Visibility</span>
        </div>
      </template>
      <template #content>
        <div class="layer-toggles">
          <div class="layer-toggle">
            <ToggleButton
              v-model="gridStore.showGrid"
              on-label="Grid"
              off-label="Grid"
              on-icon="pi pi-th-large"
              off-icon="pi pi-th-large"
              size="small"
            />
          </div>
          <div class="layer-toggle">
            <ToggleButton
              v-model="gridStore.showEntities"
              on-label="Entities"
              off-label="Entities"
              on-icon="pi pi-users"
              off-icon="pi pi-users"
              size="small"
            />
          </div>
          <div class="layer-toggle">
            <ToggleButton
              v-model="gridStore.showWaypoints"
              on-label="Waypoints"
              off-label="Waypoints"
              on-icon="pi pi-map-marker"
              off-icon="pi pi-map-marker"
              size="small"
            />
          </div>
          <div class="layer-toggle">
            <ToggleButton
              v-model="gridStore.showPaths"
              on-label="Paths"
              off-label="Paths"
              on-icon="pi pi-share-alt"
              off-icon="pi pi-share-alt"
              size="small"
            />
          </div>
          <div class="layer-toggle">
            <ToggleButton
              v-model="gridStore.showDBoxes"
              on-label="DBoxes"
              off-label="DBoxes"
              on-icon="pi pi-inbox"
              off-icon="pi pi-inbox"
              size="small"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- Statistics -->
    <Card class="tool-section glass">
      <template #title>
        <div class="section-title">
          <i class="pi pi-chart-bar"></i>
          <span>Statistics</span>
        </div>
      </template>
      <template #content>
        <div class="statistics">
          <div class="stat-row">
            <span>Grid Size:</span>
            <span>{{ gridStore.gridRows }} × {{ gridStore.gridCols }}</span>
          </div>
          <div class="stat-row">
            <span>Total Cells:</span>
            <span>{{ gridStore.gridRows * gridStore.gridCols }}</span>
          </div>
          <div class="stat-row">
            <span>Entities:</span>
            <span>{{ gridStore.entities.length }}</span>
          </div>
          <div class="stat-row">
            <span>Waypoints:</span>
            <span>{{ gridStore.waypoints.length }}</span>
          </div>
          <div class="stat-row">
            <span>Paths:</span>
            <span>{{ gridStore.paths.length }}</span>
          </div>
          <div class="stat-row">
            <span>Decision Boxes:</span>
            <span>{{ gridStore.dboxes.length }}</span>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { useGridStore } from "../store/grid";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import Card from "primevue/card";
import Button from "primevue/button";
import Badge from "primevue/badge";
import ToggleButton from "primevue/togglebutton";

const gridStore = useGridStore();
const toast = useToast();
const confirm = useConfirm();

defineEmits(["mode-change"]);

// Methods
const setMode = (mode) => {
  gridStore.canvasMode = mode;
  if (mode === "default") {
    gridStore.pathMode = false;
  }
};

const togglePathMode = () => {
  if (gridStore.pathMode) {
    gridStore.endPathMode();
  } else {
    gridStore.startPathMode();
  }
};

const toggleDBoxMode = () => {
  if (gridStore.canvasMode === "dbox") {
    gridStore.canvasMode = "default";
  } else {
    gridStore.canvasMode = "dbox";
  }
};

const selectPath = (path) => {
  gridStore.selectPath(path);
};

const selectDBox = (dbox) => {
  gridStore.selectDBox(dbox);
};

const getPathName = (path) => {
  return path.path?.replace("#", "") || `Path ${path.id}`;
};

const highlightPath = (path) => {
  gridStore.selectPath(path);
  toast.add({
    severity: "info",
    summary: "Path Highlighted",
    detail: `Path "${getPathName(path)}" is now highlighted`,
    life: 2000,
  });
};

const deletePath = (path) => {
  confirm.require({
    message: `Are you sure you want to delete path "${getPathName(path)}"?`,
    header: "Delete Path",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      gridStore.removePath(path.id);
      toast.add({
        severity: "success",
        summary: "Path Deleted",
        detail: "Path has been removed",
        life: 2000,
      });
    },
  });
};

const deleteDBox = (dbox) => {
  confirm.require({
    message: `Are you sure you want to delete decision box "${dbox.label}"?`,
    header: "Delete Decision Box",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      gridStore.removeDBox(dbox.id);
      toast.add({
        severity: "success",
        summary: "Decision Box Deleted",
        detail: "Decision box has been removed",
        life: 2000,
      });
    },
  });
};

const startNewPath = () => {
  gridStore.startPathMode();
  toast.add({
    severity: "info",
    summary: "Path Mode",
    detail: "Click on cells to create waypoints for your path",
    life: 3000,
  });
};

const startNewDBox = () => {
  gridStore.canvasMode = "dbox";
  toast.add({
    severity: "info",
    summary: "Decision Box Mode",
    detail: "Drag on the grid to create a decision box",
    life: 3000,
  });
};

const clearAllPaths = () => {
  confirm.require({
    message: "Are you sure you want to delete all paths?",
    header: "Clear All Paths",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      gridStore.paths.length = 0;
      gridStore.selectedPath = null;
      toast.add({
        severity: "success",
        summary: "Paths Cleared",
        detail: "All paths have been removed",
        life: 2000,
      });
    },
  });
};

const clearAllDBoxes = () => {
  confirm.require({
    message: "Are you sure you want to delete all decision boxes?",
    header: "Clear All Decision Boxes",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      gridStore.dboxes.length = 0;
      gridStore.selectedDBox = null;
      toast.add({
        severity: "success",
        summary: "Decision Boxes Cleared",
        detail: "All decision boxes have been removed",
        life: 2000,
      });
    },
  });
};

const resetView = () => {
  gridStore.resetTransform();
  toast.add({
    severity: "info",
    summary: "View Reset",
    detail: "Grid view has been reset",
    life: 2000,
  });
};

const centerGrid = () => {
  gridStore.setTranslation(0, 0);
  toast.add({
    severity: "info",
    summary: "Grid Centered",
    detail: "Grid has been centered",
    life: 2000,
  });
};

const zoomIn = () => {
  gridStore.setScale(gridStore.scale + 0.1);
};

const zoomOut = () => {
  gridStore.setScale(gridStore.scale - 0.1);
};

const clearGrid = () => {
  confirm.require({
    message:
      "Are you sure you want to clear the entire grid? This will remove all entities, waypoints, and paths.",
    header: "Clear Grid",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      gridStore.entities.length = 0;
      gridStore.waypoints.length = 0;
      gridStore.paths.length = 0;
      gridStore.dboxes.length = 0;
      gridStore.selectedEntity = null;
      gridStore.selectedPath = null;
      gridStore.selectedDBox = null;
      gridStore.initializeGrid();

      toast.add({
        severity: "success",
        summary: "Grid Cleared",
        detail: "All elements have been removed from the grid",
        life: 3000,
      });
    },
  });
};

const validateGrid = () => {
  const issues = [];

  // Check for overlapping entities
  const positions = new Set();
  gridStore.entities.forEach((entity) => {
    const key = `${entity.x},${entity.y}`;
    if (positions.has(key)) {
      issues.push(`Multiple entities at position ${entity.x}, ${entity.y}`);
    }
    positions.add(key);
  });

  // Check for paths with too few waypoints
  gridStore.paths.forEach((path) => {
    if (!path.waypoints || path.waypoints.length < 2) {
      issues.push(`Path "${getPathName(path)}" has fewer than 2 waypoints`);
    }
  });

  // Check for entities on void cells
  gridStore.entities.forEach((entity) => {
    const cellStatus = gridStore.getCellAt(entity.x, entity.y);
    if (cellStatus?.entityType === "void") {
      issues.push(
        `Entity at ${entity.x}, ${entity.y} is placed on a void cell`
      );
    }
  });

  if (issues.length === 0) {
    toast.add({
      severity: "success",
      summary: "Validation Passed",
      detail: "No issues found with the current grid configuration",
      life: 3000,
    });
  } else {
    toast.add({
      severity: "warn",
      summary: "Validation Issues",
      detail: `${issues.length} issue(s) found. Check console for details.`,
      life: 5000,
    });
    console.warn("Grid validation issues:", issues);
  }
};
</script>

<style scoped>
.carjan-tools {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 1rem;
}

.tools-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.5rem 0;
  color: white;
  font-size: 1.1rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin: 0;
}

.glass {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.mode-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.mode-info {
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border-left: 3px solid #2196f3;
}

.mode-description {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}

.path-list,
.dbox-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.path-item,
.dbox-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.path-item:hover,
.dbox-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.path-item.active,
.dbox-item.active {
  background: rgba(33, 150, 243, 0.2);
  border-color: #2196f3;
}

.path-preview,
.dbox-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.path-color,
.dbox-color {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.path-info,
.dbox-info {
  flex: 1;
}

.path-name,
.dbox-label {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.path-waypoints,
.dbox-coords {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
}

.path-actions {
  display: flex;
  gap: 0.25rem;
}

.path-controls,
.dbox-controls {
  display: flex;
  gap: 0.5rem;
}

.grid-tools {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tool-group label {
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.control-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.zoom-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.zoom-display {
  color: white;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
  font-size: 0.875rem;
}

.layer-toggles {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.layer-toggle {
  display: flex;
  align-items: center;
}

.statistics {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  color: white;
  font-size: 0.875rem;
}

.stat-row span:first-child {
  color: rgba(255, 255, 255, 0.8);
}

.stat-row span:last-child {
  font-weight: 600;
}

/* PrimeVue overrides */
:deep(.p-card) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-card-title) {
  color: white !important;
  margin-bottom: 1rem !important;
  font-size: 0.95rem !important;
}

:deep(.p-card-content) {
  color: white !important;
  padding: 1rem !important;
}

:deep(.p-togglebutton) {
  width: 100% !important;
}

/* Scrollbar styling */
.carjan-tools::-webkit-scrollbar,
.path-list::-webkit-scrollbar,
.dbox-list::-webkit-scrollbar {
  width: 6px;
}

.carjan-tools::-webkit-scrollbar-track,
.path-list::-webkit-scrollbar-track,
.dbox-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.carjan-tools::-webkit-scrollbar-thumb,
.path-list::-webkit-scrollbar-thumb,
.dbox-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.carjan-tools::-webkit-scrollbar-thumb:hover,
.path-list::-webkit-scrollbar-thumb:hover,
.dbox-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
