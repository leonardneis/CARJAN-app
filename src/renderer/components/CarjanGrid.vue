<template>
  <div class="carjan-grid-container">
    <!-- Top Bar (Hidden - using CarjanEditor top bar instead) -->
    <div class="top-bar" style="display: none">
      <!-- Scenario Info -->
      <div class="top-bar-left">
        <div class="scenario-info">
          <i class="pi pi-file-edit"></i>
          <Badge
            v-if="gridStore.scenarioName"
            :value="gridStore.scenarioName"
            severity="info"
          />
          <span v-else class="no-scenario">No Scenario</span>
        </div>
      </div>
      <!-- Layer Controls -->
      <div class="top-bar-center">
        <div class="layer-toggle-container">
          <Button
            icon="pi pi-eye"
            class="layer-main-toggle"
            @click="toggleLayerView"
            size="small"
            :class="{ 'layer-expanded': layerViewExpanded }"
            rounded
          />

          <div class="layer-toggles" :class="{ expanded: layerViewExpanded }">
            <Button
              icon="pi pi-th-large"
              :class="{ 'p-button-success': gridStore.showGrid }"
              @click="gridStore.toggleGrid()"
              size="small"
              rounded
              v-tooltip="'Toggle Grid'"
            />
            <Button
              icon="pi pi-users"
              :class="{ 'p-button-success': gridStore.showEntities }"
              @click="gridStore.toggleEntities()"
              size="small"
              rounded
              v-tooltip="'Toggle Entities'"
            />
            <Button
              icon="pi pi-share-alt"
              :class="{ 'p-button-success': gridStore.showPaths }"
              @click="gridStore.togglePaths()"
              size="small"
              rounded
              v-tooltip="'Toggle Paths'"
            />
            <Button
              icon="pi pi-map-marker"
              :class="{ 'p-button-success': gridStore.showWaypoints }"
              @click="gridStore.toggleWaypoints()"
              size="small"
              rounded
              v-tooltip="'Toggle Waypoints'"
            />
            <Button
              icon="pi pi-inbox"
              :class="{ 'p-button-success': gridStore.showDBoxes }"
              @click="gridStore.toggleDBoxes()"
              size="small"
              rounded
              v-tooltip="'Toggle Decision Boxes'"
            />
          </div>
        </div>
        <!-- Status Info -->
        <div class="status-info">
          <Badge
            :value="`${Math.round(gridStore.scale * 100)}%`"
            severity="info"
          />
          <Badge
            v-if="hoveredCell.x !== null && hoveredCell.y !== null"
            :value="`X: ${hoveredCell.y}, Y: ${hoveredCell.x}`"
            severity="secondary"
          />
          <Badge v-else value="X: -, Y: -" severity="secondary" />
        </div>
      </div>

      <!-- Exit Button -->
      <div class="top-bar-right">
        <Button
          icon="pi pi-times"
          label="Exit"
          severity="danger"
          @click="$emit('quit-editor')"
          size="small"
        />
      </div>
    </div>

    <!-- Pan Mode Indicator -->
    <div v-if="isSpacePressed" class="pan-mode-indicator">
      <i class="pi pi-arrows-alt"></i>
      <span>Pan Mode - Hold Space + Drag</span>
    </div>

    <!-- Grid Viewport -->
    <div
      class="grid-viewport"
      ref="viewport"
      :style="backgroundStyle"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    >
      <div class="grid-room" :style="transformStyle">
        <!-- Grid Container -->
        <div
          class="grid-main"
          :class="{ 'grid-blurred': gridBlurred }"
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
          <!-- Grid Cells - Animation Version -->
          <motion.div
            v-if="!rippleAnimationComplete"
            v-for="cell in gridStore.gridCells"
            :key="`motion-cell-${cell.row}-${cell.col}`"
            class="grid-cell"
            :class="getCellClasses(cell)"
            :style="getCellStyle(cell)"
            :data-row="cell.row"
            :data-col="cell.col"
            :initial="{ scale: 0, opacity: 0 }"
            :animate="{
              scale: [0, 1.1, 1],
              opacity: [0, 0.8, 1],
            }"
            :transition="{
              duration: 0.6,
              delay: getCellAnimationDelay(cell),
              ease: [0.23, 1, 0.32, 1],
              times: [0, 0.6, 1],
            }"
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
          </motion.div>

          <!-- Grid Cells - Performance Version (after animation) -->
          <div
            v-if="rippleAnimationComplete"
            v-for="cell in gridStore.gridCells"
            :key="`div-cell-${cell.row}-${cell.col}`"
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
    <!-- Bottom Control Center -->
    <motion.div
      ref="controlCenterRef"
      class="control-center"
      :style="{
        width: debouncedControlCenterExpanded ? '300px' : '56px',
        height: debouncedControlCenterExpanded ? '84px' : '56px',
        borderRadius: debouncedControlCenterExpanded ? '42px' : '28px',
        left: debouncedControlCenterExpanded
          ? 'calc(50% - 150px)'
          : 'calc(50% - 28px)',
      }"
      :animate="{
        width: debouncedControlCenterExpanded ? '300px' : '56px',
        height: debouncedControlCenterExpanded ? '84px' : '56px',
        borderRadius: debouncedControlCenterExpanded ? '42px' : '28px',
        left: debouncedControlCenterExpanded
          ? 'calc(50% - 150px)'
          : 'calc(50% - 28px)',
      }"
      :transition="{ duration: 0.3, ease: 'easeInOut' }"
      @mouseenter="handleControlCenterMouseEnter"
      @mouseleave="handleControlCenterMouseLeave"
    >
      <!-- Control Center Toggle Button -->
      <motion.div
        :style="{
          opacity: debouncedControlCenterToggleHidden ? 0 : 1,
          transform: debouncedControlCenterToggleHidden
            ? 'scale(0.8)'
            : 'scale(1)',
        }"
        :animate="{
          opacity: debouncedControlCenterToggleHidden ? 0 : 1,
          scale: debouncedControlCenterToggleHidden ? 0.8 : 1,
        }"
        :transition="{ duration: 0.3 }"
        style="position: absolute; z-index: 2"
      >
        <Button
          ref="controlToggleRef"
          icon="pi pi-eye"
          class="control-toggle"
          rounded
          text
          @click="toggleControlCenter"
        />
      </motion.div>
      <!-- Control Center Content -->
      <motion.div
        ref="controlContentRef"
        class="control-content"
        :style="{
          opacity: immediateContentVisible ? 1 : 0,
          transform: immediateContentVisible ? 'scale(1)' : 'scale(0.8)',
          pointerEvents: immediateContentVisible ? 'auto' : 'none',
        }"
        :animate="{
          opacity: immediateContentVisible ? 1 : 0,
          scale: immediateContentVisible ? 1 : 0.8,
        }"
        :transition="{ duration: 0.3 }"
      >
        <!-- Layer Controls -->
        <div class="layer-controls">
          <Button
            icon="pi pi-th-large"
            :class="{ 'p-button-success': gridStore.showGrid }"
            @click="gridStore.toggleGrid()"
            size="small"
            rounded
            v-tooltip.bottom="{ value: 'Toggle Grid', showDelay: 300 }"
          />
          <Button
            icon="pi pi-users"
            :class="{ 'p-button-success': gridStore.showEntities }"
            @click="gridStore.toggleEntities()"
            size="small"
            rounded
            v-tooltip.bottom="{ value: 'Toggle Entities', showDelay: 300 }"
          />
          <Button
            icon="pi pi-share-alt"
            :class="{ 'p-button-success': gridStore.showPaths }"
            @click="gridStore.togglePaths()"
            size="small"
            rounded
            v-tooltip.bottom="{ value: 'Toggle Paths', showDelay: 300 }"
          />
          <Button
            icon="pi pi-map-marker"
            :class="{ 'p-button-success': gridStore.showWaypoints }"
            @click="gridStore.toggleWaypoints()"
            size="small"
            rounded
            v-tooltip.bottom="{ value: 'Toggle Waypoints', showDelay: 300 }"
          />
          <Button
            icon="pi pi-inbox"
            :class="{ 'p-button-success': gridStore.showDBoxes }"
            @click="gridStore.toggleDBoxes()"
            size="small"
            rounded
            v-tooltip.bottom="{
              value: 'Toggle Decision Boxes',
              showDelay: 300,
            }"
          />
        </div>
      </motion.div>
    </motion.div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, Transition } from "vue";
import { useGridStore } from "../store/grid";
import { motion, animate } from "motion-v";
import Button from "primevue/button";
import Badge from "primevue/badge";
import ProgressSpinner from "primevue/progressspinner";

const gridStore = useGridStore();

// Define emits
const emit = defineEmits([
  "cell-selected",
  "entity-selected",
  "path-selected",
  "toggle-path-mode",
  "toggle-dbox-mode",
  "quit-editor",
  "cell-hovered",
]);

// Refs
const viewport = ref(null);
const gridContainer = ref(null);
const drawingCanvas = ref(null);

// State
const isDragging = ref(false);
const lastPanPoint = ref({ x: 0, y: 0 });
const isDrawingDBox = ref(false);
const dboxStartPoint = ref(null);
const isSpacePressed = ref(false);
const controlCenterExpanded = ref(false);
const controlCenterHovered = ref(false);
const layerViewExpanded = ref(false);
const hoveredCell = ref({ x: null, y: null });

// Control center animation refs
const controlCenterRef = ref(null);
const controlToggleRef = ref(null);
const controlContentRef = ref(null);
let morphAnimation = null;

// Debounced state for smooth animations with different timing
const debouncedControlCenterExpanded = useDebouncedState(
  controlCenterExpanded,
  0.1
);

// Separate debounced state for content (delayed appearance only when expanding)
const debouncedControlCenterContentVisible = useDebouncedState(
  controlCenterExpanded,
  0.2
);

// Separate debounced state for toggle hiding (faster)
const debouncedControlCenterToggleHidden = useDebouncedState(
  controlCenterExpanded,
  0.05
);

// Immediate content visibility control (no delay on hide)
const immediateContentVisible = ref(false);

// Watch for expansion changes to handle immediate hiding
watch(controlCenterExpanded, (newValue) => {
  if (newValue) {
    // When expanding, wait for debounced visibility
    // (this will be handled by debouncedControlCenterContentVisible)
  } else {
    // When collapsing, hide immediately to prevent glitch
    immediateContentVisible.value = false;
  }
});

// Watch debounced content visibility for delayed showing
watch(debouncedControlCenterContentVisible, (newValue) => {
  if (newValue) {
    immediateContentVisible.value = true;
  }
});

function useDebouncedState(value, duration = 0.2) {
  const debouncedValue = ref(value.value);

  let timeout;
  watch(value, (newValue) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      debouncedValue.value = newValue;
    }, duration * 1000);
  });

  onUnmounted(() => clearTimeout(timeout));

  return debouncedValue;
}

// Computed
const transformStyle = computed(() => ({
  transform: `translate3d(${gridStore.translateX}px, ${gridStore.translateY}px, 0) scale(${gridStore.scale})`,
  transition: isDragging.value ? "none" : "transform 0.2s ease-out",
}));

const backgroundStyle = computed(() => {
  // Very minimal scaling to prevent parallax effect
  const baseDotSize = 30;
  const scaleFactor = 0.95 + (gridStore.scale - 1) * 0.05; // Much more subtle scaling
  const dotSize = baseDotSize * Math.max(0.9, Math.min(scaleFactor, 1.1)); // Very limited range
  const offsetX = gridStore.translateX % dotSize;
  const offsetY = gridStore.translateY % dotSize;

  return {
    backgroundImage: `radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 1px, transparent 1px)`,
    backgroundSize: `${dotSize}px ${dotSize}px`,
    backgroundPosition: `${offsetX}px ${offsetY}px`,
    transition: isDragging.value
      ? "none"
      : "background-size 0.2s ease-out, background-position 0.2s ease-out",
  };
});

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
    animate(
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
      // Update hovered cell coordinates (X is horizontal/col, Y is vertical/row)
      hoveredCell.value = { x: cell.row, y: cell.col };
      emit("cell-hovered", { x: cell.col, y: cell.row }); // X=col, Y=row for correct orientation

      animate(
        cellElement,
        { scale: 1.04, y: -1 },
        { duration: 0.2, easing: "easeOut" }
      );
    } else {
      // Clear hovered cell coordinates
      hoveredCell.value = { x: null, y: null };
      emit("cell-hovered", null);

      animate(
        cellElement,
        { scale: 1, y: 0 },
        { duration: 0.2, easing: "easeOut" }
      );
    }
  }
};

const handleWheel = (event) => {
  event.preventDefault();
  event.stopPropagation();

  // Zoom-Faktor
  const delta = event.deltaY > 0 ? -0.15 : 0.15;
  const newScale = Math.max(0.1, Math.min(5.0, gridStore.scale + delta));

  performZoom(newScale);
};

const handleMouseDown = (event) => {
  // Nur pannen wenn Leertaste gedrückt ist
  if (event.button === 0 && isSpacePressed.value) {
    isDragging.value = true;
    lastPanPoint.value = { x: event.clientX, y: event.clientY };
    viewport.value.style.cursor = "grabbing";
    event.preventDefault();
  }
};

const handleMouseMove = (event) => {
  if (isDragging.value && isSpacePressed.value) {
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
  if (isDragging.value) {
    isDragging.value = false;
    updateCursor();
  }
};

// Handler for when mouse leaves the viewport area
const handleMouseLeave = (event) => {
  // Nur bei echtem Verlassen des Viewport-Bereichs stoppen
  if (isDragging.value && !viewport.value?.contains(event.relatedTarget)) {
    isDragging.value = false;
    updateCursor();
  }
};

// Global mouse event handler to catch mouse leave from document
const handleGlobalMouseUp = (event) => {
  if (isDragging.value) {
    isDragging.value = false;
    updateCursor();
  }
};
const handleKeyDown = (event) => {
  if (event.code === "Space" && !isSpacePressed.value) {
    event.preventDefault();
    isSpacePressed.value = true;
    updateCursor();
  }
};

const handleKeyUp = (event) => {
  if (event.code === "Space" && isSpacePressed.value) {
    event.preventDefault();
    isSpacePressed.value = false;
    isDragging.value = false; // Stop dragging when space is released
    updateCursor();
  }
};

// Cursor management
const updateCursor = () => {
  if (!viewport.value) return;

  if (isDragging.value && isSpacePressed.value) {
    viewport.value.style.cursor = "grabbing";
  } else if (isSpacePressed.value) {
    viewport.value.style.cursor = "grab";
  } else {
    viewport.value.style.cursor = "default";
  }
};

// Zoom and pan controls
const performZoom = (newScale) => {
  const oldScale = gridStore.scale;

  if (newScale !== oldScale) {
    // Get the grid container dimensions
    const gridRect = gridContainer.value?.getBoundingClientRect();
    const viewportRect = viewport.value?.getBoundingClientRect();

    if (gridRect && viewportRect) {
      // Calculate the current center of the grid in viewport coordinates
      const gridCenterX =
        gridRect.left + gridRect.width / 2 - viewportRect.left;
      const gridCenterY = gridRect.top + gridRect.height / 2 - viewportRect.top;

      // Calculate the viewport center
      const viewportCenterX = viewportRect.width / 2;
      const viewportCenterY = viewportRect.height / 2;

      // Calculate scale ratio
      const scaleRatio = newScale / oldScale;

      // Adjust translation to keep the grid center fixed relative to viewport center
      const newTranslateX =
        gridStore.translateX -
        (gridCenterX - viewportCenterX) * (scaleRatio - 1);
      const newTranslateY =
        gridStore.translateY -
        (gridCenterY - viewportCenterY) * (scaleRatio - 1);

      gridStore.setScale(newScale);
      gridStore.setTranslation(newTranslateX, newTranslateY);
    }
  }
};

// Toolbar management
const expandControlCenter = () => {
  controlCenterHovered.value = true;
  controlCenterExpanded.value = true;
};

const collapseControlCenter = () => {
  controlCenterHovered.value = false;
  // Small delay to allow mouse to move to controls
  setTimeout(() => {
    if (!controlCenterHovered.value) {
      controlCenterExpanded.value = false;
    }
  }, 150);
};

const handleControlCenterMouseEnter = () => {
  controlCenterHovered.value = true;
  expandControlCenter();
};

const handleControlCenterMouseLeave = () => {
  controlCenterHovered.value = false;
  collapseControlCenter();
};

const toggleControlCenter = () => {
  if (controlCenterExpanded.value) {
    collapseControlCenter();
  } else {
    expandControlCenter();
  }
};

// Layer view management
const toggleLayerView = () => {
  layerViewExpanded.value = !layerViewExpanded.value;
};

// Mode management
const getCurrentMode = () => {
  if (gridStore.pathMode) return "path";
  if (gridStore.canvasMode === "dbox") return "dbox";
  return "edit";
};

const getCurrentModeIcon = (mode) => {
  const icons = {
    edit: "pi pi-pencil",
    path: "pi pi-share-alt",
    dbox: "pi pi-inbox",
  };
  return icons[mode] || "pi pi-pencil";
};

// Mode-Management ist jetzt in CarjanEditor.vue

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
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  // Globaler MouseUp Handler für bessere Pan-Kontrolle
  window.addEventListener("mouseup", handleGlobalMouseUp);
  window.addEventListener("blur", handleGlobalMouseUp);

  // Ensure viewport can receive focus for keyboard events
  if (viewport.value) {
    viewport.value.setAttribute("tabindex", "0");
    viewport.value.focus();
  }

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
  document.removeEventListener("keydown", handleKeyDown);
  document.removeEventListener("keyup", handleKeyUp);
  window.removeEventListener("mouseup", handleGlobalMouseUp);
  window.removeEventListener("blur", handleGlobalMouseUp);

  // Stop any running animations
  if (morphAnimation) {
    morphAnimation.stop();
  }
});

// Random animation center for staggered grid effect
const animationCenter = ref({ row: 0, col: 0 });
const gridBlurred = ref(true); // Start with blur, remove after animation
const rippleAnimationComplete = ref(false); // Track animation completion

// Initialize random animation center on component mount
onMounted(() => {
  // Generate random center within grid bounds (assuming 12 rows, 8 cols)
  animationCenter.value = {
    row: Math.floor(Math.random() * 12),
    col: Math.floor(Math.random() * 8),
  };

  // Remove blur after animation completes
  const maxDistance = 11 + 7; // max possible distance
  const maxDelay = maxDistance * 0.05;
  const animationDuration = 0.6;
  const totalTime = maxDelay + animationDuration;
  const switchTime = totalTime - 0.5; // Switch divs 0.5s earlier

  setTimeout(() => {
    gridBlurred.value = false;
    rippleAnimationComplete.value = true;

    // Emit event to trigger panel fade-in
    window.dispatchEvent(new CustomEvent("ripple-animation-complete"));
  }, switchTime * 1000);
});

// Watch for map animation trigger
watch(
  () => gridStore.mapAnimating,
  (newValue) => {
    if (newValue) {
      // Reset animation state
      gridBlurred.value = true;
      rippleAnimationComplete.value = false;

      // Generate new random center for this map load
      animationCenter.value = {
        row: Math.floor(Math.random() * gridStore.gridRows),
        col: Math.floor(Math.random() * gridStore.gridCols),
      };

      // Calculate animation completion time
      const maxDistance = gridStore.gridRows - 1 + (gridStore.gridCols - 1);
      const maxDelay = maxDistance * 0.05;
      const animationDuration = 0.6;
      const totalTime = maxDelay + animationDuration;
      const switchTime = totalTime - 0.5;

      // Complete animation and notify store
      setTimeout(() => {
        gridBlurred.value = false;
        rippleAnimationComplete.value = true;
        gridStore.completeMapAnimation();

        // Emit event to trigger panel fade-in
        window.dispatchEvent(new CustomEvent("ripple-animation-complete"));
      }, switchTime * 1000);
    }
  }
);

// Animation delay calculation for staggered grid effect
const getCellAnimationDelay = (cell) => {
  // Calculate distance from random center using Manhattan distance for ripple effect
  const distance =
    Math.abs(cell.row - animationCenter.value.row) +
    Math.abs(cell.col - animationCenter.value.col);

  // Base delay + distance-based staggering (50ms per distance unit)
  return distance * 0.05; // 50ms converted to seconds
};

// Watch for space key state changes
watch(isSpacePressed, (newValue) => {
  updateCursor();
});
</script>

<style scoped>
.carjan-grid-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000000;
}

.pan-mode-indicator {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  animation: fadeInScale 0.2s ease-out;
  pointer-events: none;
  user-select: none;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}

.control-center {
  position: fixed;
  bottom: 60px; /* Add margin from bottom */
  z-index: 1500;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 28px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  overflow: visible;
  cursor: pointer;
  transform-origin: center center;
  contain: layout; /* Prevents layout shifts */
  will-change: transform, width, height; /* Optimizes animations */
}

.control-center:hover {
  background: rgba(255, 255, 255, 0.12);
}

.control-toggle {
  min-width: 28px !important;
  width: 28px !important;
  height: 28px !important;
  color: white !important;
  flex-shrink: 0;
}

.control-content {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  position: absolute;
  left: 12px;
  right: 12px;
  height: 100%;
  padding: 0 8px;
}

.layer-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 8px;
}

.zoom-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 8px 12px;
}

.zoom-level {
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  min-width: 38px;
  text-align: center;
}

.control-section .p-button {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  color: rgba(255, 255, 255, 0.8) !important;
  transition: all 0.2s ease;
}

.control-section .p-button:hover {
  color: white !important;
  transform: scale(1.1);
}

.control-section .p-button.p-button-info {
  color: #2196f3 !important;
}

/* Control Center Toggle */

.grid-viewport {
  width: 100%;
  height: 100%; /* Full height since top bar is now in CarjanEditor */
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  outline: none;
}

.grid-room {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transform-origin: center center;
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
  transition: backdrop-filter 1s ease-out;
}

.grid-main.grid-blurred {
  backdrop-filter: blur(25px);
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 999;
  pointer-events: none;
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
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3),
    0 0 16px rgba(255, 255, 255, 0.1);
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

/* Top Bar Styles */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1001;
  background: rgba(26, 32, 44, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
}

.top-bar-left,
.top-bar-center,
.top-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-bar-center {
  flex: 1;
  justify-content: center;
  gap: 20px;
}

.scenario-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
}

.scenario-info i {
  color: rgba(255, 255, 255, 0.7);
}

.no-scenario {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  font-style: italic;
}

.layer-dropdown {
  position: relative;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Layer Toggle Container */
.layer-toggle-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  padding: 4px;
  transition: all 0.3s ease;
}

.layer-main-toggle {
  transition: all 0.3s ease;
}

.layer-main-toggle.layer-expanded {
  background: rgba(255, 255, 255, 0.2) !important;
}

.layer-toggles {
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.layer-toggles.expanded {
  max-width: 250px;
  opacity: 1;
}

.layer-toggles .p-button {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  flex-shrink: 0;
}

.section-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mode-buttons,
.mode-display,
.layer-controls,
.view-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.layer-controls .p-button {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.8) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.layer-controls .p-button i {
  font-size: 20px !important;
  margin: 0 !important;
}

.layer-controls .p-button:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

.layer-controls .p-button.p-button-success {
  background: rgba(76, 175, 80, 0.3) !important;
  border-color: rgba(76, 175, 80, 0.5) !important;
  color: #4caf50 !important;
}

.mode-display .current-mode {
  display: flex;
  align-items: center;
  gap: 4px;
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.mode-display .mode-edit {
  color: #64b5f6 !important;
  background: rgba(100, 181, 246, 0.2) !important;
}

.mode-display .mode-path {
  color: #81c784 !important;
  background: rgba(129, 199, 132, 0.2) !important;
}

.mode-display .mode-dbox {
  color: #ffb74d !important;
  background: rgba(255, 183, 77, 0.2) !important;
}

.mode-buttons .p-button.mode-active {
  background: rgba(33, 150, 243, 0.3) !important;
  color: #2196f3 !important;
  box-shadow: 0 0 20px rgba(33, 150, 243, 0.3);
}

.zoom-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 8px 12px;
}

.zoom-level {
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
  min-width: 38px;
  text-align: center;
}

.control-section .p-button {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  color: rgba(255, 255, 255, 0.8) !important;
  transition: all 0.2s ease;
}

.control-section .p-button:hover {
  color: white !important;
  transform: scale(1.1);
}

.control-section .p-button.p-button-info {
  color: #2196f3 !important;
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
