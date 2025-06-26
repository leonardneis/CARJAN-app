<template>
  <div class="carjan-import">
    <div class="import-header">
      <h3>
        <i class="pi pi-cog"></i>
        General
      </h3>
      <p class="subtitle">Manage scenarios and project settings</p>
    </div>

    <!-- Current Scenario Info -->
    <Card
      v-if="scenarioStore.metadata.name !== 'Untitled Scenario'"
      class="file-section glass"
    >
      <template #title>Current Scenario</template>
      <template #content>
        <div class="current-scenario">
          <div class="scenario-info">
            <i class="pi pi-file"></i>
            <div>
              <div class="scenario-name">
                {{ scenarioStore.metadata.name }}
              </div>
              <div class="scenario-meta">
                {{ gridStore.entities?.length || 0 }}
                entities •
                {{ scenarioStore.isUnsaved ? "Unsaved changes" : "Saved" }}
              </div>
            </div>
          </div>
          <div class="scenario-actions">
            <Button
              icon="pi pi-save"
              :label="scenarioStore.isUnsaved ? 'Save*' : 'Save'"
              @click="saveCurrentScenario"
              :severity="scenarioStore.isUnsaved ? 'warn' : 'secondary'"
              size="small"
            />
            <Button
              icon="pi pi-download"
              label="Export"
              @click="exportScenario"
              severity="info"
              size="small"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- File Operations -->
    <Card class="file-section glass">
      <template #title>File Operations</template>
      <template #content>
        <div class="file-operations">
          <Button
            label="New Scenario"
            icon="pi pi-plus"
            @click="createNewScenario"
            severity="success"
            size="small"
          />
          <Button
            label="Open Scenario"
            icon="pi pi-folder-open"
            @click="openScenario"
            severity="info"
            size="small"
          />
          <Button
            label="Import JSON"
            icon="pi pi-upload"
            @click="importScenario"
            severity="secondary"
            size="small"
          />
          <Button
            label="Save As..."
            icon="pi pi-save"
            @click="saveScenarioAs"
            severity="secondary"
            size="small"
          />
        </div>
      </template>
    </Card>

    <!-- Example Scenarios -->
    <!-- Removed: Users can now select files via Open Scenario with Windows File Manager -->

    <!-- Recent Files -->
    <Card v-if="recentFiles.length > 0" class="file-section glass">
      <template #title>Recent Files</template>
      <template #content>
        <div class="file-list">
          <div
            v-for="file in recentFiles"
            :key="file.path"
            class="file-item"
            @click="loadRecentFile(file)"
          >
            <i class="pi pi-file"></i>
            <div class="file-info">
              <div class="file-name">{{ getFileName(file.path) }}</div>
              <div class="file-meta">{{ formatDate(file.lastModified) }}</div>
            </div>
            <Button
              icon="pi pi-folder-open"
              text
              size="small"
              @click.stop="loadRecentFile(file)"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- CARLA Integration -->
    <Card class="file-section glass">
      <template #title>CARLA Integration</template>
      <template #content>
        <div class="carla-integration">
          <!-- Connection Status -->
          <div class="connection-status">
            <div class="status-indicator">
              <i class="pi pi-circle-fill" :class="connectionStatusClass"></i>
              <span>{{ connectionStatusText }}</span>
            </div>
            <Button
              :label="isConnected ? 'Disconnect' : 'Connect'"
              :icon="isConnected ? 'pi pi-times' : 'pi pi-link'"
              @click="toggleConnection"
              :severity="isConnected ? 'danger' : 'success'"
              size="small"
            />
          </div>

          <!-- Export Options -->
          <div class="export-section">
            <div class="export-options">
              <div class="option-row">
                <Checkbox
                  v-model="exportSettings.showGrid"
                  inputId="carla-grid"
                />
                <label for="carla-grid">Show Grid</label>
              </div>
              <div class="option-row">
                <Checkbox
                  v-model="exportSettings.showPaths"
                  inputId="carla-paths"
                />
                <label for="carla-paths">Show Paths</label>
              </div>
              <div class="option-row">
                <Checkbox
                  v-model="exportSettings.loadLayers"
                  inputId="carla-layers"
                />
                <label for="carla-layers">Load Layers</label>
              </div>
            </div>

            <div class="export-actions">
              <Button
                label="Export to CARLA"
                icon="pi pi-upload"
                @click="exportToCarla"
                severity="success"
                size="small"
                :disabled="!isConnected"
              />
              <Button
                label="Preview"
                icon="pi pi-eye"
                @click="previewExport"
                severity="info"
                size="small"
              />
            </div>
          </div>

          <!-- Connection Log -->
          <div class="connection-log">
            <div class="log-header">
              <span>Connection Log</span>
              <Button
                icon="pi pi-trash"
                @click="clearLog"
                text
                size="small"
                severity="secondary"
              />
            </div>
            <div class="log-content">
              <div v-if="connectionLog.length === 0" class="log-empty">
                No connection activity
              </div>
              <div
                v-for="(entry, index) in connectionLog"
                :key="index"
                class="log-entry"
                :class="entry.type"
              >
                <span class="log-time">{{
                  formatLogTime(entry.timestamp)
                }}</span>
                <span class="log-message">{{ entry.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Warp Overlay for CARLA Connection -->
    <WarpOverlay
      :is-visible="showWarpOverlay"
      :type="warpOverlayType"
      :title="warpOverlayTitle"
      :message="warpOverlayMessage"
      :duration="1200"
      @close="hideWarpOverlay"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import Card from "primevue/card";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import { useScenarioStore } from "../store/scenario";
import { useGridStore } from "../store/grid";
import { fileManager } from "../services/fileManager";
import WarpOverlay from "./WarpOverlay.vue";

const toast = useToast();
const scenarioStore = useScenarioStore();
const gridStore = useGridStore();

defineEmits(["map-loaded", "scenario-loaded"]);

// CARLA Integration State
const isConnected = ref(false);
const exportSettings = ref({
  showGrid: true,
  showPaths: true,
  loadLayers: false,
});
const connectionLog = ref([]);

// Warp Overlay state
const showWarpOverlay = ref(false);
const warpOverlayType = ref("success");
const warpOverlayTitle = ref("");
const warpOverlayMessage = ref("");

// Connection status computed
const connectionStatusClass = computed(() =>
  isConnected.value ? "status-connected" : "status-disconnected"
);

const connectionStatusText = computed(() =>
  isConnected.value ? "Connected to CARLA" : "Disconnected"
);

// Recent files from the store
const recentFiles = computed(() => scenarioStore.recentFiles);

// File operations
const createNewScenario = async () => {
  try {
    await scenarioStore.createNewScenario();
    toast.add({
      severity: "success",
      summary: "New Scenario",
      detail: "Created a new scenario",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to create new scenario",
      life: 3000,
    });
  }
};

const openScenario = async () => {
  try {
    const success = await scenarioStore.openScenario();
    if (success) {
      toast.add({
        severity: "success",
        summary: "Scenario Loaded",
        detail: "Scenario opened successfully",
        life: 3000,
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to open scenario",
      life: 3000,
    });
  }
};

const importScenario = async () => {
  try {
    const success = await scenarioStore.importScenario();
    if (success) {
      toast.add({
        severity: "success",
        summary: "Scenario Imported",
        detail: "Scenario imported successfully",
        life: 3000,
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to import scenario",
      life: 3000,
    });
  }
};

const saveCurrentScenario = async () => {
  try {
    await scenarioStore.saveCurrentScenario();
    toast.add({
      severity: "success",
      summary: "Saved",
      detail: "Scenario saved successfully",
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to save scenario",
      life: 3000,
    });
  }
};

const saveScenarioAs = async () => {
  try {
    const success = await scenarioStore.saveScenarioAs();
    if (success) {
      toast.add({
        severity: "success",
        summary: "Saved As",
        detail: "Scenario saved to new location",
        life: 3000,
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to save scenario",
      life: 3000,
    });
  }
};

const exportScenario = async () => {
  try {
    const success = await scenarioStore.exportScenario();
    if (success) {
      toast.add({
        severity: "success",
        summary: "Exported",
        detail: "Scenario exported successfully",
        life: 3000,
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to export scenario",
      life: 3000,
    });
  }
};

// CARLA Integration Functions
const toggleConnection = () => {
  isConnected.value = !isConnected.value;

  // Show Warp Overlay
  showWarpOverlay.value = true;

  if (isConnected.value) {
    warpOverlayType.value = "success";
    warpOverlayTitle.value = "Connected";
    warpOverlayMessage.value = "Successfully connected to CARLA simulation";
  } else {
    warpOverlayType.value = "error";
    warpOverlayTitle.value = "Disconnected";
    warpOverlayMessage.value = "Disconnected from CARLA simulation";
  }

  const logEntry = {
    timestamp: new Date(),
    type: isConnected.value ? "success" : "info",
    message: isConnected.value
      ? "Connected to CARLA simulator"
      : "Disconnected from CARLA simulator",
  };
  connectionLog.value.unshift(logEntry);

  // Small toast notification (less prominent than warp overlay)
  toast.add({
    severity: isConnected.value ? "success" : "info",
    summary: isConnected.value ? "CARLA Connected" : "CARLA Disconnected",
    detail: isConnected.value ? "Ready for simulation" : "Connection closed",
    life: 1500,
  });
};

const hideWarpOverlay = () => {
  showWarpOverlay.value = false;
};

const exportToCarla = async () => {
  if (!isConnected.value) {
    toast.add({
      severity: "warn",
      summary: "Not Connected",
      detail: "Please connect to CARLA first",
      life: 3000,
    });
    return;
  }

  try {
    const success = await scenarioStore.exportScenario("carla-python");
    if (success) {
      const logEntry = {
        timestamp: new Date(),
        type: "success",
        message: "Scenario exported to CARLA successfully",
      };
      connectionLog.value.unshift(logEntry);

      toast.add({
        severity: "success",
        summary: "Export Complete",
        detail: "Scenario exported to CARLA",
        life: 3000,
      });
    }
  } catch (error) {
    const logEntry = {
      timestamp: new Date(),
      type: "error",
      message: `Export failed: ${error.message}`,
    };
    connectionLog.value.unshift(logEntry);

    toast.add({
      severity: "error",
      summary: "Export Failed",
      detail: "Failed to export scenario",
      life: 3000,
    });
  }
};

const previewExport = () => {
  toast.add({
    severity: "info",
    summary: "Export Preview",
    detail: "Generated export preview",
    life: 2000,
  });
};

const clearLog = () => {
  connectionLog.value = [];
};

const formatLogTime = (timestamp) => {
  return timestamp.toLocaleTimeString();
};

const loadRecentFile = async (file) => {
  try {
    const success = await scenarioStore.loadScenarioFromPath(file.path);
    if (success) {
      toast.add({
        severity: "success",
        summary: "File Loaded",
        detail: `Loaded ${getFileName(file.path)}`,
        life: 3000,
      });
    }
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to load file",
      life: 3000,
    });
  }
};

// Utility functions
const getFileName = (path) => {
  return path ? path.split(/[\\/]/).pop() || "Unknown" : "Unknown";
};

const formatDate = (timestamp) => {
  if (!timestamp) return "Unknown";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 24 * 60 * 60 * 1000) {
    return "Today";
  } else if (diff < 48 * 60 * 60 * 1000) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString();
  }
};

// Initialize on mount
onMounted(async () => {
  // Initialize stores if needed
  await scenarioStore.initialize();
});
</script>

<style scoped>
.carjan-import {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 1rem;
}

.import-header h3 {
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

/* Current Scenario */
.current-scenario {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.scenario-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.scenario-info i {
  font-size: 1.5rem;
  color: #4caf50;
}

.scenario-name {
  color: white;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.scenario-meta {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
}

.scenario-actions {
  display: flex;
  gap: 0.5rem;
}

/* File Operations */
.file-operations {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.file-operations .p-button {
  white-space: nowrap;
}

/* Example Scenarios */
.example-scenarios {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.example-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.example-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.example-item i {
  font-size: 1.5rem;
  color: #ff9800;
}

.example-info {
  flex: 1;
}

.example-name {
  color: white;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.example-description {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
}

/* Recent Files */
.file-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.file-item i {
  font-size: 1.5rem;
  color: #2196f3;
}

.file-info {
  flex: 1;
}

.file-name {
  color: white;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.file-meta {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
}

/* CARLA Integration */
.carla-integration {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.connection-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-weight: 500;
}

.status-connected {
  color: #4caf50;
}

.status-disconnected {
  color: #f44336;
}

.export-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-row label {
  color: white;
  font-size: 0.9rem;
  cursor: pointer;
}

.export-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.connection-log {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 500;
}

.log-content {
  max-height: 120px;
  overflow-y: auto;
  font-size: 0.8rem;
}

.log-empty {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

.log-entry {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.log-time {
  color: rgba(255, 255, 255, 0.6);
  min-width: 60px;
  font-size: 0.75rem;
}

.log-message {
  color: white;
  flex: 1;
}

.log-entry.success .log-message {
  color: #4caf50;
}

.log-entry.error .log-message {
  color: #f44336;
}

.log-entry.info .log-message {
  color: #2196f3;
}

/* PrimeVue overrides */
:deep(.p-card) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-card-title) {
  color: white !important;
  font-size: 1rem !important;
  margin-bottom: 0.75rem !important;
}

:deep(.p-card-content) {
  color: white !important;
  padding: 1rem !important;
}

:deep(.p-button) {
  font-size: 0.8rem !important;
}
</style>
