<template>
  <div class="scenario-selection">
    <div class="selection-container">
      <!-- Header -->
      <div class="selection-header">
        <Button
          icon="pi pi-arrow-left"
          @click="goBack"
          text
          class="back-button"
          v-tooltip="'Back to Main Menu'"
        />
        <h1 class="selection-title">Select Scenario</h1>
      </div>

      <!-- Scenario List -->
      <div class="scenario-list-container">
        <div v-if="scenarios.length === 0" class="no-scenarios">
          <div class="empty-icon">
            <i class="pi pi-inbox"></i>
          </div>
          <h3>No scenarios available</h3>
          <p>Create a new scenario to get started!</p>
        </div>

        <div v-else class="scenario-list">
          <div
            v-for="scenario in scenarios"
            :key="scenario.id"
            class="scenario-item"
            :class="{ selected: selectedScenario?.id === scenario.id }"
            @click="selectScenario(scenario)"
          >
            <!-- Scenario Thumbnail -->
            <div class="scenario-thumbnail">
              <div class="thumbnail-image">
                <i class="pi pi-map"></i>
              </div>
            </div>

            <!-- Scenario Info -->
            <div class="scenario-info">
              <div class="scenario-name">{{ scenario.name }}</div>
              <div class="scenario-details">
                <div class="detail-line">
                  <span class="detail-label">Map:</span>
                  <span class="detail-value">{{ scenario.mapName }}</span>
                </div>
                <div class="detail-line">
                  <span class="detail-label">Last access:</span>
                  <span class="detail-value">{{
                    formatDate(scenario.lastModified)
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="scenario-actions">
              <i
                class="pi pi-pencil action-icon edit-icon"
                @click.stop="editScenario(scenario)"
                v-tooltip="'Edit'"
              ></i>
              <i
                class="pi pi-trash action-icon delete-icon"
                @click.stop="deleteScenario(scenario)"
                v-tooltip="'Delete'"
              ></i>
              <i
                class="pi pi-copy action-icon duplicate-icon"
                @click.stop="duplicateScenario(scenario)"
                v-tooltip="'Duplicate'"
              ></i>
            </div>

            <!-- Selection Indicator -->
            <div
              v-if="selectedScenario?.id === scenario.id"
              class="selection-indicator"
            >
              <i class="pi pi-check"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <Button
          label="Load Scenario"
          @click="playSelectedWorld"
          :disabled="!selectedScenario"
          class="action-button load-button"
          size="large"
        />
        <Button
          label="Create New Scenario"
          @click="createNewWorld"
          class="action-button create-button"
          size="large"
        />
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog
      v-model:visible="showDeleteDialog"
      :modal="true"
      header="Delete World"
      class="delete-dialog"
    >
      <div class="delete-content">
        <div class="warning-icon">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <div class="warning-text">
          <p>
            <strong>'{{ selectedScenario?.name }}'</strong> will be deleted
            forever! (A very long time!)
          </p>
          <p>Are you sure?</p>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          @click="showDeleteDialog = false"
          text
          class="dialog-button"
        />
        <Button
          label="Delete"
          @click="confirmDelete"
          severity="danger"
          class="dialog-button"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";
import Dialog from "primevue/dialog";

const router = useRouter();
const toast = useToast();

// State
const scenarios = ref([]);
const selectedScenario = ref(null);
const showDeleteDialog = ref(false);

// Load scenarios from localStorage
const loadScenarios = () => {
  try {
    const saved = localStorage.getItem("carjan-scenarios");
    if (saved) {
      scenarios.value = JSON.parse(saved);
    }

    // Add some sample scenarios if none exist
    if (scenarios.value.length === 0) {
      scenarios.value = [
        {
          id: "demo_1",
          name: "Highway Demo",
          mapName: "Highway Straight",
          lastModified: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          entityCount: 5,
          pathCount: 2,
          waypointCount: 8,
        },
        {
          id: "demo_2",
          name: "Urban Traffic",
          mapName: "Urban Intersection",
          lastModified: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          entityCount: 12,
          pathCount: 4,
          waypointCount: 15,
        },
      ];
      saveScenarios();
    }
  } catch (error) {
    console.error("Error loading scenarios:", error);
    scenarios.value = [];
  }
};

const saveScenarios = () => {
  localStorage.setItem("carjan-scenarios", JSON.stringify(scenarios.value));
};

const selectScenario = (scenario) => {
  selectedScenario.value = scenario;
};

const playSelectedWorld = () => {
  if (!selectedScenario.value) return;

  toast.add({
    severity: "info",
    summary: "Loading World",
    detail: `Loading ${selectedScenario.value.name}...`,
    life: 2000,
  });

  // Navigate to editor with selected scenario
  router.push({
    name: "CarjanEditor",
    query: { loadScenario: selectedScenario.value.id },
  });
};

const createNewWorld = () => {
  router.push("/scenarios");
};

const confirmDelete = () => {
  if (!selectedScenario.value) return;

  const index = scenarios.value.findIndex(
    (s) => s.id === selectedScenario.value.id
  );
  if (index !== -1) {
    scenarios.value.splice(index, 1);
    saveScenarios();

    toast.add({
      severity: "success",
      summary: "World Deleted",
      detail: `${selectedScenario.value.name} has been deleted forever!`,
      life: 3000,
    });

    selectedScenario.value = null;
  }

  showDeleteDialog.value = false;
};

const goBack = () => {
  router.push("/");
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const editScenario = (scenario) => {
  selectedScenario.value = scenario;
  playSelectedWorld();
};

const deleteScenario = (scenario) => {
  selectedScenario.value = scenario;
  showDeleteDialog.value = true;
};

const duplicateScenario = (scenario) => {
  const newScenario = {
    ...scenario,
    id: `${scenario.id}_copy_${Date.now()}`,
    name: `${scenario.name} (Copy)`,
    lastModified: new Date().toISOString(),
  };

  scenarios.value.push(newScenario);
  saveScenarios();

  toast.add({
    severity: "success",
    summary: "Scenario Duplicated",
    detail: `${scenario.name} has been duplicated`,
    life: 3000,
  });
};

onMounted(() => {
  loadScenarios();
});
</script>

<style scoped>
.scenario-selection {
  min-height: 100vh;
  background: radial-gradient(circle at 40% 40%, #2c2f35 0%, #141619 100%);
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selection-container {
  width: 100%;
  max-width: 1000px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(20px);
}

.selection-header {
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

.selection-title {
  color: white;
  font-size: 2rem;
  margin: 0;
  font-weight: 300;
}

.scenario-list-container {
  height: 400px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 2rem;
  overflow-y: auto;
}

.no-scenarios {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.scenario-list {
  padding: 1rem;
}

.scenario-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  margin-bottom: 0.5rem;
  position: relative;
}

.scenario-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.scenario-item.selected {
  background: rgba(74, 144, 226, 0.2);
  border-color: #4a90e2;
  box-shadow: 0 0 15px rgba(74, 144, 226, 0.3);
}

.scenario-thumbnail {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.thumbnail-image {
  color: rgba(255, 255, 255, 0.6);
  font-size: 2rem;
}

.scenario-info {
  flex: 1;
  min-width: 0;
}

.scenario-name {
  color: white;
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.scenario-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-line {
  display: flex;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.detail-label {
  color: rgba(255, 255, 255, 0.6);
  min-width: 80px;
}

.detail-value {
  color: rgba(255, 255, 255, 0.8);
}

.selection-indicator {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  color: #4a90e2;
  font-size: 1.2rem;
}

.action-buttons {
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.action-button {
  height: 48px;
  font-size: 1rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  min-width: 200px;
}

.load-button {
  background: linear-gradient(145deg, #4a90e2, #357abd) !important;
  border: 2px solid #357abd !important;
  color: white !important;
}

.load-button:hover:not(:disabled) {
  background: linear-gradient(145deg, #5ba0f2, #4a8acd) !important;
  transform: translateY(-2px);
}

.create-button {
  background: linear-gradient(145deg, #28a745, #1e7e34) !important;
  border: 2px solid #1e7e34 !important;
  color: white !important;
}

.create-button:hover {
  background: linear-gradient(145deg, #34ce57, #28a745) !important;
  transform: translateY(-2px);
}

.action-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Delete Dialog Styles */
.delete-dialog {
  background: rgba(0, 0, 0, 0.8) !important;
}

.delete-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.warning-icon {
  color: #ffc107;
  font-size: 3rem;
}

.warning-text {
  flex: 1;
}

.warning-text p {
  margin: 0.5rem 0;
  color: white;
}

.dialog-button {
  margin: 0 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    gap: 1rem;
  }

  .action-button {
    min-width: auto;
  }

  .selection-container {
    padding: 1rem;
  }

  .scenario-item {
    flex-direction: column;
    text-align: center;
  }

  .scenario-actions {
    flex-direction: row;
    min-width: auto;
  }
}

/* Custom Scrollbar */
.scenario-list-container::-webkit-scrollbar {
  width: 8px;
}

.scenario-list-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.scenario-list-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

.scenario-list-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.scenario-actions {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  align-items: center;
  min-width: 100px;
  justify-content: flex-end;
}

.action-icon {
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.action-icon:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.edit-icon {
  color: #28a745 !important;
}

.edit-icon:hover {
  background: rgba(40, 167, 69, 0.2) !important;
  border-color: #28a745 !important;
}

.delete-icon {
  color: #dc3545 !important;
}

.delete-icon:hover {
  background: rgba(220, 53, 69, 0.2) !important;
  border-color: #dc3545 !important;
}

.duplicate-icon {
  color: #007bff !important;
}

.duplicate-icon:hover {
  background: rgba(0, 123, 255, 0.2) !important;
  border-color: #007bff !important;
}
</style>
