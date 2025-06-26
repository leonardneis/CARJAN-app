<template>
  <div class="live-streaming-panel">
    <div class="streaming-header">
      <div class="status-indicator">
        <i :class="statusIcon" :style="{ color: statusColor }"></i>
        <span class="status-text">{{ statusText }}</span>
      </div>

      <div class="streaming-controls">
        <Button
          v-if="!scenarioStore.liveStreaming.enabled"
          icon="pi pi-play"
          label="Connect"
          @click="connectToCarla"
          class="p-button-sm p-button-success"
          :loading="connecting"
        />

        <Button
          v-else
          icon="pi pi-stop"
          label="Disconnect"
          @click="disconnectFromCarla"
          class="p-button-sm p-button-danger"
        />
      </div>
    </div>

    <!-- Connection Settings -->
    <div
      v-if="!scenarioStore.liveStreaming.enabled"
      class="connection-settings"
    >
      <div class="field">
        <label for="carla-endpoint">CARLA Endpoint</label>
        <InputText
          id="carla-endpoint"
          v-model="carlaEndpoint"
          placeholder="ws://localhost:8765"
          class="w-full"
        />
      </div>

      <div class="field">
        <Checkbox id="auto-sync" v-model="autoSync" binary />
        <label for="auto-sync" class="ml-2">Auto-sync changes</label>
      </div>
    </div>

    <!-- Live Stats (when connected) -->
    <div v-if="scenarioStore.liveStreaming.connected" class="live-stats">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Messages Sent</span>
          <span class="stat-value">{{ messagesSent }}</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">Messages Received</span>
          <span class="stat-value">{{ messagesReceived }}</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">Latency</span>
          <span class="stat-value">{{ latency }}ms</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">Sync Status</span>
          <Badge
            :value="syncStatus"
            :severity="syncStatus === 'Synced' ? 'success' : 'warning'"
          />
        </div>
      </div>

      <!-- Simulation Controls -->
      <div class="simulation-controls">
        <h4>Simulation Control</h4>
        <div class="control-buttons">
          <Button
            icon="pi pi-play"
            label="Play"
            @click="controlSimulation('play')"
            class="p-button-sm"
            :disabled="simulationState === 'playing'"
          />

          <Button
            icon="pi pi-pause"
            label="Pause"
            @click="controlSimulation('pause')"
            class="p-button-sm"
            :disabled="simulationState === 'paused'"
          />

          <Button
            icon="pi pi-stop"
            label="Stop"
            @click="controlSimulation('stop')"
            class="p-button-sm"
            :disabled="simulationState === 'stopped'"
          />

          <Button
            icon="pi pi-refresh"
            label="Reset"
            @click="controlSimulation('reset')"
            class="p-button-sm"
          />
        </div>

        <div class="simulation-info">
          <span
            >State: <strong>{{ simulationState }}</strong></span
          >
          <span
            >FPS: <strong>{{ simulationFPS }}</strong></span
          >
        </div>
      </div>

      <!-- Manual Sync Controls -->
      <div class="manual-sync">
        <h4>Manual Sync</h4>
        <div class="sync-buttons">
          <Button
            icon="pi pi-upload"
            label="Send Scenario"
            @click="sendCompleteScenario"
            class="p-button-sm"
          />

          <Button
            icon="pi pi-download"
            label="Request State"
            @click="requestSimulationState"
            class="p-button-sm"
          />
        </div>
      </div>
    </div>

    <!-- Connection Log -->
    <div class="connection-log">
      <h4>Connection Log</h4>
      <div class="log-container">
        <div
          v-for="(entry, index) in connectionLog"
          :key="index"
          :class="['log-entry', `log-${entry.type}`]"
        >
          <span class="log-time">{{ formatTime(entry.timestamp) }}</span>
          <span class="log-message">{{ entry.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useScenarioStore } from "../store/scenario";
import { useToast } from "primevue/usetoast";

import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Checkbox from "primevue/checkbox";
import Badge from "primevue/badge";

const scenarioStore = useScenarioStore();
const toast = useToast();

// Refs
const connecting = ref(false);
const carlaEndpoint = ref("ws://localhost:8765");
const autoSync = ref(true);

// Live stats
const messagesSent = ref(0);
const messagesReceived = ref(0);
const latency = ref(0);
const syncStatus = ref("Not synced");
const simulationState = ref("stopped");
const simulationFPS = ref(0);

// Connection log
const connectionLog = ref([]);
const maxLogEntries = 50;

// Computed
const statusIcon = computed(() => {
  if (scenarioStore.liveStreaming.connected) return "pi pi-circle-fill";
  if (scenarioStore.liveStreaming.enabled) return "pi pi-circle-fill";
  return "pi pi-circle";
});

const statusColor = computed(() => {
  if (scenarioStore.liveStreaming.connected) return "#4CAF50"; // Green
  if (scenarioStore.liveStreaming.enabled) return "#FF9800"; // Orange
  return "#9E9E9E"; // Gray
});

const statusText = computed(() => {
  if (scenarioStore.liveStreaming.connected) return "Connected to CARLA";
  if (scenarioStore.liveStreaming.enabled) return "Connecting...";
  return "Disconnected";
});

// Methods
const connectToCarla = async () => {
  connecting.value = true;

  try {
    await scenarioStore.enableLiveStreaming(carlaEndpoint.value);

    addLogEntry("info", `Connected to CARLA at ${carlaEndpoint.value}`);

    toast.add({
      severity: "success",
      summary: "CARLA Connected",
      detail: "Successfully connected to CARLA simulation",
      life: 3000,
    });

    setupLiveStreamingListeners();
  } catch (error) {
    addLogEntry("error", `Connection failed: ${error.message}`);

    toast.add({
      severity: "error",
      summary: "Connection Failed",
      detail: error.message,
      life: 5000,
    });
  } finally {
    connecting.value = false;
  }
};

const disconnectFromCarla = async () => {
  try {
    await scenarioStore.disableLiveStreaming();

    addLogEntry("info", "Disconnected from CARLA");

    toast.add({
      severity: "info",
      summary: "CARLA Disconnected",
      detail: "Disconnected from CARLA simulation",
      life: 2000,
    });

    // Reset stats
    messagesSent.value = 0;
    messagesReceived.value = 0;
    latency.value = 0;
    syncStatus.value = "Not synced";
    simulationState.value = "stopped";
    simulationFPS.value = 0;
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Disconnect Error",
      detail: error.message,
      life: 5000,
    });
  }
};

const setupLiveStreamingListeners = async () => {
  const { liveStreaming } = await import("../services/liveStreaming.js");

  liveStreaming.on("connected", () => {
    addLogEntry("success", "WebSocket connection established");
    syncStatus.value = "Synced";
  });

  liveStreaming.on("disconnected", (data) => {
    addLogEntry(
      "warning",
      `Connection lost: ${data.reason || "Unknown reason"}`
    );
    syncStatus.value = "Disconnected";
  });

  liveStreaming.on("simulation_state", (data) => {
    messagesReceived.value++;
    simulationState.value = data.state || "unknown";
    simulationFPS.value = data.fps || 0;
    addLogEntry("info", `Simulation state: ${data.state}`);
  });

  liveStreaming.on("scenario_loaded", () => {
    messagesReceived.value++;
    addLogEntry("success", "Scenario loaded in CARLA");
    syncStatus.value = "Synced";
  });

  liveStreaming.on("entity_spawned", (data) => {
    messagesReceived.value++;
    addLogEntry("info", `Entity spawned: ${data.type}`);
  });

  liveStreaming.on("carla_error", (error) => {
    messagesReceived.value++;
    addLogEntry("error", `CARLA error: ${error.message}`);
  });
};

const controlSimulation = async (action) => {
  const { liveStreaming } = await import("../services/liveStreaming.js");

  liveStreaming.controlSimulation(action);
  messagesSent.value++;

  addLogEntry("info", `Simulation command: ${action}`);

  // Update local state optimistically
  if (action === "play") simulationState.value = "playing";
  else if (action === "pause") simulationState.value = "paused";
  else if (action === "stop") simulationState.value = "stopped";
};

const sendCompleteScenario = async () => {
  const { liveStreaming } = await import("../services/liveStreaming.js");

  const scenarioData = scenarioStore.buildScenarioData();
  liveStreaming.sendCompleteScenario(scenarioData);
  messagesSent.value++;

  addLogEntry("info", "Complete scenario sent to CARLA");

  toast.add({
    severity: "info",
    summary: "Scenario Sent",
    detail: "Complete scenario data sent to CARLA",
    life: 2000,
  });
};

const requestSimulationState = async () => {
  const { liveStreaming } = await import("../services/liveStreaming.js");

  liveStreaming.requestSimulationState();
  messagesSent.value++;

  addLogEntry("info", "Requested simulation state from CARLA");
};

const addLogEntry = (type, message) => {
  connectionLog.value.unshift({
    type,
    message,
    timestamp: new Date(),
  });

  // Limit log size
  if (connectionLog.value.length > maxLogEntries) {
    connectionLog.value = connectionLog.value.slice(0, maxLogEntries);
  }
};

const formatTime = (timestamp) => {
  return timestamp.toLocaleTimeString();
};

// Lifecycle
onMounted(() => {
  addLogEntry("info", "Live streaming panel initialized");
});
</script>

<style scoped>
.live-streaming-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  border: 1px solid var(--surface-border);
}

.streaming-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-text {
  font-weight: 600;
}

.connection-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  color: var(--text-color);
}

.live-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.simulation-controls h4,
.manual-sync h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.control-buttons,
.sync-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.simulation-info {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.connection-log h4 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  padding: 0.5rem;
}

.log-entry {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  padding: 0.25rem;
  border-radius: 4px;
}

.log-time {
  color: var(--text-color-secondary);
  min-width: 80px;
}

.log-message {
  flex: 1;
}

.log-info {
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.log-success {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.log-warning {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.log-error {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

@media (max-width: 768px) {
  .streaming-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .control-buttons,
  .sync-buttons {
    gap: 0.25rem;
  }

  .simulation-info {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
