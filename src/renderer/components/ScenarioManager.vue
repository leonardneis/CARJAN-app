<template>
  <div class="scenario-manager">
    <!-- Navigation Header -->
    <div class="scenario-nav">
      <Button
        icon="pi pi-arrow-left"
        @click="goBack"
        text
        class="back-btn"
        v-tooltip="'Back to World Selection'"
      />
      <div class="nav-title">
        <i class="pi pi-plus"></i>
        Create New World
      </div>
    </div>

    <div class="scenario-header">
      <h1 class="title">Create New World</h1>
      <p class="subtitle">Choose a map template for your new world</p>
    </div>

    <div class="scenario-content">
      <!-- New Scenario Section -->
      <Card class="new-scenario-section glass">
        <template #title>
          <div class="section-header">
            <i class="pi pi-plus-circle"></i>
            Create New Scenario
          </div>
        </template>
        <template #content>
          <div class="scenario-creation">
            <!-- Map Selection Grid -->
            <div class="map-selection">
              <h3>Choose a Map Template</h3>
              <div class="category-filter">
                <Button
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :class="{
                    'p-button-success': selectedCategory === category.id,
                  }"
                  @click="selectCategory(category.id)"
                  size="small"
                  outlined
                  class="category-btn"
                />
                <Button
                  label="All"
                  :class="{ 'p-button-success': selectedCategory === null }"
                  @click="selectCategory(null)"
                  size="small"
                  outlined
                  class="category-btn"
                />
              </div>

              <div class="maps-grid">
                <div
                  v-for="map in filteredMaps"
                  :key="map.id"
                  class="map-template-card"
                  @click="selectMapTemplate(map)"
                  :class="{
                    active: selectedMapId === map.id,
                    loading: loadingPreview === map.id,
                  }"
                >
                  <div class="map-preview-container">
                    <div
                      v-if="loadingPreview === map.id"
                      class="loading-overlay"
                    >
                      <ProgressSpinner size="small" />
                    </div>
                    <div class="map-grid-preview">
                      <div
                        v-for="(row, rowIndex) in getMapPreview(map)"
                        :key="rowIndex"
                        class="preview-row"
                      >
                        <div
                          v-for="(cell, colIndex) in row"
                          :key="colIndex"
                          class="preview-cell"
                          :class="getCellPreviewClass(cell)"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div class="map-info">
                    <div class="map-name">{{ map.name }}</div>
                    <div class="map-meta">
                      <Badge
                        :value="map.difficulty"
                        :severity="getDifficultySeverity(map.difficulty)"
                      />
                      <span class="map-size">{{ getMapDimensions(map) }}</span>
                    </div>
                    <div class="map-description">{{ map.description }}</div>
                  </div>

                  <div
                    v-if="selectedMapId === map.id"
                    class="selected-indicator"
                  >
                    <i class="pi pi-check"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selected Map Preview -->
            <div v-if="selectedMapData" class="selected-map-preview">
              <h3>Preview: {{ selectedMapData.name }}</h3>
              <div class="large-preview">
                <div class="preview-grid">
                  <div
                    v-for="(row, rowIndex) in selectedMapData.mapData"
                    :key="rowIndex"
                    class="preview-row-large"
                  >
                    <div
                      v-for="(cell, colIndex) in row"
                      :key="colIndex"
                      class="preview-cell-large"
                      :class="getCellPreviewClass(cell)"
                    ></div>
                  </div>
                </div>
                <div class="preview-info">
                  <div class="info-item">
                    <label>Dimensions:</label>
                    <span
                      >{{ selectedMapData.size?.rows || 12 }}×{{
                        selectedMapData.size?.cols || 8
                      }}</span
                    >
                  </div>
                  <div class="info-item">
                    <label>Category:</label>
                    <span>{{ selectedMapData.category }}</span>
                  </div>
                  <div class="info-item">
                    <label>Difficulty:</label>
                    <Badge
                      :value="selectedMapData.difficulty"
                      :severity="
                        getDifficultySeverity(selectedMapData.difficulty)
                      "
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Create Button -->
            <div class="create-section">
              <Button
                label="Create New World"
                icon="pi pi-plus"
                @click="createNewScenario"
                :disabled="!selectedMapId"
                :loading="creatingScenario"
                size="large"
                class="create-btn"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Confirmation Dialog -->
    <Dialog
      v-model:visible="showConfirmDialog"
      :modal="true"
      header="Replace Current Work?"
      class="confirm-dialog"
    >
      <div class="confirmation-content">
        <div class="warning-icon">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <div class="warning-text">
          <p>Creating a new world will replace your current work.</p>
          <p>
            <strong>All entities, paths, and waypoints will be lost.</strong>
          </p>
          <p>Are you sure you want to continue?</p>
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          @click="showConfirmDialog = false"
          text
          severity="secondary"
        />
        <Button
          label="Create New World"
          @click="confirmCreateScenario"
          severity="danger"
          icon="pi pi-check"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { useGridStore } from "../store/grid";
import MapService from "../services/MapService";
import Card from "primevue/card";
import Button from "primevue/button";
import Badge from "primevue/badge";
import ProgressSpinner from "primevue/progressspinner";
import Dialog from "primevue/dialog";

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const gridStore = useGridStore();

// State
const loading = ref(true);
const availableMaps = ref([]);
const categories = ref([]);
const selectedCategory = ref(null);
const selectedMapId = ref(null);
const selectedMapData = ref(null);
const loadingPreview = ref(null);
const creatingScenario = ref(false);
const showConfirmDialog = ref(false);
const mapPreviews = ref({});
const existingScenarios = ref([]);

// Load maps and scenarios
const loadData = async () => {
  try {
    // Load available maps
    const mapsData = await MapService.loadMapsIndex();
    availableMaps.value = mapsData.maps;
    categories.value = mapsData.categories;

    // Load previews for each map
    for (const map of mapsData.maps) {
      await loadMapPreview(map);
    }

    // Load existing scenarios from localStorage
    loadExistingScenarios();
  } catch (error) {
    console.error("Error loading data:", error);
    toast.add({
      severity: "error",
      summary: "Loading Error",
      detail: "Failed to load maps and scenarios",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// Load map preview data
const loadMapPreview = async (map) => {
  try {
    loadingPreview.value = map.id;
    const mapData = await MapService.loadMap(map.file);
    mapPreviews.value[map.id] = MapService.generateMapPreview(
      mapData.mapData,
      8,
      6
    );
  } catch (error) {
    console.error(`Error loading preview for ${map.id}:`, error);
    mapPreviews.value[map.id] = Array(6)
      .fill()
      .map(() => Array(4).fill("v"));
  } finally {
    loadingPreview.value = null;
  }
};

// Load existing scenarios from localStorage
const loadExistingScenarios = () => {
  const stored = localStorage.getItem("carjan-scenarios");
  if (stored) {
    try {
      existingScenarios.value = JSON.parse(stored);
    } catch (error) {
      console.error("Error loading scenarios:", error);
      existingScenarios.value = [];
    }
  }
};

// Save scenarios to localStorage
const saveScenarios = () => {
  localStorage.setItem(
    "carjan-scenarios",
    JSON.stringify(existingScenarios.value)
  );
};

// Filtered maps based on category
const filteredMaps = computed(() => {
  if (!selectedCategory.value) return availableMaps.value;
  return availableMaps.value.filter(
    (map) => map.category.toLowerCase() === selectedCategory.value
  );
});

const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId;
};

const selectMapTemplate = async (map) => {
  selectedMapId.value = map.id;

  try {
    // Load full map data for preview
    const mapData = await MapService.loadMap(map.file);
    selectedMapData.value = mapData;

    toast.add({
      severity: "info",
      summary: "Map Selected",
      detail: `Selected ${map.name}`,
      life: 2000,
    });
  } catch (error) {
    console.error("Error loading map data:", error);
    toast.add({
      severity: "error",
      summary: "Loading Error",
      detail: `Failed to load ${map.name}`,
      life: 3000,
    });
  }
};

const createNewScenario = () => {
  if (!selectedMapId.value) return;

  // Check if there's existing work
  const hasWork =
    gridStore.entities.length > 0 ||
    gridStore.paths.length > 0 ||
    gridStore.waypoints.length > 0;

  if (hasWork) {
    showConfirmDialog.value = true;
  } else {
    confirmCreateScenario();
  }
};

const confirmCreateScenario = async () => {
  showConfirmDialog.value = false;
  creatingScenario.value = true;

  try {
    // Load the selected map
    const selectedMap = availableMaps.value.find(
      (m) => m.id === selectedMapId.value
    );
    const mapData = await MapService.loadMap(selectedMap.file);

    // Clear existing data and load new map
    gridStore.entities.length = 0;
    gridStore.paths.length = 0;
    gridStore.waypoints.length = 0;
    gridStore.dboxes.length = 0;

    // Load map data with animation
    gridStore.loadMapFromData(mapData);

    // Create new scenario entry
    const newScenario = {
      id: `scenario_${Date.now()}`,
      name: `New Scenario - ${selectedMap.name}`,
      mapName: selectedMap.name,
      mapId: selectedMap.id,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      entityCount: 0,
      pathCount: 0,
      waypointCount: 0,
    };

    // Set current scenario
    gridStore.scenarioName = newScenario.name;

    toast.add({
      severity: "success",
      summary: "Scenario Created",
      detail: `New scenario with ${selectedMap.name} created`,
      life: 3000,
    });

    // Navigate to editor
    router.push("/carjan");
  } catch (error) {
    console.error("Error creating scenario:", error);
    toast.add({
      severity: "error",
      summary: "Creation Error",
      detail: "Failed to create new scenario",
      life: 3000,
    });
  } finally {
    creatingScenario.value = false;
  }
};

const loadScenario = (scenario) => {
  // TODO: Implement scenario loading
  toast.add({
    severity: "info",
    summary: "Loading Scenario",
    detail: `Loading ${scenario.name}...`,
    life: 2000,
  });

  router.push("/carjan");
};

const editScenario = (scenario) => {
  loadScenario(scenario);
};

const deleteScenario = (scenario) => {
  confirm.require({
    message: `Are you sure you want to delete "${scenario.name}"? This action cannot be undone.`,
    header: "Delete Scenario",
    icon: "pi pi-exclamation-triangle",
    accept: () => {
      const index = existingScenarios.value.findIndex(
        (s) => s.id === scenario.id
      );
      if (index !== -1) {
        existingScenarios.value.splice(index, 1);
        saveScenarios();

        toast.add({
          severity: "success",
          summary: "Scenario Deleted",
          detail: `${scenario.name} has been deleted`,
          life: 3000,
        });
      }
    },
  });
};

// Navigation
const goBack = () => {
  router.push("/scenario-selection");
};

// Helper functions
const getMapPreview = (map) => {
  return mapPreviews.value[map.id] || [];
};

const getCellPreviewClass = (cellType) => {
  const classMap = {
    v: "preview-void",
    r: "preview-road",
    p: "preview-path",
  };
  return classMap[cellType] || "preview-void";
};

const getDifficultySeverity = (difficulty) => {
  const severityMap = {
    Easy: "success",
    Medium: "warning",
    Hard: "danger",
  };
  return severityMap[difficulty] || "info";
};

const getMapDimensions = (map) => {
  const preview = mapPreviews.value[map.id];
  if (preview && preview.length > 0) {
    return `${preview.length}×${preview[0]?.length || 0}`;
  }
  return "12×8";
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

// Lifecycle
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.scenario-manager {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 0;
}

.scenario-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}

.back-btn {
  color: rgba(255, 255, 255, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

.back-btn:hover {
  color: white !important;
  background: rgba(255, 255, 255, 0.2) !important;
}

.nav-title {
  color: white;
  font-size: 1.2rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.scenario-header {
  text-align: center;
  margin: 3rem 0;
  padding: 0 2rem;
}

.title {
  color: white;
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-weight: 300;
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  margin: 0;
}

.scenario-content {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  padding: 0 2rem 2rem 2rem;
}

.glass {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.scenario-creation {
  display: grid;
  gap: 2rem;
}

.map-selection h3 {
  color: white;
  margin-bottom: 1rem;
}

.category-filter {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.maps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.map-template-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.map-template-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.map-template-card.active {
  background: rgba(33, 150, 243, 0.2);
  border-color: #2196f3;
  box-shadow: 0 0 30px rgba(33, 150, 243, 0.4);
}

.map-preview-container {
  width: 100%;
  height: 120px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.map-grid-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px;
}

.preview-row {
  display: flex;
  gap: 1px;
  flex: 1;
}

.preview-cell {
  flex: 1;
  border-radius: 1px;
}

.preview-void {
  background: #2d2d2d;
}

.preview-road {
  background: #a8e6cf;
}

.preview-path {
  background: #b8d8f0;
}

.map-info {
  color: white;
}

.map-name {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.map-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.map-size {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.map-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  line-height: 1.4;
}

.selected-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  background: #4caf50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

.selected-map-preview {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
}

.selected-map-preview h3 {
  color: white;
  margin-bottom: 1rem;
}

.large-preview {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  align-items: start;
}

.preview-grid {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  display: inline-block;
}

.preview-row-large {
  display: flex;
  gap: 2px;
}

.preview-cell-large {
  width: 12px;
  height: 12px;
  border-radius: 1px;
}

.preview-info {
  min-width: 200px;
}

.info-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item label {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 600;
}

.info-item span {
  color: white;
}

.create-section {
  display: flex;
  justify-content: center;
}

.create-btn {
  background: linear-gradient(45deg, #2196f3, #21cbf3) !important;
  border: none !important;
  padding: 1rem 2rem !important;
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 20px rgba(33, 150, 243, 0.4);
  transition: all 0.3s ease;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(33, 150, 243, 0.5);
}

.no-scenarios {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
}

.no-scenarios i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-scenarios h3 {
  color: white;
  margin-bottom: 0.5rem;
}

.scenarios-list {
  display: grid;
  gap: 1rem;
}

.scenario-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.scenario-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.scenario-thumbnail {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
}

.scenario-details {
  color: white;
}

.scenario-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.scenario-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.scenario-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.scenario-stats span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.scenario-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.confirm-dialog .confirmation-content {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.warning-icon {
  color: #ff9800;
  font-size: 2rem;
}

.warning-text p {
  margin: 0 0 0.5rem 0;
}

.warning-text strong {
  color: #f44336;
}

:deep(.p-card) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-card-title) {
  color: white !important;
}

:deep(.p-card-content) {
  color: white !important;
}

:deep(.p-button.p-button-outlined) {
  border-color: rgba(255, 255, 255, 0.3) !important;
  color: rgba(255, 255, 255, 0.8) !important;
}

:deep(.p-button.p-button-outlined:hover) {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

:deep(.p-button.p-button-success) {
  background: #4caf50 !important;
  border-color: #4caf50 !important;
  color: white !important;
}
</style>
