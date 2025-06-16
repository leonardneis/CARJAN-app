<template>
  <div class="carjan-grid-container">
    <!-- Layer Control Buttons -->
    <div
      class="layer-controls"
      :class="{ visible: showLayerControls }"
      @mouseenter="showLayerControls = true"
      @mouseleave="showLayerControls = false"
    >
      <Button
        icon="pi pi-eye"
        class="layer-toggle-btn"
        :class="{ 'p-button-outlined': !showLayerControls }"
        rounded
        @click="showLayerControls = !showLayerControls"
      />

      <div class="layer-buttons" v-show="showLayerControls">
        <Button
          icon="pi pi-th-large"
          :class="{ 'p-button-success': gridStore.showGrid }"
          rounded
          @click="gridStore.toggleGrid()"
          v-tooltip="'Toggle Grid'"
        />
        <Button
          icon="pi pi-users"
          :class="{ 'p-button-success': gridStore.showEntities }"
          rounded
          @click="gridStore.toggleEntities()"
          v-tooltip="'Toggle Entities'"
        />
        <Button
          icon="pi pi-share-alt"
          :class="{ 'p-button-success': gridStore.showPaths }"
          rounded
          @click="gridStore.togglePaths()"
          v-tooltip="'Toggle Paths'"
        />
        <Button
          icon="pi pi-map-marker"
          :class="{ 'p-button-success': gridStore.showWaypoints }"
          rounded
          @click="gridStore.toggleWaypoints()"
          v-tooltip="'Toggle Waypoints'"
        />
        <Button
          icon="pi pi-inbox"
          :class="{ 'p-button-success': gridStore.showDBoxes }"
          rounded
          @click="gridStore.toggleDBoxes()"
          v-tooltip="'Toggle Decision Boxes'"
        />
      </div>
    </div>

    <!-- Grid Viewport -->
    <div
      class="grid-viewport"
      ref="viewport"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
    >
      <div class="grid-room" :style="transformStyle">
        <!-- Grid Container -->
        <div
          class="grid-main"
          ref="gridContainer"
          @drop="handleDrop"
          @dragover="handleDragOver"
        >
          <!-- Drawing Canvas for Decision Boxes -->
          <canvas
            ref="drawingCanvas"
            class="drawing-canvas"
            width="800"
            height="600"
            :style="{
              pointerEvents: gridStore.canvasMode === 'dbox' ? 'auto' : 'none',
            }"
          />

          <!-- Coordinate System -->
          <div class="coordinate-system">
            <!-- Column Numbers (Y-axis) -->
            <div class="column-numbers">
              <div
                v-for="col in gridStore.gridCols"
                :key="`col-${col - 1}`"
                class="col-number"
              >
                {{ col - 1 }}
              </div>
              <Button
                icon="pi pi-arrow-right"
                label="y-axis"
                text
                size="small"
                class="axis-label"
              />
            </div>

            <!-- Row Numbers (X-axis) -->
            <div class="row-numbers">
              <div
                v-for="row in gridStore.gridRows"
                :key="`row-${row - 1}`"
                class="row-number"
              >
                {{ row - 1 }}
              </div>
              <Button
                icon="pi pi-arrow-down"
                label="x-axis"
                text
                size="small"
                class="axis-label"
              />
            </div>
          </div>

          <!-- Path Overlay SVG -->
          <svg
            class="path-overlay"
            width="100%"
            height="100%"
            v-show="gridStore.showPaths"
          >
            <path
              v-for="path in visiblePaths"
              :key="path.id"
              :d="getPathData(path)"
              :stroke="path.color || gridStore.colors.path_selected"
              stroke-width="4"
              stroke-dasharray="8,8"
              fill="none"
              class="path-line"
            />
          </svg>

          <!-- Grid Cells -->
          <div
            v-for="cell in gridStore.gridCells"
            :key="`cell-${cell.row}-${cell.col}`"
            class="grid-cell"
            :class="getCellClasses(cell)"
            :style="getCellStyle(cell)"
            :data-row="cell.row"
            :data-col="cell.col"
            @click="handleCellClick(cell)"
            @mouseenter="handleCellHover(cell, true)"
            @mouseleave="handleCellHover(cell, false)"
            @drop="handleCellDrop(cell, $event)"
            @dragover="handleCellDragOver"
          >
            <!-- Waypoints in cell -->
            <div
              v-for="waypoint in getWaypointsInCell(cell)"
              :key="waypoint.id"
              class="waypoint-marker"
              :class="{
                'waypoint-highlighted': isWaypointHighlighted(waypoint),
                'waypoint-path-start': isPathStart(waypoint),
                'waypoint-path-end': isPathEnd(waypoint),
              }"
              :data-position="waypoint.positionInCell"
              v-show="gridStore.showWaypoints"
            >
              <i class="pi pi-map-marker"></i>
            </div>

            <!-- Entity in cell -->
            <div
              v-if="getEntityInCell(cell) && gridStore.showEntities"
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

          <!-- Camera Icon -->
          <div
            v-if="gridStore.cameraPosition !== 'birdseye'"
            class="camera-icon"
            :style="getCameraStyle()"
          >
            <i class="pi pi-video"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="gridStore.loading" class="grid-loading">
      <ProgressSpinner />
      <p>Loading Grid...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useGridStore } from "../store/grid";
import { motion } from "motion-v";
import Button from "primevue/button";
import ProgressSpinner from "primevue/progressspinner";

const gridStore = useGridStore();

// Refs
const viewport = ref(null);
const gridContainer = ref(null);
const drawingCanvas = ref(null);

// State
const showLayerControls = ref(false);
const isDragging = ref(false);
const lastPanPoint = ref({ x: 0, y: 0 });
const isDrawingDBox = ref(false);
const dboxStartPoint = ref(null);

// Computed
const transformStyle = computed(() => ({
  transform: `translate3d(${gridStore.translateX}px, ${gridStore.translateY}px, 0) scale(${gridStore.scale})`,
  transition: "transform 0.2s ease-out",
}));

const visiblePaths = computed(() => {
  return gridStore.paths.filter((path) => path.waypoints.length >= 2);
});

// Methods
const getCellClasses = (cell) => {
  const classes = [];
  const cellStatus = gridStore.getCellAt(cell.row, cell.col);

  if (cellStatus?.occupied && cellStatus.entityType === "void") {
    classes.push("cell-void");
  }
  if (cellStatus?.sidewalk) {
    classes.push("cell-sidewalk");
  }
  if (
    gridStore.currentCellPosition[0] === cell.row &&
    gridStore.currentCellPosition[1] === cell.col
  ) {
    classes.push("cell-selected");
  }

  return classes;
};

const getCellStyle = (cell) => {
  const baseColor = gridStore.getCellColor(cell.row, cell.col);
  return {
    backgroundColor: baseColor,
    width: `${gridStore.cellWidth}px`,
    height: `${gridStore.cellHeight}px`,
  };
};

const getWaypointsInCell = (cell) => {
  return gridStore.waypointsOnGrid.filter(
    (w) => w.x === cell.row && w.y === cell.col
  );
};

const getEntityInCell = (cell) => {
  return gridStore.entitiesOnGrid.find(
    (e) => e.x === cell.row && e.y === cell.col
  );
};

const getEntityIcon = (entity) => {
  const iconMap = {
    pedestrian: "pi pi-user",
    vehicle: "pi pi-car",
    autonomous: "pi pi-cog",
    obstacle: "pi pi-stop",
  };
  return iconMap[entity.type] || "pi pi-question";
};

const getEntityClasses = (entity) => {
  return [
    `entity-${entity.type}`,
    entity.color !== "#000000" ? "entity-colored" : "",
  ];
};

const getChevronStyle = (entity) => {
  const rotationMap = {
    North: 0,
    "North-East": 45,
    East: 90,
    "South-East": 135,
    South: 180,
    "South-West": 225,
    West: 270,
    "North-West": 315,
  };

  return {
    transform: `rotate(${rotationMap[entity.heading] || 0}deg)`,
  };
};

const getCameraStyle = () => {
  // Position camera icon based on camera position
  const positions = {
    up: { bottom: "20px", left: "50%", transform: "translateX(-50%)" },
    down: { top: "20px", left: "50%", transform: "translateX(-50%)" },
    left: { top: "50%", right: "20px", transform: "translateY(-50%)" },
    right: { top: "50%", left: "20px", transform: "translateY(-50%)" },
  };

  return positions[gridStore.cameraPosition] || positions["up"];
};

const isWaypointHighlighted = (waypoint) => {
  return gridStore.selectedPath?.waypoints.some(
    (pw) =>
      pw.x === waypoint.x &&
      pw.y === waypoint.y &&
      pw.positionInCell === waypoint.positionInCell
  );
};

const isPathStart = (waypoint) => {
  return (
    gridStore.selectedPath?.waypoints[0]?.x === waypoint.x &&
    gridStore.selectedPath?.waypoints[0]?.y === waypoint.y
  );
};

const isPathEnd = (waypoint) => {
  const pathWaypoints = gridStore.selectedPath?.waypoints || [];
  const lastWaypoint = pathWaypoints[pathWaypoints.length - 1];
  return lastWaypoint?.x === waypoint.x && lastWaypoint?.y === waypoint.y;
};

const getPathData = (path) => {
  if (!path.waypoints || path.waypoints.length < 2) return "";

  let pathData = "";
  path.waypoints.forEach((waypoint, index) => {
    const cellElement = document.querySelector(
      `.grid-cell[data-row="${waypoint.x}"][data-col="${waypoint.y}"]`
    );

    if (cellElement) {
      const rect = cellElement.getBoundingClientRect();
      const containerRect = gridContainer.value?.getBoundingClientRect();

      if (containerRect) {
        const x = rect.left - containerRect.left + rect.width / 2;
        const y = rect.top - containerRect.top + rect.height / 2;

        if (index === 0) {
          pathData += `M ${x} ${y}`;
        } else {
          pathData += ` L ${x} ${y}`;
        }
      }
    }
  });

  return pathData;
};

// Event Handlers
const handleCellClick = (cell) => {
  if (gridStore.pathMode) {
    // Add waypoint to path in progress
    const waypoint = {
      x: cell.row,
      y: cell.col,
      positionInCell: "middle-center",
    };
    gridStore.addWaypointToPath(waypoint);
    gridStore.addWaypoint(waypoint);
  } else {
    // Select cell for editing
    gridStore.selectCell(cell.row, cell.col);
  }

  // Animate cell selection
  const cellElement = document.querySelector(
    `.grid-cell[data-row="${cell.row}"][data-col="${cell.col}"]`
  );
  if (cellElement) {
    motion.animate(
      cellElement,
      { scale: [1, 1.1, 1] },
      { duration: 0.3, easing: "easeOut" }
    );
  }
};

const handleCellHover = (cell, isEntering) => {
  const cellElement = document.querySelector(
    `.grid-cell[data-row="${cell.row}"][data-col="${cell.col}"]`
  );

  if (cellElement) {
    if (isEntering) {
      motion.animate(
        cellElement,
        { scale: 1.05, y: -2 },
        { duration: 0.2, easing: "easeOut" }
      );
    } else {
      motion.animate(
        cellElement,
        { scale: 1, y: 0 },
        { duration: 0.2, easing: "easeOut" }
      );
    }
  }
};

const handleWheel = (event) => {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -0.1 : 0.1;
  const newScale = gridStore.scale + delta;
  gridStore.setScale(newScale);
};

const handleMouseDown = (event) => {
  if (event.button === 0) {
    // Left mouse button
    isDragging.value = true;
    lastPanPoint.value = { x: event.clientX, y: event.clientY };
    viewport.value.style.cursor = "grabbing";
  }
};

const handleMouseMove = (event) => {
  if (isDragging.value) {
    const deltaX = event.clientX - lastPanPoint.value.x;
    const deltaY = event.clientY - lastPanPoint.value.y;

    gridStore.setTranslation(
      gridStore.translateX + deltaX,
      gridStore.translateY + deltaY
    );

    lastPanPoint.value = { x: event.clientX, y: event.clientY };
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
  viewport.value.style.cursor = "grab";
};

const handleDrop = (event) => {
  event.preventDefault();
  // Handle dropping entities on grid background
};

const handleDragOver = (event) => {
  event.preventDefault();
};

const handleCellDrop = (cell, event) => {
  event.preventDefault();
  event.stopPropagation();

  const entityType = event.dataTransfer?.getData("text/plain");
  if (entityType) {
    gridStore.addEntity({
      type: entityType,
      x: cell.row,
      y: cell.col,
    });
  }
};

const handleCellDragOver = (event) => {
  event.preventDefault();
};

// Lifecycle
onMounted(() => {
  gridStore.initializeGrid();

  // Add global event listeners
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);

  // Setup drawing canvas
  if (drawingCanvas.value) {
    const canvas = drawingCanvas.value;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 2;
  }
});

onUnmounted(() => {
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
});

// Watch for grid store changes and animate
watch(
  () => gridStore.scale,
  (newScale, oldScale) => {
    if (Math.abs(newScale - oldScale) > 0.01) {
      // Animate scale change
      motion.animate(
        gridContainer.value,
        { scale: [oldScale, newScale] },
        { duration: 0.3, easing: "easeOut" }
      );
    }
  }
);
</script>

<style scoped>
.carjan-grid-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.layer-controls {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  transition: all 0.3s ease;
}

.layer-controls.visible .layer-buttons {
  transform: translateX(0);
  opacity: 1;
}

.layer-toggle-btn {
  margin-bottom: 10px;
}

.layer-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  transform: translateX(-10px);
  opacity: 0.7;
  transition: all 0.3s ease;
}

.layer-buttons .p-button {
  width: 40px;
  height: 40px;
}

.grid-viewport {
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  display: flex;
  justify-content: center;
  align-items: center;
}

.grid-room {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transform-origin: center;
}

.grid-main {
  position: relative;
  display: grid;
  grid-template-columns: repeat(8, 60px);
  grid-template-rows: repeat(12, 50px);
  gap: 1px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 999;
  pointer-events: none;
}

.coordinate-system {
  position: absolute;
  top: -40px;
  left: -40px;
  right: -40px;
  bottom: -40px;
  pointer-events: none;
}

.column-numbers {
  position: absolute;
  top: -35px;
  left: 20px;
  display: flex;
  gap: 1px;
}

.col-number {
  width: 60px;
  text-align: center;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.row-numbers {
  position: absolute;
  left: -35px;
  top: 20px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.row-number {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.axis-label {
  font-size: 0.75rem !important;
  color: white !important;
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
}

.path-line:hover {
  stroke-width: 6;
}

.grid-cell {
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  cursor: pointer;
  backdrop-filter: blur(5px);
  border-radius: 4px;
}

.grid-cell:hover {
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.cell-void {
  background-color: #333333 !important;
  opacity: 0.7;
}

.cell-sidewalk {
  border: 2px dashed rgba(255, 255, 255, 0.5);
}

.cell-selected {
  border: 2px solid #ff6b6b !important;
  box-shadow: 0 0 16px rgba(255, 107, 107, 0.5);
}

.waypoint-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #9c27b0;
  font-size: 20px;
  transition: all 0.3s ease;
  z-index: 10;
}

.waypoint-marker:hover {
  transform: translate(-50%, -50%) scale(1.3);
  text-shadow: 0 0 8px rgba(156, 39, 176, 0.8);
}

.waypoint-highlighted {
  color: #e91e63 !important;
  font-size: 24px !important;
  text-shadow: 0 0 12px rgba(233, 30, 99, 0.8);
}

.waypoint-path-start {
  color: #4caf50 !important;
}

.waypoint-path-end {
  color: #f44336 !important;
}

.entity-marker {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: #ff9800;
  transition: all 0.3s ease;
  z-index: 5;
}

.entity-marker:hover {
  transform: translate(-50%, -50%) scale(1.2);
}

.entity-chevron {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 12px;
  color: #666;
  transition: transform 0.3s ease;
}

.camera-icon {
  position: absolute;
  color: #f2711c;
  font-size: 24px;
  z-index: 15;
  transition: all 0.3s ease;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.grid-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.grid-loading p {
  margin-top: 16px;
  font-weight: 600;
  color: #333;
}

/* Animations */
@keyframes cell-select {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes waypoint-add {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.3);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.waypoint-marker {
  animation: waypoint-add 0.5s ease-out;
}

.entity-marker {
  animation: waypoint-add 0.4s ease-out;
}
</style>
