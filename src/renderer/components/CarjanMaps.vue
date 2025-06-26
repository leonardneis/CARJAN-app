<template>
  <div class="carjan-maps">
    <div class="maps-header">
      <h3>
        <i class="pi pi-map"></i>
        Map Library
      </h3>
      <p class="subtitle">Select and load maps for your scenario</p>
    </div>

    <Card class="maps-section glass">
      <template #title>Available Maps</template>
      <template #content>
        <div class="maps-grid">
          <div
            v-for="map in availableMaps"
            :key="map.id"
            class="map-item"
            @click="selectMap(map)"
            :class="{ active: selectedMapId === map.id }"
          >
            <div class="map-preview">
              <img :src="map.thumbnail" :alt="map.name" />
            </div>
            <div class="map-info">
              <div class="map-name">{{ map.name }}</div>
              <div class="map-description">{{ map.description }}</div>
              <div class="map-size">{{ map.size }}</div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useToast } from "primevue/usetoast";
import Card from "primevue/card";

const toast = useToast();
const selectedMapId = ref(null);

defineEmits(["map-selected"]);

const availableMaps = ref([
  {
    id: "town01",
    name: "Town01",
    description: "Basic urban environment",
    size: "12x8 grid",
    thumbnail: "/assets/maps/town01.png",
  },
  {
    id: "town02",
    name: "Town02",
    description: "Complex city layout",
    size: "15x10 grid",
    thumbnail: "/assets/maps/town02.png",
  },
]);

const selectMap = (map) => {
  selectedMapId.value = map.id;
  toast.add({
    severity: "success",
    summary: "Map Selected",
    detail: `Selected ${map.name}`,
    life: 2000,
  });
};
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

.glass {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.maps-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.map-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.map-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.map-item.active {
  background: rgba(33, 150, 243, 0.2);
  border-color: #2196f3;
}

.map-preview {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.map-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.map-info {
  flex: 1;
}

.map-name {
  color: white;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.map-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.map-size {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
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
