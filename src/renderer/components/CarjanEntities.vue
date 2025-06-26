<template>
  <div class="carjan-entities">
    <div class="entities-header">
      <h3>
        <i class="pi pi-users"></i>
        Entity Library
      </h3>
      <p class="subtitle">Drag entities onto the grid to place them</p>
    </div>

    <!-- Entity Categories -->
    <div class="entity-categories">
      <div
        v-for="category in entityCategories"
        :key="category.id"
        class="entity-category"
      >
        <div class="category-header" @click="toggleCategory(category.id)">
          <i :class="category.icon"></i>
          <span>{{ category.name }}</span>
          <i
            :class="
              category.expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'
            "
            class="expand-icon"
          ></i>
        </div>

        <div v-if="category.expanded" class="category-content">
          <div
            v-for="entity in category.entities"
            :key="entity.type"
            class="entity-item"
            :draggable="true"
            @dragstart="handleDragStart(entity, $event)"
            @dragend="handleDragEnd"
          >
            <div class="entity-preview">
              <i :class="entity.icon" :style="{ color: entity.color }"></i>
            </div>
            <div class="entity-info">
              <div class="entity-name">{{ entity.name }}</div>
              <div class="entity-description">{{ entity.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Entities on Grid -->
    <Card class="entities-on-grid glass">
      <template #title>
        <div class="section-title">
          <i class="pi pi-map"></i>
          <span>Entities on Grid</span>
          <Badge :value="gridStore.entities.length" severity="info" />
        </div>
      </template>
      <template #content>
        <div class="grid-entities-list">
          <div
            v-for="entity in gridStore.entities"
            :key="entity.id"
            class="grid-entity-item"
            @click="selectEntity(entity)"
            :class="{ active: gridStore.selectedEntity?.id === entity.id }"
          >
            <div class="entity-preview">
              <i
                :class="getEntityIcon(entity)"
                :style="{ color: entity.color }"
              ></i>
            </div>
            <div class="entity-details">
              <div class="entity-name">
                {{ getEntityTypeName(entity.type) }}
              </div>
              <div class="entity-position">
                Row {{ entity.x }}, Col {{ entity.y }}
              </div>
              <div class="entity-heading" v-if="entity.heading">
                {{ entity.heading }}
              </div>
            </div>
            <Button
              icon="pi pi-trash"
              severity="danger"
              text
              size="small"
              @click.stop="removeEntity(entity)"
            />
          </div>

          <div v-if="gridStore.entities.length === 0" class="no-entities">
            <i class="pi pi-info-circle"></i>
            <p>No entities placed on grid</p>
            <p class="hint">Drag entities from above to place them</p>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useGridStore } from "../store/grid";
import { motion } from "motion-v";
import Card from "primevue/card";
import Button from "primevue/button";
import Badge from "primevue/badge";

const gridStore = useGridStore();

defineEmits(["entity-drag-start"]);

// State
const draggedEntity = ref(null);

// Entity definitions
const entityCategories = ref([
  {
    id: "pedestrians",
    name: "Pedestrians",
    icon: "pi pi-user",
    expanded: true,
    entities: [
      {
        type: "pedestrian",
        name: "Adult Pedestrian",
        description: "Standard adult walking on sidewalk",
        icon: "pi pi-user",
        color: "#2196F3",
        defaultModel: "walker.pedestrian.0001",
      },
      {
        type: "pedestrian",
        name: "Child Pedestrian",
        description: "Child walking with adult supervision",
        icon: "pi pi-user",
        color: "#FF9800",
        defaultModel: "walker.pedestrian.0002",
      },
    ],
  },
  {
    id: "vehicles",
    name: "Vehicles",
    icon: "pi pi-car",
    expanded: true,
    entities: [
      {
        type: "vehicle",
        name: "Standard Car",
        description: "Regular passenger vehicle",
        icon: "pi pi-car",
        color: "#4CAF50",
        defaultModel: "vehicle.tesla.model3",
      },
      {
        type: "vehicle",
        name: "Truck",
        description: "Large commercial truck",
        icon: "pi pi-car",
        color: "#795548",
        defaultModel: "vehicle.carlamotors.carlacola",
      },
      {
        type: "vehicle",
        name: "Bus",
        description: "Public transportation bus",
        icon: "pi pi-car",
        color: "#FF5722",
        defaultModel: "vehicle.mercedes-benz.sprinter",
      },
    ],
  },
  {
    id: "autonomous",
    name: "Autonomous Vehicles",
    icon: "pi pi-cog",
    expanded: false,
    entities: [
      {
        type: "autonomous",
        name: "Self-Driving Car",
        description: "Autonomous passenger vehicle",
        icon: "pi pi-cog",
        color: "#9C27B0",
        defaultModel: "vehicle.tesla.model3",
      },
      {
        type: "autonomous",
        name: "Autonomous Taxi",
        description: "Self-driving taxi service",
        icon: "pi pi-cog",
        color: "#E91E63",
        defaultModel: "vehicle.lincoln.mkz2017",
      },
    ],
  },
  {
    id: "obstacles",
    name: "Obstacles",
    icon: "pi pi-stop",
    expanded: false,
    entities: [
      {
        type: "obstacle",
        name: "Tree",
        description: "Natural obstacle - tree",
        icon: "pi pi-stop",
        color: "#4CAF50",
        defaultModel: "static.prop.tree",
      },
      {
        type: "obstacle",
        name: "Barrier",
        description: "Traffic barrier",
        icon: "pi pi-stop",
        color: "#F44336",
        defaultModel: "static.prop.barrier",
      },
      {
        type: "obstacle",
        name: "Construction Cone",
        description: "Traffic cone for construction",
        icon: "pi pi-stop",
        color: "#FF9800",
        defaultModel: "static.prop.cone",
      },
    ],
  },
]);

// Methods
const toggleCategory = (categoryId) => {
  const category = entityCategories.value.find((c) => c.id === categoryId);
  if (category) {
    category.expanded = !category.expanded;
  }
};

const handleDragStart = (entity, event) => {
  draggedEntity.value = entity;
  event.dataTransfer.setData("text/plain", entity.type);
  event.dataTransfer.setData("application/json", JSON.stringify(entity));

  // Create custom drag image
  const dragElement = event.target.cloneNode(true);
  dragElement.style.opacity = "0.8";
  dragElement.style.transform = "scale(0.9)";
  document.body.appendChild(dragElement);
  event.dataTransfer.setDragImage(dragElement, 20, 20);

  setTimeout(() => {
    document.body.removeChild(dragElement);
  }, 0);

  // Animate the original element
  motion.animate(event.target, { scale: [1, 0.95, 1] }, { duration: 0.3 });
};

const handleDragEnd = () => {
  draggedEntity.value = null;
};

const selectEntity = (entity) => {
  gridStore.selectEntity(entity);
};

const removeEntity = (entity) => {
  gridStore.removeEntity(entity.x, entity.y);
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

const getEntityTypeName = (type) => {
  const names = {
    pedestrian: "Pedestrian",
    vehicle: "Vehicle",
    autonomous: "Autonomous",
    obstacle: "Obstacle",
  };
  return names[type] || "Entity";
};

const getEntityCount = (type) => {
  return gridStore.entities.filter((e) => e.type === type).length;
};
</script>

<style scoped>
.carjan-entities {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding: 1rem;
}

.entities-header h3 {
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

.entity-categories {
  flex: 1;
}

.entity-category {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-weight: 600;
  transition: background-color 0.2s ease;
}

.category-header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.expand-icon {
  margin-left: auto;
  font-size: 0.875rem;
}

.category-content {
  padding: 0.5rem;
}

.entity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  cursor: grab;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.entity-item:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.entity-item:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.entity-preview {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 1.5rem;
}

.entity-info {
  flex: 1;
}

.entity-name {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.entity-description {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  line-height: 1.3;
}

.glass {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
}

.grid-entities-list {
  max-height: 300px;
  overflow-y: auto;
}

.grid-entity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.grid-entity-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.grid-entity-item.active {
  background: rgba(33, 150, 243, 0.2);
  border-color: #2196f3;
}

.entity-details {
  flex: 1;
}

.entity-details .entity-name {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.entity-position {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin-bottom: 0.125rem;
}

.entity-heading {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
}

.no-entities {
  text-align: center;
  padding: 2rem 1rem;
  color: rgba(255, 255, 255, 0.6);
}

.no-entities i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.4);
}

.no-entities p {
  margin: 0.5rem 0;
}

.hint {
  font-size: 0.8rem;
  font-style: italic;
}

/* PrimeVue overrides */
:deep(.p-card) {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

:deep(.p-card-title) {
  color: white !important;
  margin-bottom: 1rem !important;
}

:deep(.p-card-content) {
  color: white !important;
  padding: 1rem !important;
}

/* Scrollbar styling */
.carjan-entities::-webkit-scrollbar,
.grid-entities-list::-webkit-scrollbar {
  width: 6px;
}

.carjan-entities::-webkit-scrollbar-track,
.grid-entities-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.carjan-entities::-webkit-scrollbar-thumb,
.grid-entities-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.carjan-entities::-webkit-scrollbar-thumb:hover,
.grid-entities-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
