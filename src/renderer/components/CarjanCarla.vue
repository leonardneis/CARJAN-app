<template>
  <div class="carjan-carla">
    <div class="carla-header">
      <h3>
        <img
          src="../assets/img/carjan_alpha.png"
          class="logo-img"
          alt="CARLA"
          style="width: 24px; height: 24px"
        />
        CARLA Integration
      </h3>
      <p class="subtitle">Export and simulate in CARLA</p>
    </div>

    <Card class="carla-section glass">
      <template #title>Export Settings</template>
      <template #content>
        <div class="export-options">
          <div class="option-group">
            <h4>Simulation Options</h4>
            <div class="checkbox-group">
              <div class="checkbox-item">
                <Checkbox
                  v-model="exportSettings.showGrid"
                  inputId="show-grid"
                />
                <label for="show-grid">Show Grid in CARLA</label>
              </div>
              <div class="checkbox-item">
                <Checkbox
                  v-model="exportSettings.showPaths"
                  inputId="show-paths"
                />
                <label for="show-paths">Show Paths in CARLA</label>
              </div>
              <div class="checkbox-item">
                <Checkbox
                  v-model="exportSettings.loadLayers"
                  inputId="load-layers"
                />
                <label for="load-layers">Load Additional Layers</label>
              </div>
            </div>
          </div>

          <div class="option-group">
            <h4>Export Format</h4>
            <RadioButton
              v-model="exportSettings.format"
              inputId="json"
              value="json"
            />
            <label for="json">JSON</label>
            <RadioButton
              v-model="exportSettings.format"
              inputId="xml"
              value="xml"
            />
            <label for="xml">XML</label>
          </div>
        </div>

        <div class="export-actions">
          <Button
            label="Export to CARLA"
            icon="pi pi-upload"
            @click="exportToCarla"
            severity="success"
          />
          <Button
            label="Preview Export"
            icon="pi pi-eye"
            @click="previewExport"
            severity="info"
          />
        </div>
      </template>
    </Card>

    <Card class="carla-section glass">
      <template #title>Connection Status</template>
      <template #content>
        <div class="connection-info">
          <div class="status-item">
            <i class="pi pi-circle-fill" :class="connectionStatus.class"></i>
            <span>{{ connectionStatus.text }}</span>
          </div>
          <Button
            :label="connected ? 'Disconnect' : 'Connect'"
            :icon="connected ? 'pi pi-times' : 'pi pi-link'"
            @click="toggleConnection"
            size="small"
          />
        </div>
      </template>
    </Card>

    <!-- Warp Overlay for Connection Status Changes -->
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
import { ref, computed, watch } from "vue";
import { useToast } from "primevue/usetoast";
import Card from "primevue/card";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import RadioButton from "primevue/radiobutton";
import WarpOverlay from "./WarpOverlay.vue";

const toast = useToast();

defineEmits(["export-scenario"]);

const connected = ref(false);
const exportSettings = ref({
  showGrid: true,
  showPaths: true,
  loadLayers: false,
  format: "json",
});

// Warp Overlay state
const showWarpOverlay = ref(false);
const warpOverlayType = ref("success");
const warpOverlayTitle = ref("");
const warpOverlayMessage = ref("");

const connectionStatus = computed(() => {
  return connected.value
    ? { text: "Connected to CARLA", class: "status-connected" }
    : { text: "Disconnected", class: "status-disconnected" };
});

// Watch for connection changes to trigger warp overlay
watch(connected, (newValue, oldValue) => {
  // Only trigger if this is an actual change (not initial load)
  if (oldValue !== undefined) {
    showWarpOverlay.value = true;

    if (newValue) {
      warpOverlayType.value = "success";
      warpOverlayTitle.value = "Connected";
      warpOverlayMessage.value = "Successfully connected to CARLA simulation";
    } else {
      warpOverlayType.value = "error";
      warpOverlayTitle.value = "Disconnected";
      warpOverlayMessage.value = "Disconnected from CARLA simulation";
    }
  }
});

const hideWarpOverlay = () => {
  showWarpOverlay.value = false;
};

const toggleConnection = () => {
  connected.value = !connected.value;

  // Toast notification (smaller, less prominent)
  toast.add({
    severity: connected.value ? "success" : "info",
    summary: connected.value ? "CARLA Connected" : "CARLA Disconnected",
    detail: connected.value ? "Ready for simulation" : "Connection closed",
    life: 1500,
  });
};

const exportToCarla = () => {
  toast.add({
    severity: "success",
    summary: "Export Started",
    detail: "Exporting scenario to CARLA...",
    life: 3000,
  });
};

const previewExport = () => {
  toast.add({
    severity: "info",
    summary: "Export Preview",
    detail: "Generated export preview",
    life: 2000,
  });
};
</script>

<style scoped>
.carjan-carla {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 1rem;
}

.carla-header h3 {
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

.export-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.option-group h4 {
  color: white;
  margin-bottom: 0.75rem;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-item label {
  color: white;
  font-size: 0.9rem;
}

.export-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.connection-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.status-connected {
  color: #4caf50;
}

.status-disconnected {
  color: #f44336;
}

:deep(.p-card) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-card-title) {
  color: white !important;
}

:deep(.p-card-content) {
  color: white !important;
}
</style>
