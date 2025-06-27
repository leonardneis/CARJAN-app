<template>
  <div class="settings-view">
    <div class="settings-container">
      <!-- Header -->
      <div class="settings-header">
        <Button
          icon="pi pi-arrow-left"
          @click="goBack"
          text
          class="back-button"
          v-tooltip="'Back to Main Menu'"
        />
        <h1 class="settings-title">Settings</h1>
      </div>

      <!-- Settings Content -->
      <div class="settings-content">
        <Card class="settings-card glass">
          <template #title>
            <div class="card-header">
              <i class="pi pi-cog"></i>
              <span>Application Settings</span>
            </div>
          </template>
          <template #content>
            <div class="settings-sections">
              <!-- Graphics Settings -->
              <div class="settings-section">
                <h3>Graphics</h3>
                <div class="setting-item">
                  <label>Grid Animation Speed</label>
                  <Slider
                    v-model="gridAnimationSpeed"
                    :min="0.1"
                    :max="2"
                    :step="0.1"
                  />
                </div>
                <div class="setting-item">
                  <label>Enable Grid Animations</label>
                  <InputSwitch v-model="enableAnimations" />
                </div>
              </div>

              <!-- Editor Settings -->
              <div class="settings-section">
                <h3>Editor</h3>
                <div class="setting-item">
                  <label>Auto-save Interval (seconds)</label>
                  <InputNumber
                    v-model="autoSaveInterval"
                    :min="10"
                    :max="300"
                    :step="10"
                  />
                </div>
                <div class="setting-item">
                  <label>Show Grid by Default</label>
                  <InputSwitch v-model="showGridDefault" />
                </div>
              </div>

              <!-- CARLA Settings -->
              <div class="settings-section">
                <h3>CARLA Integration</h3>
                <div class="setting-item">
                  <label>CARLA Server Host</label>
                  <InputText v-model="carlaHost" placeholder="localhost" />
                </div>
                <div class="setting-item">
                  <label>CARLA Server Port</label>
                  <InputNumber v-model="carlaPort" :min="1" :max="65535" />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Action Buttons -->
      <div class="settings-actions">
        <Button
          label="Reset to Defaults"
          @click="resetToDefaults"
          severity="secondary"
          outlined
          class="action-button"
        />
        <Button
          label="Save Settings"
          @click="saveSettings"
          class="action-button save-button"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import Card from "primevue/card";
import Slider from "primevue/slider";
import InputSwitch from "primevue/inputswitch";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";

const router = useRouter();
const toast = useToast();

// Settings state
const gridAnimationSpeed = ref(1.0);
const enableAnimations = ref(true);
const autoSaveInterval = ref(30);
const showGridDefault = ref(true);
const carlaHost = ref("localhost");
const carlaPort = ref(2000);

const loadSettings = () => {
  try {
    const saved = localStorage.getItem("carjan-settings");
    if (saved) {
      const settings = JSON.parse(saved);
      gridAnimationSpeed.value = settings.gridAnimationSpeed || 1.0;
      enableAnimations.value = settings.enableAnimations !== false;
      autoSaveInterval.value = settings.autoSaveInterval || 30;
      showGridDefault.value = settings.showGridDefault !== false;
      carlaHost.value = settings.carlaHost || "localhost";
      carlaPort.value = settings.carlaPort || 2000;
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
};

const saveSettings = () => {
  try {
    const settings = {
      gridAnimationSpeed: gridAnimationSpeed.value,
      enableAnimations: enableAnimations.value,
      autoSaveInterval: autoSaveInterval.value,
      showGridDefault: showGridDefault.value,
      carlaHost: carlaHost.value,
      carlaPort: carlaPort.value,
    };

    localStorage.setItem("carjan-settings", JSON.stringify(settings));

    toast.add({
      severity: "success",
      summary: "Settings Saved",
      detail: "Your settings have been saved successfully",
      life: 3000,
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    toast.add({
      severity: "error",
      summary: "Save Failed",
      detail: "Failed to save settings",
      life: 3000,
    });
  }
};

const resetToDefaults = () => {
  gridAnimationSpeed.value = 1.0;
  enableAnimations.value = true;
  autoSaveInterval.value = 30;
  showGridDefault.value = true;
  carlaHost.value = "localhost";
  carlaPort.value = 2000;

  toast.add({
    severity: "info",
    summary: "Settings Reset",
    detail: "Settings have been reset to defaults",
    life: 3000,
  });
};

const goBack = () => {
  router.push("/main-menu");
};

onMounted(() => {
  loadSettings();
});
</script>

<style scoped>
.settings-view {
  min-height: 100vh;
  background: radial-gradient(circle at 40% 40%, #2c2f35 0%, #141619 100%);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-container {
  width: 100%;
  max-width: 800px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(20px);
}

.settings-header {
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

.settings-title {
  color: white;
  font-size: 2rem;
  margin: 0;
  font-weight: 300;
}

.settings-content {
  margin-bottom: 2rem;
}

.glass {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: white;
  font-size: 1.25rem;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
}

.settings-section h3 {
  color: white;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 500;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  flex: 1;
}

.setting-item .p-slider {
  flex: 1;
  max-width: 200px;
}

.setting-item .p-inputnumber,
.setting-item .p-inputtext {
  max-width: 200px;
}

.settings-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.action-button {
  height: 48px;
  font-size: 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  min-width: 140px;
}

.save-button {
  background: linear-gradient(145deg, #28a745, #1e7e34) !important;
  border: 2px solid #1e7e34 !important;
  color: white !important;
}

.save-button:hover {
  background: linear-gradient(145deg, #34ce57, #28a745) !important;
  transform: translateY(-2px);
}

/* Custom Input Styles */
:deep(.p-slider .p-slider-range) {
  background: linear-gradient(145deg, #4a90e2, #357abd);
}

:deep(.p-slider .p-slider-handle) {
  background: white;
  border: 2px solid #4a90e2;
}

:deep(.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider) {
  background: linear-gradient(145deg, #4a90e2, #357abd);
}

:deep(.p-inputnumber-input),
:deep(.p-inputtext) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
}

:deep(.p-inputnumber-input:focus),
:deep(.p-inputtext:focus) {
  border-color: #4a90e2 !important;
  box-shadow: 0 0 10px rgba(74, 144, 226, 0.3) !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .settings-container {
    padding: 1rem;
  }

  .setting-item {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .settings-actions {
    flex-direction: column;
  }
}
</style>
