<template>
  <div class="properties-panel">
    <!-- Panel Header -->
    <div class="panel-header">
      <div class="panel-title">
        <i :class="getPanelIcon()"></i>
        <span>{{ getPanelTitle() }}</span>
      </div>
      <Button
        icon="pi pi-times"
        text
        size="small"
        @click="$emit('close')"
        class="close-btn"
      />
    </div>

    <!-- Panel Content -->
    <div class="panel-content">
      <!-- Scenario Properties -->
      <div
        v-if="gridStore.propertyPanel === 'scenario'"
        class="property-section"
      >
        <Card class="glass">
          <template #title>
            <div class="section-header">
              <i class="pi pi-cog"></i>
              <span>Scenario Settings</span>
            </div>
          </template>
          <template #content>
            <div class="form-grid">
              <div class="form-field">
                <label>Scenario Name</label>
                <InputText
                  v-model="gridStore.scenarioName"
                  placeholder="Enter scenario name"
                />
              </div>

              <div class="form-field">
                <label>Map Name</label>
                <InputText
                  v-model="gridStore.mapName"
                  placeholder="Select map"
                />
              </div>

              <div class="form-field">
                <label>Weather</label>
                <Dropdown
                  v-model="gridStore.weather"
                  :options="weatherOptions"
                  placeholder="Select weather"
                />
              </div>

              <div class="form-field">
                <label>Category</label>
                <Dropdown
                  v-model="gridStore.category"
                  :options="categoryOptions"
                  placeholder="Select category"
                />
              </div>

              <div class="form-field">
                <label>Camera Position</label>
                <Dropdown
                  v-model="gridStore.cameraPosition"
                  :options="cameraOptions"
                  option-label="label"
                  option-value="value"
                  placeholder="Select camera position"
                />
              </div>
            </div>

            <!-- Display Options -->
            <Divider />
            <div class="display-options">
              <h4>Display Options</h4>
              <div class="toggle-grid">
                <div class="toggle-item">
                  <ToggleButton
                    v-model="gridStore.showGrid"
                    on-label="Grid Visible"
                    off-label="Grid Hidden"
                    on-icon="pi pi-eye"
                    off-icon="pi pi-eye-slash"
                  />
                </div>
                <div class="toggle-item">
                  <ToggleButton
                    v-model="gridStore.showPaths"
                    on-label="Paths Visible"
                    off-label="Paths Hidden"
                    on-icon="pi pi-share-alt"
                    off-icon="pi pi-eye-slash"
                  />
                </div>
                <div class="toggle-item">
                  <ToggleButton
                    v-model="gridStore.showWaypoints"
                    on-label="Waypoints Visible"
                    off-label="Waypoints Hidden"
                    on-icon="pi pi-map-marker"
                    off-icon="pi pi-eye-slash"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Waypoint Properties -->
      <div
        v-if="gridStore.propertyPanel === 'waypoint'"
        class="property-section"
      >
        <Card class="glass">
          <template #title>
            <div class="section-header">
              <i class="pi pi-map-marker"></i>
              <span>Waypoint Editor</span>
            </div>
          </template>
          <template #content>
            <div v-if="gridStore.currentCellPosition.length === 2">
              <div class="cell-info">
                <p>
                  <strong>Position:</strong> Row
                  {{ gridStore.currentCellPosition[0] }}, Col
                  {{ gridStore.currentCellPosition[1] }}
                </p>
                <p><strong>Cell Type:</strong> {{ getCellType() }}</p>
              </div>

              <!-- Waypoint Grid -->
              <div class="waypoint-editor">
                <h4>Drag & Drop Waypoints</h4>
                <div class="mini-grid">
                  <div
                    v-for="position in waypointPositions"
                    :key="position.id"
                    class="mini-cell"
                    :class="{
                      'has-waypoint': hasWaypointAtPosition(position.id),
                    }"
                    @drop="handleWaypointDrop(position.id, $event)"
                    @dragover="handleDragOver"
                    @click="toggleWaypoint(position.id)"
                  >
                    <i
                      v-if="hasWaypointAtPosition(position.id)"
                      class="pi pi-map-marker waypoint-icon"
                    ></i>
                  </div>
                </div>

                <div class="waypoint-actions">
                  <Button
                    label="Add Center Waypoint"
                    icon="pi pi-plus"
                    @click="addWaypoint('middle-center')"
                    :disabled="hasWaypointAtPosition('middle-center')"
                    size="small"
                  />
                  <Button
                    label="Clear All"
                    icon="pi pi-trash"
                    severity="danger"
                    @click="clearAllWaypoints"
                    size="small"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Path Properties -->
      <div
        v-if="gridStore.propertyPanel === 'path' && gridStore.selectedPath"
        class="property-section"
      >
        <Card class="glass">
          <template #title>
            <div class="section-header">
              <i class="pi pi-share-alt"></i>
              <span>Path Editor</span>
            </div>
          </template>
          <template #content>
            <div class="form-grid">
              <div class="form-field">
                <label>Path Name</label>
                <InputText
                  v-model="gridStore.selectedPath.path"
                  placeholder="Enter path name"
                />
              </div>

              <div class="form-field">
                <label>Color</label>
                <ColorPicker
                  v-model="gridStore.selectedPath.color"
                  format="hex"
                />
              </div>

              <div class="form-field">
                <label>Description</label>
                <Textarea
                  v-model="gridStore.selectedPath.description"
                  rows="3"
                  placeholder="Enter path description"
                />
              </div>
            </div>

            <!-- Waypoints List -->
            <Divider />
            <div class="waypoints-list">
              <h4>
                Waypoints ({{ gridStore.selectedPath.waypoints?.length || 0 }})
              </h4>
              <div
                v-for="(waypoint, index) in gridStore.selectedPath.waypoints"
                :key="`wp-${index}`"
                class="waypoint-item"
              >
                <div class="waypoint-info">
                  <span
                    >{{ index + 1 }}. Row {{ waypoint.x }}, Col
                    {{ waypoint.y }}</span
                  >
                  <Badge
                    :value="waypoint.positionInCell"
                    severity="info"
                    size="small"
                  />
                </div>
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  size="small"
                  @click="removeWaypointFromPath(index)"
                />
              </div>
            </div>

            <div class="path-actions">
              <Button
                label="Delete Path"
                icon="pi pi-trash"
                severity="danger"
                @click="deletePath"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Entity Properties -->
      <div
        v-if="gridStore.propertyPanel === 'entity' && gridStore.selectedEntity"
        class="property-section"
      >
        <Card class="glass">
          <template #title>
            <div class="section-header">
              <i :class="getEntityIcon(gridStore.selectedEntity)"></i>
              <span
                >{{
                  getEntityTypeName(gridStore.selectedEntity.type)
                }}
                Editor</span
              >
            </div>
          </template>
          <template #content>
            <div class="form-grid">
              <div class="form-field">
                <label>Entity Type</label>
                <Dropdown
                  v-model="gridStore.selectedEntity.type"
                  :options="entityTypes"
                  option-label="label"
                  option-value="value"
                />
              </div>

              <div class="form-field">
                <label>Position</label>
                <div class="position-inputs">
                  <InputNumber
                    v-model="gridStore.selectedEntity.x"
                    :min="0"
                    :max="gridStore.gridRows - 1"
                    placeholder="Row"
                  />
                  <InputNumber
                    v-model="gridStore.selectedEntity.y"
                    :min="0"
                    :max="gridStore.gridCols - 1"
                    placeholder="Col"
                  />
                </div>
              </div>

              <div class="form-field">
                <label>Heading</label>
                <Dropdown
                  v-model="gridStore.selectedEntity.heading"
                  :options="headingOptions"
                  placeholder="Select heading"
                />
              </div>

              <div class="form-field">
                <label>Color</label>
                <ColorPicker
                  v-model="gridStore.selectedEntity.color"
                  format="hex"
                />
              </div>

              <div class="form-field">
                <label>Model (CARLA)</label>
                <Dropdown
                  v-model="gridStore.selectedEntity.model"
                  :options="getModelOptions(gridStore.selectedEntity.type)"
                  placeholder="Select 3D model"
                />
              </div>
            </div>

            <div class="entity-actions">
              <Button
                label="Remove Entity"
                icon="pi pi-trash"
                severity="danger"
                @click="removeEntity"
              />
            </div>
          </template>
        </Card>
      </div>

      <!-- Decision Box Properties -->
      <div
        v-if="gridStore.propertyPanel === 'dbox' && gridStore.selectedDBox"
        class="property-section"
      >
        <Card class="glass">
          <template #title>
            <div class="section-header">
              <i class="pi pi-inbox"></i>
              <span>Decision Box Editor</span>
            </div>
          </template>
          <template #content>
            <div class="form-grid">
              <div class="form-field">
                <label>Label</label>
                <InputText
                  v-model="gridStore.selectedDBox.label"
                  placeholder="Enter label"
                />
              </div>

              <div class="form-field">
                <label>Color</label>
                <ColorPicker
                  v-model="gridStore.selectedDBox.color"
                  format="hex"
                />
              </div>

              <div class="form-field">
                <label>Bounds</label>
                <div class="bounds-grid">
                  <div>
                    <label>Start X</label>
                    <InputNumber v-model="gridStore.selectedDBox.startX" />
                  </div>
                  <div>
                    <label>Start Y</label>
                    <InputNumber v-model="gridStore.selectedDBox.startY" />
                  </div>
                  <div>
                    <label>End X</label>
                    <InputNumber v-model="gridStore.selectedDBox.endX" />
                  </div>
                  <div>
                    <label>End Y</label>
                    <InputNumber v-model="gridStore.selectedDBox.endY" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Preview -->
            <Divider />
            <div class="dbox-preview">
              <h4>Preview</h4>
              <div
                class="preview-box"
                :style="{ backgroundColor: gridStore.selectedDBox.color }"
              ></div>
            </div>

            <div class="dbox-actions">
              <Button label="Redraw" icon="pi pi-pencil" @click="redrawDBox" />
              <Button
                label="Delete"
                icon="pi pi-trash"
                severity="danger"
                @click="deleteDBox"
              />
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useGridStore } from "../store/grid";
import Card from "primevue/card";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Dropdown from "primevue/dropdown";
import ToggleButton from "primevue/togglebutton";
import ColorPicker from "primevue/colorpicker";
import Textarea from "primevue/textarea";
import Divider from "primevue/divider";
import Badge from "primevue/badge";

const gridStore = useGridStore();

defineEmits(["close"]);

// Options
const weatherOptions = [
  "Clear",
  "Cloudy",
  "Wet",
  "WetCloudy",
  "SoftRain",
  "MidRain",
  "HardRain",
];

const categoryOptions = ["Urban", "Rural", "Highway", "Industrial"];

const cameraOptions = [
  { label: "Up", value: "up" },
  { label: "Down", value: "down" },
  { label: "Left", value: "left" },
  { label: "Right", value: "right" },
  { label: "Bird's Eye", value: "birdseye" },
];

const entityTypes = [
  { label: "Pedestrian", value: "pedestrian" },
  { label: "Vehicle", value: "vehicle" },
  { label: "Autonomous Vehicle", value: "autonomous" },
  { label: "Obstacle", value: "obstacle" },
];

const headingOptions = [
  "North",
  "North-East",
  "East",
  "South-East",
  "South",
  "South-West",
  "West",
  "North-West",
];

const waypointPositions = [
  { id: "top-left", row: 0, col: 0 },
  { id: "top-center", row: 0, col: 1 },
  { id: "top-right", row: 0, col: 2 },
  { id: "middle-left", row: 1, col: 0 },
  { id: "middle-center", row: 1, col: 1 },
  { id: "middle-right", row: 1, col: 2 },
  { id: "bottom-left", row: 2, col: 0 },
  { id: "bottom-center", row: 2, col: 1 },
  { id: "bottom-right", row: 2, col: 2 },
];

// Computed
const getPanelIcon = () => {
  const icons = {
    scenario: "pi pi-cog",
    waypoint: "pi pi-map-marker",
    path: "pi pi-share-alt",
    entity: "pi pi-user",
    dbox: "pi pi-inbox",
  };
  return icons[gridStore.propertyPanel] || "pi pi-cog";
};

const getPanelTitle = () => {
  const titles = {
    scenario: "Scenario Properties",
    waypoint: "Waypoint Editor",
    path: "Path Editor",
    entity: "Entity Editor",
    dbox: "Decision Box Editor",
  };
  return titles[gridStore.propertyPanel] || "Properties";
};

const getCellType = () => {
  if (gridStore.currentCellPosition.length !== 2) return "Unknown";

  const [row, col] = gridStore.currentCellPosition;
  const cellStatus = gridStore.getCellAt(row, col);

  if (cellStatus?.entityType === "void") return "Void";
  if (cellStatus?.sidewalk) return "Sidewalk";

  const color = gridStore.getCellColor(row, col);
  if (color === gridStore.colors.road) return "Road";
  if (color === gridStore.colors.path) return "Path";

  return "Unknown";
};

// Methods
const getEntityIcon = (entity) => {
  const iconMap = {
    pedestrian: "pi pi-user",
    vehicle: "pi pi-car",
    autonomous: "pi pi-cog",
    obstacle: "pi pi-stop",
  };
  return iconMap[entity.type] || "pi pi-question";
};

const getEntityTypeName = (type) => {
  const names = {
    pedestrian: "Pedestrian",
    vehicle: "Vehicle",
    autonomous: "Autonomous Vehicle",
    obstacle: "Obstacle",
  };
  return names[type] || "Entity";
};

const getModelOptions = (entityType) => {
  const models = {
    pedestrian: [
      "walker.pedestrian.0001",
      "walker.pedestrian.0002",
      "walker.pedestrian.0003",
    ],
    vehicle: [
      "vehicle.tesla.model3",
      "vehicle.bmw.grandtourer",
      "vehicle.audi.a2",
    ],
    autonomous: ["vehicle.tesla.model3", "vehicle.lincoln.mkz2017"],
    obstacle: ["static.prop.tree", "static.prop.barrier", "static.prop.cone"],
  };
  return models[entityType] || [];
};

const hasWaypointAtPosition = (positionId) => {
  if (gridStore.currentCellPosition.length !== 2) return false;

  const [row, col] = gridStore.currentCellPosition;
  return gridStore.waypointsOnGrid.some(
    (w) => w.x === row && w.y === col && w.positionInCell === positionId
  );
};

const addWaypoint = (positionInCell) => {
  if (gridStore.currentCellPosition.length !== 2) return;

  const [row, col] = gridStore.currentCellPosition;
  gridStore.addWaypoint({
    x: row,
    y: col,
    positionInCell,
  });
};

const toggleWaypoint = (positionInCell) => {
  if (gridStore.currentCellPosition.length !== 2) return;

  const [row, col] = gridStore.currentCellPosition;

  if (hasWaypointAtPosition(positionInCell)) {
    gridStore.removeWaypoint(row, col, positionInCell);
  } else {
    addWaypoint(positionInCell);
  }
};

const clearAllWaypoints = () => {
  if (gridStore.currentCellPosition.length !== 2) return;

  const [row, col] = gridStore.currentCellPosition;
  const waypoints = gridStore.waypointsOnGrid.filter(
    (w) => w.x === row && w.y === col
  );

  waypoints.forEach((w) => {
    gridStore.removeWaypoint(w.x, w.y, w.positionInCell);
  });
};

const removeWaypointFromPath = (index) => {
  if (gridStore.selectedPath?.waypoints) {
    gridStore.selectedPath.waypoints.splice(index, 1);
  }
};

const deletePath = () => {
  if (gridStore.selectedPath) {
    gridStore.removePath(gridStore.selectedPath.id);
  }
};

const removeEntity = () => {
  if (gridStore.selectedEntity) {
    gridStore.removeEntity(
      gridStore.selectedEntity.x,
      gridStore.selectedEntity.y
    );
    gridStore.selectedEntity = null;
    gridStore.propertyPanel = "scenario";
  }
};

const redrawDBox = () => {
  gridStore.canvasMode = "dbox";
};

const deleteDBox = () => {
  if (gridStore.selectedDBox) {
    gridStore.removeDBox(gridStore.selectedDBox.id);
  }
};

const handleWaypointDrop = (positionId, event) => {
  event.preventDefault();
  // Handle drag and drop for waypoints
};

const handleDragOver = (event) => {
  event.preventDefault();
};
</script>

<style scoped>
.properties-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: white;
  font-size: 1.1rem;
}

.close-btn {
  color: white !important;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.property-section {
  margin-bottom: 1rem;
}

.glass {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: white;
  font-size: 0.9rem;
}

.position-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.toggle-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toggle-item {
  display: flex;
  align-items: center;
}

.display-options h4 {
  color: white;
  margin-bottom: 1rem;
}

.cell-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.cell-info p {
  margin: 0.5rem 0;
  color: white;
}

.waypoint-editor h4 {
  color: white;
  margin-bottom: 1rem;
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-bottom: 1rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px;
  border-radius: 8px;
}

.mini-cell {
  aspect-ratio: 1;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.1);
}

.mini-cell:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.mini-cell.has-waypoint {
  background: rgba(156, 39, 176, 0.3);
  border-color: #9c27b0;
}

.waypoint-icon {
  color: #9c27b0;
  font-size: 1.2rem;
}

.waypoint-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.waypoints-list {
  margin-top: 1rem;
}

.waypoints-list h4 {
  color: white;
  margin-bottom: 1rem;
}

.waypoint-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.waypoint-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.bounds-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.bounds-grid > div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.bounds-grid label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.dbox-preview h4 {
  color: white;
  margin-bottom: 1rem;
}

.preview-box {
  height: 60px;
  border-radius: 8px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 1rem;
}

.path-actions,
.entity-actions,
.dbox-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

/* PrimeVue component overrides for glass effect */
:deep(.p-card) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-card .p-card-title) {
  color: white !important;
}

:deep(.p-card .p-card-content) {
  color: white !important;
}

:deep(.p-inputtext) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
}

:deep(.p-inputtext::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

:deep(.p-dropdown) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
}

:deep(.p-textarea) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
}
</style>
