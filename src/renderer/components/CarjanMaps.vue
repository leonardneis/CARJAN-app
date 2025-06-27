<template>
  <div class="carjan-maps">
    <div class="maps-header">
      <h3>
        <i class="pi pi-map"></i>
        Map Library
      </h3>
      <p class="subtitle">Select and load maps for your scenario</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="maps-loading">
      <ProgressSpinner size="small" />
      <span>Loading maps...</span>
    </div>

    <!-- Category Filter -->
    <Card v-if="!loading" class="filter-section glass">
      <template #content>
        <div class="category-filter">
          <Button
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :class="{ 'p-button-success': selectedCategory === category.id }"
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
      </template>
    </Card>

    <!-- Maps Grid -->
    <Card v-if="!loading" class="maps-section glass">
      <template #title>
        Available Maps
        <Badge :value="filteredMaps.length" class="ml-2" />
      </template>
      <template #content>
        <div class="maps-grid">
          <div
            v-for="map in filteredMaps"
            :key="map.id"
            class="map-item"
            @click="selectMap(map)"
            :class="{
              active: selectedMapId === map.id,
              loading: loadingMapId === map.id,
            }"
          >
            <div class="map-preview">
              <div v-if="loadingMapId === map.id" class="map-loading-overlay">
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
                    :class="getCellClass(cell)"
                  ></div>
                </div>
              </div>
            </div>
            <div class="map-info">
              <div class="map-header">
                <div class="map-name">{{ map.name }}</div>
                <Badge
                  :value="map.difficulty"
                  :severity="getDifficultySeverity(map.difficulty)"
                  class="difficulty-badge"
                />
              </div>
              <div class="map-description">{{ map.description }}</div>
              <div class="map-meta">
                <span class="map-category">{{ map.category }}</span>
                <span class="map-size">{{ getMapSize(map) }}</span>
              </div>
            </div>
            <div v-if="selectedMapId === map.id" class="map-selected-indicator">
              <i class="pi pi-check"></i>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- Load Map Button -->
    <div v-if="selectedMapId && !loading" class="load-section">
      <Button
        label="Load Selected Map"
        icon="pi pi-download"
        @click="loadSelectedMap"
        :loading="loadingMapId !== null"
        class="load-button"
        size="large"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "primevue/usetoast";
import { useGridStore } from "../store/grid";
import MapService from "../services/MapService";
import Card from "primevue/card";
import Button from "primevue/button";
import Badge from "primevue/badge";
import ProgressSpinner from "primevue/progressspinner";

const toast = useToast();
const gridStore = useGridStore();

const selectedMapId = ref(null);
const loadingMapId = ref(null);
const loading = ref(true);
const availableMaps = ref([]);
const categories = ref([]);
const selectedCategory = ref(null);
const mapPreviews = ref({});

const emit = defineEmits(["map-selected", "map-loaded"]);

// Load maps from the new structure
const loadMapsIndex = async () => {
  try {
    const data = await MapService.loadMapsIndex();
    availableMaps.value = data.maps;
    categories.value = data.categories;

    // Load previews for each map
    for (const map of data.maps) {
      await loadMapPreview(map);
    }
  } catch (error) {
    console.error("Error loading maps index:", error);
    toast.add({
      severity: "error",
      summary: "Loading Error",
      detail: "Failed to load maps library",
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// Load map preview data
const loadMapPreview = async (map) => {
  try {
    const mapData = await MapService.loadMap(map.file);
    mapPreviews.value[map.id] = MapService.generateMapPreview(
      mapData.mapData,
      6,
      4
    );
  } catch (error) {
    console.error(`Error loading preview for ${map.id}:`, error);
    // Create fallback preview
    mapPreviews.value[map.id] = Array(6)
      .fill()
      .map(() => Array(4).fill("v"));
  }
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

const selectMap = (map) => {
  if (loadingMapId.value) return; // Prevent selection during loading

  selectedMapId.value = map.id;
  toast.add({
    severity: "info",
    summary: "Map Selected",
    detail: `Selected ${map.name}`,
    life: 2000,
  });
};

const loadSelectedMap = async () => {
  if (!selectedMapId.value || loadingMapId.value) return;

  const selectedMap = availableMaps.value.find(
    (map) => map.id === selectedMapId.value
  );

  if (!selectedMap) return;

  loadingMapId.value = selectedMapId.value;

  try {
    toast.add({
      severity: "info",
      summary: "Loading Map",
      detail: `Loading ${selectedMap.name}...`,
      life: 2000,
    });

    // Load the full map data
    const mapData = await MapService.loadMap(selectedMap.file);

    // Set the map data in grid store with stagger animation
    await loadMapWithAnimation(mapData);

    toast.add({
      severity: "success",
      summary: "Map Loaded",
      detail: `${selectedMap.name} has been loaded successfully`,
      life: 3000,
    });

    // Emit events
    emit("map-selected", selectedMap);
    emit("map-loaded", mapData);
  } catch (error) {
    console.error("Error loading map:", error);
    toast.add({
      severity: "error",
      summary: "Loading Error",
      detail: `Failed to load ${selectedMap.name}`,
      life: 3000,
    });
  } finally {
    loadingMapId.value = null;
  }
};

const loadMapWithAnimation = async (mapData) => {
  // Set loading state
  gridStore.setLoading(true);

  // Trigger the grid re-initialization to prepare for animation
  gridStore.loadMapFromData(mapData);

  // Wait for animation to complete
  await new Promise((resolve) => {
    const handleAnimationComplete = () => {
      window.removeEventListener(
        "ripple-animation-complete",
        handleAnimationComplete
      );
      resolve();
    };
    window.addEventListener(
      "ripple-animation-complete",
      handleAnimationComplete
    );

    // Trigger the animation event manually for now
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("ripple-animation-complete"));
    }, 1000);

    // Fallback timeout
    setTimeout(() => {
      window.removeEventListener(
        "ripple-animation-complete",
        handleAnimationComplete
      );
      resolve();
    }, 3000);
  });

  // Clear loading state
  gridStore.setLoading(false);
};

// Get map preview for display
const getMapPreview = (map) => {
  return mapPreviews.value[map.id] || [];
};

const getCellClass = (cellType) => {
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

const getMapSize = (map) => {
  // Try to get size from loaded preview, fallback to default
  const preview = mapPreviews.value[map.id];
  if (preview && preview.length > 0) {
    return `${preview.length}x${preview[0]?.length || 0}`;
  }
  return "12x8"; // Default size
};

// Lifecycle
onMounted(() => {
  loadMapsIndex();
});
</script>

<style scoped>
.carjan-maps {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 1rem;
}

.maps-header h3 {
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

.maps-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  justify-content: center;
  padding: 2rem;
}

.glass {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.filter-section {
  margin-bottom: 1rem;
}

.category-filter {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-btn {
  transition: all 0.2s ease;
}

.maps-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.map-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.map-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.map-item.active {
  background: rgba(33, 150, 243, 0.2);
  border-color: #2196f3;
  box-shadow: 0 0 20px rgba(33, 150, 243, 0.3);
}

.map-item.loading {
  pointer-events: none;
  opacity: 0.7;
}

.map-preview {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.map-loading-overlay {
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
  background: #333333;
}

.preview-road {
  background: #4caf50;
}

.preview-path {
  background: #2196f3;
}

.map-info {
  flex: 1;
}

.map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.map-name {
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.difficulty-badge {
  font-size: 0.75rem;
}

.map-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.map-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
}

.map-category {
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.map-size {
  color: rgba(255, 255, 255, 0.6);
}

.map-selected-indicator {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 24px;
  height: 24px;
  background: #4caf50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  animation: pulseCheck 0.5s ease-out;
}

@keyframes pulseCheck {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.load-section {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.load-button {
  background: linear-gradient(45deg, #2196f3, #21cbf3) !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.3);
  transition: all 0.3s ease;
}

.load-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}

:deep(.p-card) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-card-title) {
  color: white !important;
  display: flex;
  align-items: center;
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

:deep(.p-badge) {
  font-size: 0.75rem;
}
</style>
